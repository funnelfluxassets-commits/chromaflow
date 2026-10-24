"""
ChromaFlow - AI Script-to-Scenes Decomposition Engine
Breaks full scripts into visual storyboard scenes while enforcing
Character and Style Reference Guides for consistent outputs.
"""

import re
from typing import List, Dict, Any, Optional

STYLE_PRESETS = {
    "cinematic_35mm": "cinematic 35mm film still, Kodak Vision3 500T, shallow depth of field, anamorphic lens flare, natural soft lighting, hyper-detailed",
    "hyperrealistic_commercial": "high-end luxury 8k commercial shoot, studio rim lighting, pristine clean focus, Hasselblad camera, crisp textures",
    "vibrant_food_studio": "mouth-watering macro commercial food cinematography, warm dramatic backlight, steam wafting, rich appetite appeal, cinematic slow motion",
    "moody_film_noir": "moody dark film noir aesthetic, strong chiaroscuro contrast, atmospheric shadows, volumetric haze, gritty cinematic realism",
    "anime_ghibli": "Studio Ghibli inspired anime aesthetic, hand-painted lush background, vibrant watercolor tones, whimsical lighting, Makoto Shinkai sky",
    "cyberpunk_neon": "futuristic cyberpunk aesthetic, glowing neon reflections on wet pavement, volumetric magenta and cyan lighting, Blade Runner 2049 cinematography",
}

class ScriptParser:
    def __init__(self):
        pass

    def parse_script(
        self,
        script_text: str,
        character_name: Optional[str] = None,
        character_description: Optional[str] = None,
        style_preset: str = "cinematic_35mm",
        custom_style_prompt: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Splits a raw script into structured storyboard scenes.
        """
        lines = [line.strip() for line in script_text.strip().split("\n") if line.strip()]
        
        # Build style modifier
        style_anchor = custom_style_prompt.strip() if custom_style_prompt else STYLE_PRESETS.get(style_preset, STYLE_PRESETS["cinematic_35mm"])
        
        # Character anchor
        char_anchor = ""
        if character_description:
            char_anchor = f"featuring {character_description.strip()}"
        elif character_name:
            char_anchor = f"featuring {character_name.strip()}"

        raw_scenes = []
        current_scene = []
        
        for line in lines:
            # Check for scene headings like "Scene 1", "SCENE 2:", "[Scene 3]"
            if re.match(r"^(?:scene|\#|shot)\s*\d+[:\-\.]?", line, re.IGNORECASE):
                if current_scene:
                    raw_scenes.append(" ".join(current_scene))
                    current_scene = []
                current_scene.append(line)
            else:
                current_scene.append(line)
                
        if current_scene:
            raw_scenes.append(" ".join(current_scene))
            
        # Fallback if no explicit "Scene X" tags were found: split by paragraphs or sentence blocks
        if len(raw_scenes) <= 1 and len(lines) > 1:
            raw_scenes = []
            chunk = []
            for i, line in enumerate(lines):
                chunk.append(line)
                if len(chunk) >= 2 or i == len(lines) - 1:
                    raw_scenes.append(" ".join(chunk))
                    chunk = []

        parsed_scenes = []
        for idx, scene_text in enumerate(raw_scenes, 1):
            # Clean heading
            clean_text = re.sub(r"^(?:scene|\#|shot)\s*\d+[:\-\.]?\s*", "", scene_text, flags=re.IGNORECASE).strip()
            
            # Formulate prompts
            visual_prompt_parts = []
            if char_anchor:
                visual_prompt_parts.append(char_anchor)
            visual_prompt_parts.append(clean_text)
            visual_prompt_parts.append(style_anchor)
            
            full_visual_prompt = ", ".join([p for p in visual_prompt_parts if p])
            motion_prompt = f"Cinematic smooth motion, camera gently pans while {clean_text.lower()}"

            parsed_scenes.append({
                "scene_number": idx,
                "title": f"Scene {idx}",
                "narration": clean_text,
                "visual_prompt": full_visual_prompt,
                "motion_prompt": motion_prompt,
                "duration_sec": 5,
                "status": "ready",
                "video_url": None,
                "start_image": None,
                "end_image": None,
            })
            
        return parsed_scenes
