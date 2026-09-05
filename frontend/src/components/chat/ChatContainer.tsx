"use client";

import React, { useEffect, useRef } from "react";
import { Sparkles, Code, FileText, Lightbulb, Compass, ArrowDown } from "lucide-react";
import { MessageItem } from "./MessageItem";
import { useChat } from "@/context/ChatContext";

const STARTER_PROMPTS = [
  {
    icon: Lightbulb,
    title: "Explain a Complex Concept",
    desc: "Understand quantum computing in simple intuitive terms",
    prompt: "Explain how quantum computing works and why quantum superposition allows faster computation in simple terms with an example.",
  },
  {
    icon: Code,
    title: "Write High-Performance Code",
    desc: "Develop an async FastAPI endpoint with WebSocket support",
    prompt: "Write a high-performance async FastAPI backend endpoint with WebSockets and error handling in Python.",
  },
  {
    icon: FileText,
    title: "Document Q&A with RAG",
    desc: "Upload a PDF or CSV and extract key insights & citations",
    prompt: "Summarize the key findings and structured statistics from my attached documents with page citations.",
  },
  {
    icon: Compass,
    title: "Brainstorm Architecture",
    desc: "Design a scalable microservices cloud infrastructure",
    prompt: "Compare PostgreSQL vs MongoDB for high-throughput multi-tenant SaaS applications with pros and cons.",
  },
];

interface ChatContainerProps {
  onOpenUpload?: () => void;
}

export function ChatContainer({ onOpenUpload }: ChatContainerProps) {
  const { messages, sendMessage, isStreaming, selectedModel, selectedProvider } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" });
  }, [messages, isStreaming]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto flex flex-col">
      {messages.length === 0 ? (
        // Empty State / Hero Screen
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto my-auto animate-fade-in">
          {/* Pulsing Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Model: {selectedModel} ({selectedProvider})</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            What can I help analyze or build today?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-lg leading-relaxed">
            Multi-turn conversation with cloud inference, code generation, and RAG document intelligence over your uploaded files.
          </p>

          {/* Quick Upload Knowledge Base CTA */}
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="mb-6 px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700/80 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-zinc-200 flex items-center gap-2 shadow-sm transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>Attach PDF / DOCX / CSV / JSON to Knowledge Base</span>
            </button>
          )}

          {/* Starter prompt cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full text-left">
            {STARTER_PROMPTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => sendMessage(item.prompt)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 hover:bg-slate-50 dark:hover:bg-zinc-800/80 hover:border-emerald-500/40 transition-all text-left group shadow-sm hover:shadow-md backdrop-blur-md"
                >
                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-semibold text-xs mb-1">
                    <Icon className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span>{item.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        // Message Stream
        <div className="flex-1 pb-4">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

