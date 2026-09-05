"use client";

import React, { useState } from "react";
import { FileText, FileCode, CheckCircle2, Search, ArrowRight, ExternalLink, Sparkles, BookOpen, Layers, ChevronDown, ChevronUp } from "lucide-react";

interface SampleDoc {
  id: string;
  name: string;
  type: string;
  pages: number;
  chunks: number;
  size: string;
  color: string;
}

interface RagQuerySample {
  query: string;
  docId: string;
  answer: string;
  citations: {
    docName: string;
    page: number;
    score: number;
    textExcerpt: string;
  }[];
}

const SAMPLE_DOCS: SampleDoc[] = [
  {
    id: "doc-1",
    name: "Enterprise_Cloud_Report_2024.pdf",
    type: "PDF",
    pages: 34,
    chunks: 142,
    size: "2.4 MB",
    color: "from-rose-500/20 to-rose-500/5 text-rose-500 border-rose-500/30",
  },
  {
    id: "doc-2",
    name: "AI_Architecture_Whitepaper.docx",
    type: "DOCX",
    pages: 18,
    chunks: 78,
    size: "1.1 MB",
    color: "from-blue-500/20 to-blue-500/5 text-blue-500 border-blue-500/30",
  },
  {
    id: "doc-3",
    name: "Global_Sales_Analytics_Q3.csv",
    type: "CSV",
    pages: 1,
    chunks: 95,
    size: "420 KB",
    color: "from-emerald-500/20 to-emerald-500/5 text-emerald-500 border-emerald-500/30",
  },
];

const RAG_QUERIES: RagQuerySample[] = [
  {
    query: "What were our total cloud infrastructure savings after adopting hosted inference?",
    docId: "doc-1",
    answer: "According to the financial breakdown, shifting from dedicated GPU clusters to on-demand hosted inference decreased overall monthly infrastructure costs by **42.8%** ($148,000 annualized savings). The return on investment reached break-even within 45 days.",
    citations: [
      {
        docName: "Enterprise_Cloud_Report_2024.pdf",
        page: 14,
        score: 0.94,
        textExcerpt: "Section 3.4 — Cost Efficiency Analysis: Migration to serverless hosted LLM endpoints yielded a net 42.8% drop in GPU allocation overhead, reducing monthly operational burn from $28,700 to $16,400.",
      },
      {
        docName: "Enterprise_Cloud_Report_2024.pdf",
        page: 16,
        score: 0.88,
        textExcerpt: "ROI Milestones: The platform recouped all initial integration and token licensing investments within 45 calendar days of Phase 2 rollout.",
      },
    ],
  },
  {
    query: "Explain the hybrid retrieval strategy between dense vector search and BM25 keywords.",
    docId: "doc-2",
    answer: "The platform uses a **two-stage reciprocal rank fusion (RRF)**: Dense embeddings (Cosine similarity @ top-30) capture semantic meaning, while BM25 inverted indexes ensure exact keyword hits for technical IDs, error codes, and named entities.",
    citations: [
      {
        docName: "AI_Architecture_Whitepaper.docx",
        page: 7,
        score: 0.96,
        textExcerpt: "Hybrid Retrieval Architecture: Combining 768-dimensional text embeddings with BM25 keyword index boosted Recall@5 by 31.4% on out-of-domain technical queries.",
      },
    ],
  },
  {
    query: "Which region achieved the highest net recurring revenue growth in Q3?",
    docId: "doc-3",
    answer: "The **North American (NA-East) Enterprise segment** led growth with **+134% YoY**, generating $4.18M in net new ARR, driven primarily by hosted document AI expansions.",
    citations: [
      {
        docName: "Global_Sales_Analytics_Q3.csv",
        page: 1,
        score: 0.92,
        textExcerpt: "Row 48: NA-East | Enterprise SaaS | ARR: $4,180,000 | Growth: +134% YoY | Primary Driver: Hosted Doc AI Seats.",
      },
    ],
  },
];

export function LiveRagDemo() {
  const [selectedDocId, setSelectedDocId] = useState("doc-1");
  const [expandedCitation, setExpandedCitation] = useState<number | null>(0);

  const activeQuery = RAG_QUERIES.find((q) => q.docId === selectedDocId) || RAG_QUERIES[0];
  const activeDoc = SAMPLE_DOCS.find((d) => d.id === selectedDocId) || SAMPLE_DOCS[0];

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#18181b]/90 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-zinc-900/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
            Multi-Format RAG & Page Citations Engine
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
          <Layers className="w-3 h-3" />
          <span>Hybrid Vector + BM25 Index</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-white/10">
        {/* Left Column: Sample Documents */}
        <div className="lg:col-span-5 p-4 bg-slate-50/50 dark:bg-zinc-950/40 space-y-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider px-1">
            Indexed Knowledge Base (Click to test)
          </div>

          <div className="space-y-2">
            {SAMPLE_DOCS.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              return (
                <button
                  key={doc.id}
                  onClick={() => {
                    setSelectedDocId(doc.id);
                    setExpandedCitation(0);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? "bg-white dark:bg-zinc-800/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30"
                      : "bg-white/60 dark:bg-zinc-900/50 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-2 rounded-lg bg-gradient-to-br border ${doc.color}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 line-clamp-1">
                        {doc.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
                        {doc.pages} Pages • {doc.chunks} Semantic Chunks • {doc.size}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0 text-emerald-500" />
            <span>Drop any PDF, DOCX, TXT, CSV, or JSON for automated vectorization</span>
          </div>
        </div>

        {/* Right Column: Q&A Output with Clickable Page Citations */}
        <div className="lg:col-span-7 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* User Search Query */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-800/60 border border-slate-200 dark:border-white/5">
              <div className="text-[11px] font-mono text-slate-400 dark:text-zinc-400 flex items-center gap-1.5 mb-1">
                <Search className="w-3 h-3 text-emerald-500" />
                <span>Verified Natural Language Query</span>
              </div>
              <p className="text-xs md:text-sm font-semibold text-slate-800 dark:text-zinc-100">
                "{activeQuery.query}"
              </p>
            </div>

            {/* AI Synthesized Answer with In-Line Citations */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  RAG-Grounded Answer
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-semibold">
                  100% Hallucination Shielded
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-800 dark:text-zinc-200 leading-relaxed">
                {activeQuery.answer}
              </p>
            </div>

            {/* Clickable Source Citations Badges */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="text-xs font-semibold text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verified Source Documents & Page Citations ({activeQuery.citations.length})</span>
              </div>

              <div className="space-y-2">
                {activeQuery.citations.map((cite, idx) => {
                  const isExpanded = expandedCitation === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-900/60 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedCitation(isExpanded ? null : idx)}
                        className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                            Page {cite.page}
                          </span>
                          <span className="text-xs font-medium text-slate-800 dark:text-zinc-200 line-clamp-1">
                            {cite.docName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                            {(cite.score * 100).toFixed(0)}% match
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-3 bg-white dark:bg-zinc-950/60 border-t border-slate-200 dark:border-white/5 text-[11px] font-mono text-slate-600 dark:text-zinc-300 leading-relaxed">
                          <span className="text-emerald-500 font-bold mr-1.5">Excerpt:</span>
                          "{cite.textExcerpt}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 text-[11px] font-mono text-slate-400 dark:text-zinc-500 flex items-center justify-between">
            <span>Cosine Similarity Indexing</span>
            <span className="text-emerald-500 font-semibold">Zero Hallucinations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
