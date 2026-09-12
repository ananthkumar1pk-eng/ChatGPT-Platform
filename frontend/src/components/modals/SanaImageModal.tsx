"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  ArrowRight,
  Loader2,
  Wand2,
  Maximize2,
  Ratio
} from "lucide-react";
import { ApiClient, getApiBaseUrl } from "@/lib/api";

interface SanaImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat: (imageMarkdown: string, imageUrl: string) => void;
  initialPrompt?: string;
}

const STYLE_PRESETS = [
  { id: "photorealistic", label: "Photorealistic 8K", desc: "Hasselblad 50MP, cinematic lighting" },
  { id: "anime", label: "Anime / Manga", desc: "Makoto Shinkai style, vibrant colors" },
  { id: "cyberpunk", label: "Cyberpunk Glow", desc: "Neon city, synthwave reflections" },
  { id: "digital-art", label: "Digital Art", desc: "ArtStation trending, dramatic painting" },
  { id: "cinematic-3d", label: "Cinematic 3D", desc: "Unreal Engine 5, Pixar studio 3D" },
];

const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1 Square", res: "1024x1024" },
  { id: "16:9", label: "16:9 Landscape", res: "1280x720" },
  { id: "9:16", label: "9:16 Portrait", res: "720x1280" },
  { id: "4:3", label: "4:3 Standard", res: "1024x768" },
];

const PROMPT_SUGGESTIONS = [
  "Futuristic cyberpunk city at night with glowing neon reflections and flying vehicles",
  "Ultra realistic macro photograph of a crystal hummingbird sipping glowing nectar",
  "Minimalist brutalist architecture nestled in lush tropical misty forest, morning sunrise",
  "Astronaut floating in iridescent cosmic nebula with kaleidoscopic aurora rings, 8k render",
];

export function SanaImageModal({
  isOpen,
  onClose,
  onInsertToChat,
  initialPrompt = "",
}: SanaImageModalProps) {
  const [prompt, setPrompt] = useState<string>(initialPrompt);
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [selectedStyle, setSelectedStyle] = useState<string>("photorealistic");
  const [steps, setSteps] = useState<number>(24);
  const [guidance, setGuidance] = useState<number>(5.0);
  const [seed, setSeed] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const payload = {
        prompt: prompt.trim(),
        negative_prompt: negativePrompt.trim() || undefined,
        aspect_ratio: aspectRatio,
        num_inference_steps: steps,
        guidance_scale: guidance,
        seed: seed !== null ? seed : undefined,
        style_preset: selectedStyle,
      };

      const res = await ApiClient.post<any>("/api/image/generate", payload);
      setGeneratedResult(res);
    } catch (err: any) {
      console.error("Sana 1.6B image generation failed:", err);
      alert(`Generation failed: ${err.message || "Could not generate image."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getFullImageUrl = (urlPath: string) => {
    if (!urlPath) return "";
    if (urlPath.startsWith("http")) return urlPath;
    return `${getApiBaseUrl()}${urlPath}`;
  };

  const handleInsert = () => {
    if (!generatedResult) return;
    const fullUrl = getFullImageUrl(generatedResult.image_url);
    const md = `![${generatedResult.prompt}](${fullUrl})\n\n*Generated with Sana 1.6B Linear Diffusion Transformer (${generatedResult.resolution}, Seed: \`${generatedResult.seed}\`)*`;
    onInsertToChat(md, fullUrl);
    onClose();
  };

  const handleDownload = () => {
    if (!generatedResult) return;
    const fullUrl = getFullImageUrl(generatedResult.image_url);
    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = `sana_1.6b_${generatedResult.seed}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyPromptText = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult.prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Sana 1.6B Text-to-Image Diffusion Studio
                <span className="px-2 py-0.5 text-[10px] font-mono bg-violet-500/10 text-violet-500 border border-violet-500/20 rounded-full">
                  Linear Diffusion 1.6B
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate ultra high-fidelity visual artwork and realistic imagery from text prompts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Controls Column (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-4">
            {/* Prompt input */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Prompt Description</span>
                <span className="text-[11px] font-normal text-slate-400">Sana 1.6B Prompt</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to see in detail..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none leading-relaxed"
              />

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PROMPT_SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(sug)}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[10px] text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 border border-slate-200 dark:border-zinc-700/60 truncate max-w-[220px] transition-colors"
                  >
                    ✨ {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Presets */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Artistic Style Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {STYLE_PRESETS.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.id)}
                    className={`p-2 rounded-xl text-left border text-xs transition-all ${
                      selectedStyle === st.id
                        ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300 font-bold"
                        : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <div className="truncate">{st.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setAspectRatio(ar.id)}
                    className={`p-2 rounded-xl text-center border text-xs transition-all ${
                      aspectRatio === ar.id
                        ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300 font-bold"
                        : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <div>{ar.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{ar.res}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 font-semibold"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showAdvanced ? "Hide Diffusion Parameters" : "Advanced Diffusion Parameters"}</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-3 animate-fade-in text-xs">
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 block mb-1">Negative Prompt</label>
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="e.g. blurry, watermark, distortion, bad anatomy"
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 dark:text-slate-400 block mb-1">Sampling Steps: {steps}</label>
                      <input
                        type="range"
                        min={15}
                        max={40}
                        value={steps}
                        onChange={(e) => setSteps(Number(e.target.value))}
                        className="w-full accent-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 dark:text-slate-400 block mb-1">Guidance Scale: {guidance}</label>
                      <input
                        type="range"
                        min={2.0}
                        max={10.0}
                        step={0.5}
                        value={guidance}
                        onChange={(e) => setGuidance(Number(e.target.value))}
                        className="w-full accent-violet-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generate Action Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing with Sana 1.6B Linear Diffusion...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Image (Sana 1.6B)</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Preview Canvas (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full aspect-square rounded-2xl bg-slate-900 border border-slate-200 dark:border-white/10 overflow-hidden flex items-center justify-center shadow-inner">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center p-6 text-center animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center mb-3">
                    <Sparkles className="w-8 h-8 text-violet-400 animate-spin" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">Sana 1.6B Diffusion in Progress</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Calculating linear diffusion transformer latent representations...
                  </p>
                </div>
              ) : generatedResult ? (
                <div className="relative w-full h-full group">
                  <img
                    src={getFullImageUrl(generatedResult.image_url)}
                    alt={generatedResult.prompt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={handleDownload}
                      title="Download PNG"
                      className="p-2.5 rounded-xl bg-white/90 text-slate-900 hover:bg-white transition-all shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={copyPromptText}
                      title="Copy Prompt"
                      className="p-2.5 rounded-xl bg-white/90 text-slate-900 hover:bg-white transition-all shadow-lg"
                    >
                      {copiedPrompt ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 text-slate-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">Your Sana 1.6B generated image will appear here</p>
                  <p className="text-[10px] text-slate-600 mt-1">Enter a prompt and click Generate</p>
                </div>
              )}
            </div>

            {/* Generated Metadata */}
            {generatedResult && (
              <div className="w-full mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Model: <strong>Sana 1.6B</strong></span>
                  <span>Res: <strong>{generatedResult.resolution}</strong></span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Seed: <code>{generatedResult.seed}</code></span>
                  <span>Latency: <strong>{generatedResult.latency_seconds}s</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/40">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Linear Diffusion Architecture by Efficient-Large-Model / NVIDIA / Tsinghua.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Close
            </button>
            {generatedResult && (
              <button
                onClick={handleInsert}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-all flex items-center gap-1.5 shadow-md"
              >
                <span>Insert into Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
