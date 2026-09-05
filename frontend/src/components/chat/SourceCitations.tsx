"use client";

import React, { useState } from "react";
import { FileText, ChevronDown, ChevronUp, BookOpen, ExternalLink } from "lucide-react";
import { SourceCitation } from "@/types/chat";

interface SourceCitationsProps {
  sources: SourceCitation[];
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 font-medium transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
        <span>
          {sources.length} Document Source{sources.length > 1 ? "s" : ""} Referenced
        </span>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
      </button>

      {isExpanded && (
        <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-2 animate-fade-in">
          {sources.map((src, i) => (
            <div
              key={`${src.document_id}-${i}`}
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 truncate">
                  <FileText className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="truncate">{src.filename}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Page {src.page_number}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-3 italic leading-relaxed">
                "{src.snippet}"
              </p>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>Chunk #{src.chunk_index}</span>
                <span>Match: {Math.round(src.score * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
