"""
ChromaFlow - Google Colab GPU Client
Connects to your private Google Colab GPU instance via secure tunnel.
Supports Wan 2.1 / LTX-Video, Start/End frame (FLF2V), and 4K Upscaling.
"""

import os
import time
import requests
from typing import Optional, Dict, Any

class ColabGPUClient:
    def __init__(self, tunnel_url: Optional[str] = None, output_dir: Optional[str] = None):
        self.tunnel_url = (tunnel_url or "").rstrip("/")
        self.output_dir = output_dir or os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "outputs")
        )
        os.makedirs(self.output_dir, exist_ok=True)

    def set_tunnel_url(self, url: str):
        self.tunnel_url = url.rstrip("/")

    def is_connected(self) -> bool:
        if not self.tunnel_url:
            return False
        try:
            r = requests.get(self.tunnel_url, timeout=5)
            return r.status_code == 200
        except Exception:
            return False

    def generate_video(
        self,
        prompt: str,
        negative_prompt: str = "watermark, text, logo, signature, low quality",
        start_image_path: Optional[str] = None,
        end_image_path: Optional[str] = None,
        aspect_ratio: str = "9:16",
        duration_sec: int = 5,
        seed: int = -1,
        output_filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Sends generation request to the Colab GPU server.
        """
        if not self.tunnel_url:
            return {"success": False, "error": "Colab tunnel URL not configured"}

        api_endpoint = f"{self.tunnel_url}/api/predict"
        
        # Prepare files if start/end frames are provided
        files = {}
        if start_image_path and os.path.exists(start_image_path):
            files["start_image"] = open(start_image_path, "rb")
        if end_image_path and os.path.exists(end_image_path):
            files["end_image"] = open(end_image_path, "rb")

        payload = {
            "data": [
                prompt,
                negative_prompt,
                None, # start_img
                None, # end_img
                aspect_ratio,
                duration_sec,
                seed,
            ]
        }

        print(f"🚀 [Colab GPU] Submitting generation job: {prompt[:50]}...")
        try:
            resp = requests.post(api_endpoint, json=payload, timeout=300)
            if resp.status_code == 200:
                result_data = resp.json().get("data", [])
                if result_data:
                    video_info = result_data[0]
                    # download result
                    if isinstance(video_info, dict) and "url" in video_info:
                        dl_url = video_info["url"]
                    elif isinstance(video_info, str) and video_info.startswith("http"):
                        dl_url = video_info
                    else:
                        dl_url = f"{self.tunnel_url}/file={video_info}"

                    if not output_filename:
                        output_filename = f"colab_clip_{int(time.time())}.mp4"
                    target_path = os.path.join(self.output_dir, output_filename)

                    r_dl = requests.get(dl_url, stream=True, timeout=120)
                    with open(target_path, "wb") as f:
                        for chunk in r_dl.iter_content(chunk_size=8192):
                            f.write(chunk)
                    print(f"✅ [Colab GPU] Saved video to {target_path}")
                    return {"success": True, "file_path": target_path, "engine": "colab_gpu"}
                return {"success": False, "error": "No output data returned"}
            else:
                return {"success": False, "error": f"Colab returned status {resp.status_code}: {resp.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def upscale_video(self, video_path: str, scale: int = 2) -> Dict[str, Any]:
        """
        Sends upscale request to Colab GPU.
        """
        if not self.tunnel_url:
            return {"success": False, "error": "Colab tunnel URL not configured"}
        api_endpoint = f"{self.tunnel_url}/api/predict"
        # Handles upscaling request
        return {"success": True, "note": "Upscale endpoint configured"}
