import React, { useState } from 'react';
import { X, Sparkles, FileText, Wand2 } from 'lucide-react';

interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParseScript: (scriptText: string) => void;
}

const TEMPLATES = [
  {
    name: 'Food Commercial',
    script: `Scene 1: Sizzling hot flames lick succulent chicken strips over a searing charcoal grill in cinematic slow motion.
Scene 2: Golden crispy hand-cut chips are tossed in a steel bowl with aromatic lemon spice seasoning.
Scene 3: A gourmet toasted seeded burger bun is stacked with fresh lettuce, melted cheese, and flame-grilled chicken.
Scene 4: A generous pour of signature sweet chili basting sauce cascades over the burger in ultra-macro close-up.
Scene 5: Happy customer takes the first irresistible bite, smiling with pure satisfaction against warm restaurant lighting.`,
  },
  {
    name: 'Product Reveal',
    script: `Scene 1: Sleek minimalist tech product emerges dramatically from dark volumetric fog with bright neon edge lighting.
Scene 2: Close-up macro tracking shot highlighting precision aerospace aluminum curves and matte glass finish.
Scene 3: Dynamic high-speed camera rotation showing product floating weightlessly in zero gravity.
Scene 4: Product powers on with an intense glowing core and vibrant holographic interface expanding outwards.`,
  },
];

export const ScriptModal: React.FC<ScriptModalProps> = ({
  isOpen,
  onClose,
  onParseScript,
}) => {
  const [scriptText, setScriptText] = useState(TEMPLATES[0].script);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptText.trim()) return;
    onParseScript(scriptText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#121624] border border-chroma-border rounded-3xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Input Full Script</h2>
              <p className="text-xs text-zinc-400">Paste your script to automatically break it into 5s storyboard scenes</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Quick Templates:</span>
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              type="button"
              onClick={() => setScriptText(tmpl.script)}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 transition-colors cursor-pointer"
            >
              {tmpl.name}
            </button>
          ))}
        </div>

        {/* Text Area */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            rows={9}
            placeholder="Paste your entire commercial script, scene by scene..."
            className="w-full p-4 rounded-2xl bg-zinc-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-zinc-500">
              ⚡ Will generate sequential 5-second scenes with camera direction
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-950/60 cursor-pointer transition-all"
              >
                <Wand2 className="w-4 h-4" />
                <span>Decompose into Storyboard</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
