"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Square, Paperclip, X, BookOpen } from "lucide-react";
import { useChat } from "@/context/ChatContext";

interface ChatInputProps {
  onOpenUpload: () => void;
}

export function ChatInput({ onOpenUpload }: ChatInputProps) {
  const { sendMessage, isStreaming, stopStreaming, attachedDocs, removeAttachedDocument, useRag, setUseRag } = useChat();
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isStreaming) return;
    sendMessage(prompt.trim());
    setPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Attached Document Badges */}
      {attachedDocs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2 px-1 animate-fade-in">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> RAG Active:
          </span>
          {attachedDocs.map((doc) => (
            <span
              key={doc.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 max-w-[200px]"
            >
              <span className="truncate">{doc.filename}</span>
              <button
                type="button"
                onClick={() => removeAttachedDocument(doc.id)}
                className="hover:text-rose-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Main Input Box */}
      <div className="relative rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#2f2f2f] shadow-lg focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message ChatGPT-Platform or ask questions about uploaded documents..."
          rows={1}
          className="w-full pl-4 pr-24 py-3.5 rounded-2xl bg-transparent resize-none text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none max-h-48 overflow-y-auto leading-relaxed"
        />

        {/* Input Bar Controls */}
        <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
          {/* File Upload Button */}
          <button
            type="button"
            onClick={onOpenUpload}
            title="Attach Document (PDF, DOCX, TXT, CSV, JSON)"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Send / Stop Button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={stopStreaming}
              title="Stop Generating"
              className="p-2 rounded-xl bg-slate-800 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!prompt.trim()}
              title="Send Prompt (Enter)"
              className={`p-2 rounded-xl transition-all ${
                prompt.trim()
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-md"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-2">
        ChatGPT-Platform can make mistakes. Verify important facts and check cited document pages.
      </p>
    </div>
  );
}
