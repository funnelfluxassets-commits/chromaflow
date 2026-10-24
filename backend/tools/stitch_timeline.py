"""
ChromaFlow - Timeline Shot Chainer & Audio Stitcher
Combines sequential AI clips into a finished movie with optional background music.
"""

import os
import subprocess
import tempfile
from typing import List, Optional, Dict, Any

class TimelineStitcher:
    def __init__(self, output_dir: Optional[str] = None):
        self.output_dir = output_dir or os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "outputs")
        )
        os.makedirs(self.output_dir, exist_ok=True)

    def stitch_clips(
        self,
        clip_paths: List[str],
        output_filename: str = "final_stitched_movie.mp4",
        music_file: Optional[str] = None,
        fade_out_duration: int = 2,
    ) -> Dict[str, Any]:
        """
        Concatenates video clips in order, optionally adding background music with fade-out.
        """
        valid_clips = [p for p in clip_paths if os.path.exists(p)]
        if not valid_clips:
            return {"success": False, "error": "No valid video clips provided"}

        target_output = os.path.join(self.output_dir, output_filename)
        
        # 1. Create temporary concat list file
        concat_file = os.path.join(tempfile.gettempdir(), f"concat_{os.getpid()}.txt")
        try:
            with open(concat_file, "w") as f:
                for clip in valid_clips:
                    # ffmpeg concat safe path
                    safe_path = os.path.abspath(clip).replace("'", "'\\''")
                    f.write(f"file '{safe_path}'\n")

            if music_file and os.path.exists(music_file):
                # Concat with audio and fade-out
                cmd = [
                    "ffmpeg", "-y",
                    "-f", "concat", "-safe", "0", "-i", concat_file,
                    "-i", music_file,
                    "-c:v", "libx264", "-pix_fmt", "yuv420p",
                    "-c:a", "aac",
                    "-af", f"afade=t=out:st=10:d={fade_out_duration}",
                    "-shortest",
                    target_output
                ]
            else:
                # Direct stream copy concat
                cmd = [
                    "ffmpeg", "-y",
                    "-f", "concat", "-safe", "0", "-i", concat_file,
                    "-c", "copy",
                    target_output
                ]

            print(f"🎬 [Timeline Stitcher] Joining {len(valid_clips)} clips into: {target_output}")
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            if result.returncode == 0 and os.path.exists(target_output):
                print(f"✅ Final movie created: {target_output}")
                return {"success": True, "file_path": target_output, "clip_count": len(valid_clips)}
            else:
                return {"success": False, "error": result.stderr or "FFmpeg error"}

        finally:
            if os.path.exists(concat_file):
                os.remove(concat_file)

if __name__ == "__main__":
    stitcher = TimelineStitcher()
    print("TimelineStitcher ready.")
