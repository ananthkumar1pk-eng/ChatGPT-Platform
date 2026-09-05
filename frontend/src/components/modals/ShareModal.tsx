"use client";

import React, { useState } from "react";
import { Share2, Download, Link, Check, X, FileText, Code } from "lucide-react";
import { Conversation } from "@/types/chat";

interface ShareModalProps {
  conversation: Conversation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ conversation, isOpen, onClose }: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !conversation) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/c/${conversation.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownload = (format: "markdown" | "json") => {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/chat/conversations/${conversation.id}/export?format=${format}`;
    window.open(apiUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#212121] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Export & Share Chat</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a1a1a]">
            <h4 className="font-semibold text-slate-900 dark:text-white truncate">{conversation.title}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Model: {conversation.model} • Provider: {conversation.provider}
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleDownload("markdown")}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-[#2f2f2f] flex items-center justify-between text-left transition-all"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Export as Markdown (.md)</p>
                  <p className="text-[10px] text-slate-400">Formatted with headings, citations & code</p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleDownload("json")}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-[#2f2f2f] flex items-center justify-between text-left transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Code className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Export as Structured JSON (.json)</p>
                  <p className="text-[10px] text-slate-400">Machine readable array of turn messages</p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Link className="w-4 h-4" />}
              <span>{copiedLink ? "Link Copied to Clipboard!" : "Copy Chat Permalink"}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a1a1a] flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
