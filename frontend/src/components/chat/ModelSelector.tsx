"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles, Zap, Check } from "lucide-react";
import { useChat } from "@/context/ChatContext";

export function ModelSelector() {
  const { models, selectedModel, setSelectedModel } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentModel = models.find((m) => m.id === selectedModel) || models[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
      >
        <span className="truncate">{currentModel ? currentModel.name : "Select Model"}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 md:w-80 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2f2f2f] shadow-2xl z-50 p-1.5 animate-slide-down">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60 mb-1">
            Available Inference Models
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {models.map((m) => {
              const isSelected = m.id === selectedModel;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedModel(m.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg flex items-start justify-between gap-2 transition-all ${
                    isSelected
                      ? "bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-medium"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs truncate">{m.name}</span>
                      {m.is_free && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
                          FREE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {m.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                      <span>{m.provider.toUpperCase()}</span>
                      <span>•</span>
                      <span>{m.context_window} Context</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
