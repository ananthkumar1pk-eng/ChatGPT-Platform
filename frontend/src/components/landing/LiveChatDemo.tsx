"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Copy, Check, Sparkles, Cpu, Zap, Terminal, Code2 } from "lucide-react";

interface SamplePrompt {
  title: string;
  badge: string;
  model: string;
  prompt: string;
  response: string;
  codeSnippet?: {
    lang: string;
    code: string;
  };
}

const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    title: "⚡ Groq High-Speed Python Pipeline",
    badge: "320 tok/sec",
    model: "llama-3.3-70b-versatile (Groq Cloud)",
    prompt: "Write a high-performance async FastAPI endpoint with WebSocket real-time streaming and Pydantic validation.",
    response: "Here is a production-ready async FastAPI streaming handler with full Pydantic v2 schemas and bi-directional WebSocket channels:",
    codeSnippet: {
      lang: "python",
      code: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import asyncio

app = FastAPI(title="RealTime Inference Gateway")

class PromptRequest(BaseModel):
    query: str
    temperature: float = 0.7

@app.websocket("/ws/stream")
async def chat_stream_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            # Fast token-by-token streaming loop
            async for token in generate_llm_stream(data["query"]):
                await websocket.send_json({"token": token, "done": False})
            await websocket.send_json({"done": True})
    except WebSocketDisconnect:
        print("Client disconnected cleanly")`,
    },
  },
  {
    title: "📑 Multi-Turn Financial Analysis",
    badge: "GPT-4o Cloud",
    model: "gpt-4o (OpenAI)",
    prompt: "Compare Q2 vs Q3 EBITDA margin growth and break down the operational efficiency drivers.",
    response: `Based on your indexed financial statements:
1. **EBITDA Margin**: Expanded from **18.4%** in Q2 to **24.2%** in Q3 (+580 bps).
2. **Key Drivers**:
   - **Gross Margin Leverage**: Automated customer onboarding reduced SG&A by 14.3%.
   - **Infrastructure Optimization**: Transitioned to hosted cloud inference, lowering compute costs by 42%.
   - **Net ARR Expansion**: Enterprise tier retention climbed to 118%.`,
  },
  {
    title: "🔬 Transformer Attention Deep-Dive",
    badge: "Claude 3.5 Sonnet",
    model: "claude-3-5-sonnet-20241022 (Anthropic)",
    prompt: "Explain Scaled Dot-Product Attention formula and how query-key dot products compute context relevance.",
    response: `In Transformer self-attention, the scaled dot-product attention computes token alignment as follows:

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V$$

- **$QK^T$ Matrix Multiplication**: Computes the raw pairwise compatibility score between all token queries and keys.
- **$\\frac{1}{\\sqrt{d_k}}$ Scaling Factor**: Prevents the dot products from growing excessively large in high dimensions, preventing vanishing softmax gradients.
- **$\\text{Softmax}$ Normalization**: Converts raw scores into a normalized probability distribution where each row sums to 1.0.`,
  },
];

export function LiveChatDemo() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [displayedCode, setDisplayedCode] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentSample = SAMPLE_PROMPTS[selectedIdx];

  const startStreaming = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayedText("");
    setDisplayedCode("");
    setIsTyping(true);
    setTokenCount(0);

    const fullResponse = currentSample.response;
    const fullCode = currentSample.codeSnippet ? currentSample.codeSnippet.code : "";
    let textIndex = 0;
    let codeIndex = 0;

    intervalRef.current = setInterval(() => {
      if (textIndex < fullResponse.length) {
        // Stream text in chunks of 2-4 chars for realistic high-speed typing
        textIndex += Math.min(3, fullResponse.length - textIndex);
        setDisplayedText(fullResponse.slice(0, textIndex));
        setTokenCount((prev) => prev + 1);
      } else if (fullCode && codeIndex < fullCode.length) {
        codeIndex += Math.min(5, fullCode.length - codeIndex);
        setDisplayedCode(fullCode.slice(0, codeIndex));
        setTokenCount((prev) => prev + 2);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsTyping(false);
      }
    }, 18);
  };

  useEffect(() => {
    startStreaming();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedIdx]);

  const handleCopy = () => {
    const textToCopy = currentSample.codeSnippet
      ? `${currentSample.response}\n\n${currentSample.codeSnippet.code}`
      : currentSample.response;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#18181b]/90 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
      {/* Top Demo Bar */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-zinc-900/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-xs font-mono font-medium text-slate-500 dark:text-zinc-400 ml-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            Live SSE Token Stream Sandbox
          </span>
        </div>

        {/* Model Indicator & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium">
            <Zap className="w-3 h-3 animate-pulse" />
            <span>{currentSample.badge}</span>
          </div>

          <button
            onClick={startStreaming}
            disabled={isTyping}
            className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Replay Stream"
          >
            <RotateCcw className={`w-3 h-3 ${isTyping ? "animate-spin" : ""}`} />
            <span>Replay</span>
          </button>
        </div>
      </div>

      {/* Preset Prompt Switcher Pills */}
      <div className="p-3 bg-slate-50 dark:bg-zinc-950/40 border-b border-slate-200 dark:border-white/5 flex gap-2 overflow-x-auto">
        {SAMPLE_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedIdx(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedIdx === idx
                ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "bg-slate-200/50 dark:bg-zinc-900 border border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800"
            }`}
          >
            <span>{item.title}</span>
          </button>
        ))}
      </div>

      {/* Interactive Chat Canvas */}
      <div className="p-5 md:p-6 space-y-4 font-sans text-sm min-h-[340px] flex flex-col justify-between">
        <div className="space-y-4">
          {/* User Message Bubble */}
          <div className="flex gap-3 items-start max-w-2xl">
            <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
              You
            </div>
            <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-zinc-100 font-medium text-xs md:text-sm">
              {currentSample.prompt}
            </div>
          </div>

          {/* Assistant Stream Response */}
          <div className="flex gap-3 items-start max-w-3xl">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
                  Assistant
                </span>
                <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                  via {currentSample.model}
                </span>
              </div>

              {/* Text Body */}
              <div className="text-slate-800 dark:text-zinc-200 leading-relaxed text-xs md:text-sm whitespace-pre-line">
                {displayedText}
                {isTyping && !displayedCode && (
                  <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse align-middle" />
                )}
              </div>

              {/* Syntax Highlighted Code Box (if present) */}
              {currentSample.codeSnippet && displayedCode && (
                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-900 text-zinc-100 font-mono text-xs overflow-hidden shadow-inner">
                  <div className="px-3 py-1.5 bg-slate-950/80 border-b border-zinc-800 flex items-center justify-between text-zinc-400 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{currentSample.codeSnippet.lang}</span>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? "Copied" : "Copy code"}</span>
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-[11px] md:text-xs leading-relaxed text-emerald-300">
                    <code>{displayedCode}</code>
                    {isTyping && (
                      <span className="inline-block w-2 h-3.5 ml-1 bg-emerald-400 animate-pulse align-middle" />
                    )}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Stream Telemetry Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-500 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isTyping ? "bg-emerald-500 animate-ping" : "bg-emerald-500"}`} />
              {isTyping ? "Streaming tokens..." : "Generation Complete"}
            </span>
            <span>•</span>
            <span>Tokens: ~{tokenCount}</span>
            <span>•</span>
            <span>Latency: ~42ms TTFT</span>
          </div>

          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>100% Hosted Cloud Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
