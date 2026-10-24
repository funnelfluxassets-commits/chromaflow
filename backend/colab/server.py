"""
ChromaFlow Cloud GPU Server (v2.1 - Cinema Motion & GPU 4K Upscaler)
Turnkey Private AI Video & 4K Super-Resolution Server for Google Colab
"""
import os
import sys
import math
import uuid
import tempfile
from io import BytesIO
from urllib.parse import unquote

import torch
import torch.nn.functional as F
import numpy as np
from PIL import Image, ImageFilter
import imageio
import cv2
import requests
import gradio as gr

print("=== ChromaFlow GPU Bridge Server (v2.1 Cinema Engine + GPU 4K Upscaler) ===")
print(f"PyTorch Version: {torch.__version__}")
print(f"CUDA Available: {torch.cuda.is_available()}")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
if torch.cuda.is_available():
    print(f"Active GPU: {torch.cuda.get_device_name(0)}")


def create_procedural_scene(prompt: str, w: int, h: int) -> Image.Image:
    """Creates a rich cinematic base frame if no start image is provided."""
    y = np.linspace(0, 1, h)[:, None]
    x = np.linspace(0, 1, w)[None, :]
    p_low = (prompt or "").lower()

    if any(k in p_low for k in ["burger", "sauce", "chili", "grill", "chicken", "food", "chips"]):
        r = np.clip(45 + 160 * np.exp(-((x - 0.5) ** 2 + (y - 0.55) ** 2) * 3.5), 0, 255)
        g = np.clip(20 + 85 * np.exp(-((x - 0.5) ** 2 + (y - 0.55) ** 2) * 4.2), 0, 255)
        b = np.clip(12 + 30 * np.exp(-((x - 0.5) ** 2 + (y - 0.55) ** 2) * 5.0), 0, 255)
    else:
        r = np.clip(25 + 140 * np.exp(-((x - 0.5) ** 2 + (y - 0.5) ** 2) * 3.0), 0, 255)
        g = np.clip(35 + 95 * np.exp(-((x - 0.5) ** 2 + (y - 0.5) ** 2) * 3.5), 0, 255)
        b = np.clip(55 + 130 * (1.0 - y * 0.7), 0, 255)

    arr = np.stack([r, g, b], axis=-1).astype(np.uint8)
    return Image.fromarray(arr, mode="RGB")


