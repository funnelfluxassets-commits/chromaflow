# 🎬 ChromaFlow — AI Script-to-Video Production Studio

An open-source, OpenArt-inspired AI video generation suite. Input full scripts to automatically create consistent, watermark-free storyboard sequences with dual-engine generation, start/end frame transitions, 4K upscaling, and timeline stitching.

🌐 **Live Web App:** [https://chromaflow.funnelfluxassets.com](https://chromaflow.funnelfluxassets.com)

---

## 🚀 Quick Start (Local Studio Web App)

1. Open your terminal in the `studio/` folder:
   ```bash
   cd "/Volumes/WDB-2TB-B/App Projects/ChromaFlow/studio"
   npm run dev
   ```
2. Open your browser at: **`http://localhost:5174`** (or use the live Cloudflare Pages URL above).

---

## ⚡ Supported AI Video Engines

### Engine 1: Kling 2.6 (Hollywood-Grade 60fps via Kie.ai)
* Connected by default with Kie.ai integration.
* Automatically synthesizes 2K photorealistic starting frames using **NanoBanana Pro** and animates them with **Kling 2.6**.
* Real-time multi-phase rendering progress with live elapsed time and state tracking.
* Configure or top up your API key in **Settings** (`https://kie.ai/api-key`).

### Engine 2: Google Colab Private Cloud GPU (100% Free Wan 2.1 / LTX-Video)
* Located at: `backend/colab/ChromaFlow_GPU_Backend.ipynb`
* **How to run:**
  1. Open [Google Colab](https://colab.research.google.com/) and upload `backend/colab/ChromaFlow_GPU_Backend.ipynb`.
  2. Set runtime to **T4 GPU** (or A100).
  3. Click **Runtime** > **Run all**.
  4. Copy the public tunnel link (e.g., `https://xxxx.gradio.live`).
  5. In ChromaFlow Studio, click the **Settings (Sliders)** icon, paste the link, and click **Save**.
* Routes all rendering, First & Last frame interpolation, and 4K upscaling to your private, free Google GPU!

---

## 🎨 Creative Consistency Guides (OpenArt Style)

1. **Character Reference Guide:** Upload photos and lock in character visual traits so the actor/product looks identical in every scene.
2. **Scene Style Reference Guide:** Pick a cinematic preset (*Cinematic 35mm, Hyperrealistic Commercial, Vibrant Food Studio, Film Noir, Anime, Cyberpunk*) or upload a mood board to synchronize color grading and lighting across all cuts.
3. **Start & End Frame (FLF2V):** Generate 2K visual frames with 1-click or upload your own start & end images on any scene card to create seamless camera transformations.
4. **Timeline Stitcher:** Add background audio and click **"Stitch Final Movie"** to export your complete multi-shot movie.
5. **100% Watermark-Free:** Anti-watermark safeguards (`watermark, text, branding, logo, signature`) are automatically injected into all prompts.
