"use client";

import React, { useState } from "react";
import { Activity, BarChart2, Eye, Layers, Sparkles, Cpu, ShieldCheck } from "lucide-react";

interface AnalyzedToken {
  token: string;
  prob: number;
  topCandidates: { word: string; prob: number }[];
  entropy: number;
  layer: number;
}

const SAMPLE_ANALYSIS: AnalyzedToken[] = [
  {
    token: "Quantum",
    prob: 0.962,
    topCandidates: [
      { word: "Quantum", prob: 0.962 },
      { word: "Classical", prob: 0.021 },
      { word: "Super", prob: 0.009 },
      { word: "Digital", prob: 0.005 },
      { word: "Neural", prob: 0.003 },
    ],
    entropy: 0.18,
    layer: 32,
  },
  {
    token: "computing",
    prob: 0.984,
    topCandidates: [
      { word: "computing", prob: 0.984 },
      { word: "mechanics", prob: 0.011 },
      { word: "systems", prob: 0.003 },
      { word: "physics", prob: 0.001 },
      { word: "theory", prob: 0.001 },
    ],
    entropy: 0.09,
    layer: 32,
  },
  {
    token: "leverages",
    prob: 0.745,
    topCandidates: [
      { word: "leverages", prob: 0.745 },
      { word: "uses", prob: 0.152 },
      { word: "utilizes", prob: 0.071 },
      { word: "harnesses", prob: 0.024 },
      { word: "applies", prob: 0.008 },
    ],
    entropy: 0.62,
    layer: 32,
  },
  {
    token: "qubits",
    prob: 0.928,
    topCandidates: [
      { word: "qubits", prob: 0.928 },
      { word: "superposition", prob: 0.045 },
      { word: "states", prob: 0.018 },
      { word: "entanglement", prob: 0.006 },
      { word: "particles", prob: 0.003 },
    ],
    entropy: 0.31,
    layer: 32,
  },
  {
    token: "in",
    prob: 0.881,
    topCandidates: [
      { word: "in", prob: 0.881 },
      { word: "to", prob: 0.072 },
      { word: "with", prob: 0.031 },
      { word: "under", prob: 0.011 },
      { word: "through", prob: 0.005 },
    ],
    entropy: 0.44,
    layer: 32,
  },
  {
    token: "superposition",
    prob: 0.953,
    topCandidates: [
      { word: "superposition", prob: 0.953 },
      { word: "parallel", prob: 0.031 },
      { word: "dual", prob: 0.011 },
      { word: "entangled", prob: 0.004 },
      { word: "multiple", prob: 0.001 },
    ],
    entropy: 0.22,
    layer: 32,
  },
];

export function LiveXRayDemo() {
  const [selectedTokenIdx, setSelectedTokenIdx] = useState(2); // 'leverages'
  const currentToken = SAMPLE_ANALYSIS[selectedTokenIdx];

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#18181b]/90 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-zinc-900/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
            LLM X-Ray: Real-Time Interpretability & Token Probabilities
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
          <Eye className="w-3 h-3" />
          <span>Layer 32 Logit Lens</span>
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-5">
        {/* Token interactive chip strip */}
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Click any token below to inspect neural logit distribution:
          </div>
          <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-100 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/5">
            {SAMPLE_ANALYSIS.map((item, idx) => {
              const isSelected = idx === selectedTokenIdx;
              const probColor =
                item.prob > 0.9
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : item.prob > 0.75
                  ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                  : "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400";

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedTokenIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition-all ${
                    isSelected
                      ? "ring-2 ring-emerald-500 shadow-md scale-105"
                      : "opacity-80 hover:opacity-100"
                  } ${probColor}`}
                >
                  <span>{item.token}</span>
                  <span className="ml-1.5 text-[10px] opacity-75 font-normal">
                    {(item.prob * 100).toFixed(0)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Breakdown of Selected Token Candidates */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Top-5 Candidate Logits */}
          <div className="md:col-span-7 p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />
                Softmax Top-5 Candidates for "{currentToken.token}"
              </span>
              <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-400">
                Entropy: {currentToken.entropy.toFixed(2)} nats
              </span>
            </div>

            <div className="space-y-2.5">
              {currentToken.topCandidates.map((cand, i) => {
                const percent = (cand.prob * 100).toFixed(1);
                const isWinner = i === 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className={isWinner ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-zinc-400"}>
                        {i + 1}. "{cand.word}"
                      </span>
                      <span className={isWinner ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-zinc-400"}>
                        {percent}%
                      </span>
                    </div>
                    {/* Probability Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isWinner
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : "bg-slate-400 dark:bg-zinc-600"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model Telemetry & Attention Matrix Badge */}
          <div className="md:col-span-5 space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                <span>Multi-Head Attention Map</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                Token <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">"{currentToken.token}"</span> exhibited peak self-attention alignment with <span className="font-mono text-emerald-500 font-bold">"Quantum"</span> across Head 4 and Head 7.
              </p>
              <div className="grid grid-cols-4 gap-1 pt-1">
                {[0.9, 0.3, 0.1, 0.8, 0.4, 0.95, 0.2, 0.7, 0.15, 0.6, 0.85, 0.3, 0.75, 0.2, 0.9, 0.4].map((v, idx) => (
                  <div
                    key={idx}
                    className="h-4 rounded bg-emerald-500 transition-opacity"
                    style={{ opacity: Math.max(0.15, v) }}
                    title={`Head attention score: ${v}`}
                  />
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-800 dark:text-cyan-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 text-cyan-500" />
              <span>Full visibility into confidence, hallucinations & model reasoning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