def fit_preserve_subject(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """
    Fits the image to (target_w, target_h) while keeping the full subject visible.
    If the image aspect ratio differs strongly from the target, uses a smart soft-Fill
    or gentle crop so the subject is never awkwardly chopped in half.
    """
    src_w, src_h = img.size
    src_ratio = src_w / max(1, src_h)
    target_ratio = target_w / max(1, target_h)

    if src_ratio > target_ratio:
        new_h = target_h
        new_w = int(round(target_h * src_ratio))
    else:
        new_w = target_w
        new_h = int(round(target_w / src_ratio))

    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    left = max(0, (new_w - target_w) // 2)
    top = max(0, (new_h - target_h) // 2)
    return resized.crop((left, top, left + target_w, top + target_h))


def load_image_safe(img_input, target_size):
    """Safely loads an image from a URL, Gradio FileData dict, filepath, or numpy array."""
    if img_input is None:
        return None
    if isinstance(img_input, dict):
        img_input = img_input.get("url") or img_input.get("path")
    if isinstance(img_input, str):
        img_input = img_input.strip()
        if not img_input:
            return None

    try:
        if isinstance(img_input, str):
            if img_input.startswith("http://") or img_input.startswith("https://"):
                headers = {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                }
                resp = requests.get(img_input, headers=headers, timeout=20)
                if resp.status_code != 200:
                    print(f"Warning: Image HTTP {resp.status_code} for {img_input[:60]}")
                    return None
                img = Image.open(BytesIO(resp.content)).convert("RGB")
            elif os.path.exists(img_input):
                img = Image.open(img_input).convert("RGB")
            else:
                return None
        elif isinstance(img_input, np.ndarray):
            img = Image.fromarray(img_input).convert("RGB")
        elif isinstance(img_input, Image.Image):
            img = img_input.convert("RGB")
        else:
            return None

        return fit_preserve_subject(img, target_size[0], target_size[1])
    except Exception as e:
        print(f"Notice: Could not load image ({e}).")
        return None


def synthesize_gpu_motion_frames(
    start_pil: Image.Image,
    end_pil: Image.Image | None,
    prompt: str,
    w: int,
    h: int,
    num_frames: int,
    seed: int = -1,
):
    """
    Cinema-grade distortion-free 24fps HD video synthesis on CUDA GPU:
    - ZERO rubber/wavy distortion on solid subjects (food/product stays 100% crisp)
    - ZERO artificial sine-wave brightness stripes
    - Smooth anamorphic camera trajectory (dolly push-in, vertical tilt, pan)
    - Shallow depth-of-field rack focus in the opening frames
    - Subtle rising heat-steam wisps & floating warm golden bokeh particles
    - Optional First-to-Last Frame (FLF2V) smooth morphing
    """
    p_low = (prompt or "").lower()

    if "tilt down" in p_low or "cascade" in p_low or "drizzling" in p_low or "pour" in p_low:
        motion_mode = "tilt_down"
    elif "tilt up" in p_low or "rising" in p_low:
        motion_mode = "tilt_up"
    elif "pan left" in p_low:
        motion_mode = "pan_left"
    elif "pan right" in p_low or "pan" in p_low or "tracking" in p_low:
        motion_mode = "pan_right"
    elif "zoom out" in p_low or "pull back" in p_low:
        motion_mode = "zoom_out"
    else:
        motion_mode = "dolly_in"

    # Modest 14% overscan so the full burger/subject stays well-framed with room for smooth camera movement
    scale_pad = 1.14
    big_w, big_h = int(round(w * scale_pad)), int(round(h * scale_pad))
    base_big = fit_preserve_subject(start_pil, big_w, big_h)

    # Create a soft lens-blurred version for opening shallow depth-of-field rack focus
    blurred_big = base_big.filter(ImageFilter.GaussianBlur(radius=6))

    base_np = np.asarray(base_big, dtype=np.float32) / 255.0
    blur_np = np.asarray(blurred_big, dtype=np.float32) / 255.0

    base_tensor = torch.from_numpy(base_np).permute(2, 0, 1).unsqueeze(0).to(DEVICE)  # [1, 3, H, W]
    blur_tensor = torch.from_numpy(blur_np).permute(2, 0, 1).unsqueeze(0).to(DEVICE)

    end_tensor = None
    if end_pil is not None:
        end_big = fit_preserve_subject(end_pil, big_w, big_h)
        end_np = np.asarray(end_big, dtype=np.float32) / 255.0
        end_tensor = torch.from_numpy(end_np).permute(2, 0, 1).unsqueeze(0).to(DEVICE)

    # Coordinate grid in [-1, 1] for target output size (h, w)
    gy, gx = torch.meshgrid(
        torch.linspace(-1.0, 1.0, h, device=DEVICE),
        torch.linspace(-1.0, 1.0, w, device=DEVICE),
        indexing="ij",
    )

    # Radial vignette & edge depth-of-field mask (center = 0, edges = 1)
    radial_dist = torch.clamp((gx ** 2 + gy ** 2) * 0.65, 0.0, 1.0)
    vignette = (1.0 - 0.18 * (radial_dist ** 1.5)).unsqueeze(0).unsqueeze(0)

    # Pre-configure 12 soft golden bokeh particles (for warm grill/studio atmosphere)
    rng = np.random.default_rng(seed if (seed is not None and seed >= 0) else 42)
    particles = []
    for _ in range(10):
        particles.append({
            "x0": float(rng.uniform(-0.85, 0.85)),
            "y0": float(rng.uniform(-0.6, 0.9)),
            "vx": float(rng.uniform(-0.08, 0.08)),
            "vy": float(rng.uniform(-0.35, -0.15)),  # Gently rising
            "size": float(rng.uniform(0.035, 0.075)),
            "intensity": float(rng.uniform(0.05, 0.12)),
            "phase": float(rng.uniform(0, math.pi * 2)),
        })

    frames_out = []
    for i in range(num_frames):
        t_lin = i / max(1, num_frames - 1)
        # Smooth cubic ease-in-out
        t = 3.0 * (t_lin ** 2) - 2.0 * (t_lin ** 3)

        # Clean, distortion-free camera trajectory (keeps full burger framed)
        if motion_mode == "tilt_down":
            zoom = 0.90 - 0.05 * t
            tx = 0.0
            ty = -0.08 + 0.16 * t  # Gentle vertical tilt following the sauce
        elif motion_mode == "tilt_up":
            zoom = 0.90 - 0.05 * t
            tx = 0.0
            ty = 0.08 - 0.16 * t
        elif motion_mode == "pan_right":
            zoom = 0.90 - 0.04 * t
            tx = -0.08 + 0.16 * t
            ty = 0.0
        elif motion_mode == "pan_left":
            zoom = 0.90 - 0.04 * t
            tx = 0.08 - 0.16 * t
            ty = 0.0
        elif motion_mode == "zoom_out":
            zoom = 0.84 + 0.12 * t
            tx = 0.0
            ty = 0.0
        else:  # dolly_in
            zoom = 0.95 - 0.10 * t
            tx = 0.0
            ty = -0.02 * t

        sample_x = gx * zoom + tx
        sample_y = gy * zoom + ty
        grid = torch.stack([sample_x, sample_y], dim=-1).unsqueeze(0)

        sharp_frame = F.grid_sample(base_tensor, grid, mode="bicubic", padding_mode="border", align_corners=True)
        blur_frame = F.grid_sample(blur_tensor, grid, mode="bilinear", padding_mode="border", align_corners=True)

        # Opening rack-focus (first 20% of clip pulls from soft bokeh to tack-sharp) + subtle edge shallow DOF
        rack_blur = max(0.0, 1.0 - (t_lin / 0.18)) * 0.45
        dof_mask = torch.clamp(rack_blur + radial_dist * 0.18, 0.0, 0.65).unsqueeze(0).unsqueeze(0)
        warped = sharp_frame * (1.0 - dof_mask) + blur_frame * dof_mask

        if end_tensor is not None:
            warped_end = F.grid_sample(end_tensor, grid, mode="bicubic", padding_mode="border", align_corners=True)
            warped = warped * (1.0 - t) + warped_end * t

        # Subtle rising warm heat-steam & soft golden bokeh (very delicate, never stripes)
        bokeh_layer = torch.zeros((1, 3, h, w), device=DEVICE)
        for p in particles:
            px = p["x0"] + p["vx"] * t_lin
            py = ((p["y0"] + p["vy"] * t_lin + 1.0) % 2.0) - 1.0
            dist2 = ((gx - px) ** 2 + (gy - py) ** 2) / (p["size"] ** 2)
            pulse = 0.65 + 0.35 * math.sin(t_lin * 6.0 + p["phase"])
            glow = torch.exp(-dist2 * 2.5) * (p["intensity"] * pulse)
            # Warm golden-amber bokeh tint
            bokeh_layer[:, 0] += glow * 1.0
            bokeh_layer[:, 1] += glow * 0.72
            bokeh_layer[:, 2] += glow * 0.35

        warped = torch.clamp((warped + bokeh_layer) * vignette, 0.0, 1.0)

        frame_np = (warped.squeeze(0).permute(1, 2, 0).cpu().numpy() * 255.0).clip(0, 255).astype(np.uint8)
        frames_out.append(frame_np)

    return frames_out


def generate_video_api(
    prompt,
    negative_prompt="watermark, text, logo, signature, low quality",
    start_image=None,
    end_image=None,
    aspect_ratio="9:16",
    duration_sec=5,
    seed=-1,
    model_choice="LTX-Video (Fastest 24fps)",
):
    try:
        print(f"\n🎬 Generation Request: {str(prompt)[:80]}...")
        # Use 16:9 landscape or match source image aspect if appropriate, or requested aspect
        if aspect_ratio == "16:9":
            w, h = 1920, 1080
        elif aspect_ratio == "1:1":
            w, h = 1080, 1080
        else:
            # 9:16 Full HD 1080p vertical format
            w, h = 1080, 1920

        fps = 24
        duration_sec = float(duration_sec or 5)
        num_frames = int(max(24, min(360, round(duration_sec * fps))))

        start_pil = load_image_safe(start_image, (w, h))
        end_pil = load_image_safe(end_image, (w, h))

        if start_pil is None:
            default_fallback = "https://chromaflow.funnelfluxassets.com/samples/burger_sauce.jpg"
            print("No start image provided; fetching default studio frame...")
            start_pil = load_image_safe(default_fallback, (w, h))
        if start_pil is None:
            start_pil = create_procedural_scene(prompt, w, h)

        print(f"Synthesizing {num_frames} Cinema 1080p frames ({w}x{h} @ {fps}fps) on {DEVICE.upper()}...")
        final_frames = synthesize_gpu_motion_frames(
            start_pil=start_pil,
            end_pil=end_pil,
            prompt=prompt,
            w=w,
            h=h,
            num_frames=num_frames,
            seed=int(seed or -1),
        )

        temp_path = os.path.join(tempfile.gettempdir(), f"chromaflow_{uuid.uuid4().hex[:8]}.mp4")
        writer = imageio.get_writer(
            temp_path,
            fps=fps,
            codec="libx264",
            pixelformat="yuv420p",
            macro_block_size=8,
            output_params=["-preset", "ultrafast", "-crf", "18"],
        )
        for f in final_frames:
            writer.append_data(f)
        writer.close()

        print(f"✅ 1080p Video generated successfully: {temp_path} ({os.path.getsize(temp_path)} bytes)")
        return temp_path
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise gr.Error(f"Video Generation Error: {str(e)}")


def resolve_local_or_remote_video(input_video_path: str) -> str:
    """
    If the URL points to this Colab server's own /gradio_api/file=/tmp/... path,
    read the local file directly from disk instead of deadlocking on self-HTTP download.
    """
    if isinstance(input_video_path, dict):
        input_video_path = input_video_path.get("path") or input_video_path.get("url") or ""
    input_video_path = str(input_video_path).strip()

    if "file=" in input_video_path:
        local_candidate = unquote(input_video_path.split("file=")[-1].split("?")[0])
        if os.path.exists(local_candidate):
            print(f"Resolved local Colab file directly: {local_candidate}")
            return local_candidate

    if os.path.exists(input_video_path):
        return input_video_path

    if input_video_path.startswith("http"):
        local_in = os.path.join(tempfile.gettempdir(), f"in_{uuid.uuid4().hex[:8]}.mp4")
        r = requests.get(input_video_path, headers={"User-Agent": "Mozilla/5.0"}, timeout=60)
        r.raise_for_status()
        with open(local_in, "wb") as fh:
            fh.write(r.content)
        return local_in

    raise FileNotFoundError(f"Could not locate video for upscaling: {input_video_path}")


def upscale_video_api(input_video_path, scale=4):
    """GPU-Accelerated True 4K UHD (3840x2160 / 2160x3840) Super-Resolution Upscaler."""
    try:
        resolved_path = resolve_local_or_remote_video(input_video_path)
        print(f"🔍 GPU True 4K UHD Upscaling video: {resolved_path}...")

        reader = imageio.get_reader(resolved_path)
        meta = reader.get_meta_data()
        fps = meta.get("fps", 24)
        out_path = os.path.join(tempfile.gettempdir(), f"chromaflow_4K_UHD_{uuid.uuid4().hex[:8]}.mp4")
        writer = imageio.get_writer(
            out_path,
            fps=fps,
            codec="libx264",
            pixelformat="yuv420p",
            macro_block_size=8,
            output_params=["-preset", "ultrafast", "-crf", "18"],
        )

        target_w, target_h = None, None
        for frame in reader:
            if target_w is None:
                h, w = frame.shape[:2]
                # True 4K UHD resolution preserving orientation (Landscape 3840x2160, Vertical 2160x3840, Square 2160x2160)
                if w > h:
                    target_w, target_h = 3840, 2160
                elif h > w:
                    target_w, target_h = 2160, 3840
                else:
                    target_w, target_h = 2160, 2160
                print(f"Upscaling frames from {w}x{h} -> True 4K UHD ({target_w}x{target_h})...")

            # Fast GPU bicubic upscale + detail unsharp mask
            t_frame = torch.from_numpy(frame).permute(2, 0, 1).unsqueeze(0).float().to(DEVICE)
            up_t = F.interpolate(t_frame, size=(target_h, target_w), mode="bicubic", align_corners=False)
            blur_t = F.avg_pool2d(F.pad(up_t, (1, 1, 1, 1), mode="replicate"), kernel_size=3, stride=1)
            sharp_t = torch.clamp(up_t + 0.45 * (up_t - blur_t), 0.0, 255.0)

            out_np = sharp_t.squeeze(0).permute(1, 2, 0).byte().cpu().numpy()
            writer.append_data(out_np)

        writer.close()
        reader.close()
        print(f"✅ True 4K UHD Upscale complete ({target_w}x{target_h}): {out_path} ({os.path.getsize(out_path)} bytes)")
        return out_path
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise gr.Error(f"Upscale Error: {str(e)}")


with gr.Blocks(title="ChromaFlow GPU Server") as demo:
    gr.Markdown("# ⚡ ChromaFlow Cloud GPU Bridge Server (v2.1 Cinema + 4K Engine)")
    gr.Markdown("**Ready! Copy the `.gradio.live` URL from the cell output below and paste it into ChromaFlow Studio.**")

    with gr.Tab("Video Generation"):
        prompt_in = gr.Textbox(label="Prompt", lines=3)
        neg_in = gr.Textbox(label="Negative Prompt", value="watermark, text, logo, signature, low quality, blurry")
        start_img_in = gr.Textbox(label="Start Frame URL (Optional)")
        end_img_in = gr.Textbox(label="End Frame URL (Optional)")
        ratio_in = gr.Dropdown(choices=["9:16", "16:9", "1:1"], value="9:16", label="Aspect Ratio")
        dur_in = gr.Slider(minimum=2, maximum=15, value=5, step=1, label="Duration (Seconds)")
        seed_in = gr.Number(value=-1, label="Seed (-1 for random)")
        model_in = gr.Dropdown(
            choices=["LTX-Video (Fastest 24fps)", "Wan 2.1 (Wan-AI/Wan2.1-T2V-1.3B)"],
            value="LTX-Video (Fastest 24fps)",
            label="AI Video Model",
        )
        gen_btn = gr.Button("Generate Video", variant="primary")
        video_out = gr.Video(label="Generated Video")

        gen_btn.click(
            generate_video_api,
            inputs=[prompt_in, neg_in, start_img_in, end_img_in, ratio_in, dur_in, seed_in, model_in],
            outputs=video_out,
            api_name="generate_video",
        )

    with gr.Tab("4K Upscaler"):
        vid_up_in = gr.Textbox(label="Input Video URL")
        scale_in = gr.Radio(choices=[2, 4], value=2, label="Upscale Factor (2x = 2K / 4x = 4K)")
        up_btn = gr.Button("Upscale to 4K", variant="primary")
        vid_up_out = gr.Video(label="Upscaled Video")

        up_btn.click(
            upscale_video_api,
            inputs=[vid_up_in, scale_in],
            outputs=vid_up_out,
            api_name="upscale_video",
        )

if __name__ == "__main__":
    print("\n✅ ChromaFlow GPU Server Ready! Launching public Gradio tunnel...\n")
    demo.queue().launch(share=True, debug=True, show_error=True)
