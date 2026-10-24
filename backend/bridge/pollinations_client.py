"""
ChromaFlow - Pollinations AI Video Client
100% Free, Zero-Setup, Watermark-Free Video Generation Engine
"""

import os
import time
import urllib.parse
import requests
from typing import Optional, Dict, Any

DEFAULT_NEGATIVE_PROMPT = "watermark, text, logo, signature, low quality, blurry, distorted"

class PollinationsClient:
    def __init__(self, output_dir: Optional[str] = None):
        self.base_url = "https://image.pollinations.ai/prompt"
        self.output_dir = output_dir or os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "outputs")
        )
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_video(
        self,
        prompt: str,
        negative_prompt: str = DEFAULT_NEGATIVE_PROMPT,
        aspect_ratio: str = "9:16",
        seed: Optional[int] = None,
        output_filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generates a video clip from text using Pollinations AI.
        """
        # Dimensions based on aspect ratio
        if aspect_ratio == "9:16":
            width, height = 720, 1280
        elif aspect_ratio == "16:9":
            width, height = 1280, 720
        else:
            width, height = 1024, 1024

        clean_prompt = f"{prompt.strip()}, clean cinematic footage, highly detailed"
        if negative_prompt:
            clean_prompt += f" --no {negative_prompt.strip()}"

        encoded_prompt = urllib.parse.quote(clean_prompt)
        seed_param = f"&seed={seed}" if seed is not None else f"&seed={int(time.time())}"
        
        # Pollinations video generation endpoint
        url = f"https://pollinations.ai/api/generate/video?prompt={encoded_prompt}&width={width}&height={height}&model=video{seed_param}"
        
        if not output_filename:
            output_filename = f"clip_{int(time.time())}.mp4"
        
        target_path = os.path.join(self.output_dir, output_filename)
        
        print(f"🎬 [Pollinations AI] Requesting generation: {prompt[:50]}...")
        try:
            response = requests.get(url, timeout=120, stream=True)
            if response.status_code == 200:
                with open(target_path, "wb") as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                print(f"✅ Video saved successfully: {target_path}")
                return {
                    "success": True,
                    "file_path": target_path,
                    "engine": "pollinations",
                    "aspect_ratio": aspect_ratio,
                }
            else:
                return {
                    "success": False,
                    "error": f"Pollinations returned status {response.status_code}",
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }


if __name__ == "__main__":
    client = PollinationsClient()
    print("Testing Pollinations Video Client initialized.")
