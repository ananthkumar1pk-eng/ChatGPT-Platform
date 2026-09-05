"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  MessageSquare,
  FileText,
  Shield,
  Activity,
  Sliders,
  ArrowRight,
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Code,
  Compass,
  FileSpreadsheet,
  FileCode2,
  Database,
  Globe2,
  Radio,
  Moon,
  Sun,
  UserCheck
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { LiveChatDemo } from "./LiveChatDemo";
import { LiveRagDemo } from "./LiveRagDemo";
import { LiveXRayDemo } from "./LiveXRayDemo";

interface LandingPageProps {
  onStartChatting: () => void;
  onOpenUpload?: () => void;
  onOpenSettings?: () => void;
}

export function LandingPage({ onStartChatting, onOpenUpload, onOpenSettings }: LandingPageProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"chat" | "rag" | "xray">("chat");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const FAQ_ITEMS = [
    {
      q: "Do I need a GPU or Python installed locally?",
      a: "No! All inference runs in the cloud via ultra-fast hosted endpoints (Groq, OpenAI, Gemini, Claude, OpenRouter). You get instantaneous sub-50ms responses directly in your browser on any phone, tablet, or laptop.",
    },
    {
      q: "How does Document Q&A (RAG) work with page citations?",
      a: "When you upload a PDF, DOCX, TXT, CSV, or JSON, the platform extracts text, splits it into semantic chunks, and creates vector embeddings. When you ask questions, relevant excerpts are retrieved and passed to the LLM with exact page and line citations.",
    },
    {
      q: "What is the LLM X-Ray inspector?",
      a: "LLM X-Ray provides complete interpretability into how the model generates each word. You can inspect token probabilities (top-5 candidate words), entropy, confidence scores, and multi-head attention maps to detect hallucinations before they happen.",
    },
    {
      q: "Is my uploaded data private and secure?",
      a: "Yes. Every user account has an isolated database sandbox. Documents, embeddings, and conversation histories are strictly scoped to your unique account ID with encrypted JWT token authentication.",
    },
    {
      q: "Can I bring my own API keys?",
      a: "Yes! You can use the built-in hosted cloud inference or enter your personal OpenAI, Groq, Anthropic, Gemini, or OpenRouter API keys in Settings for custom rate limits and access to all proprietary models.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0d1117] text-slate-900 dark:text-[#ececec] selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Background Ambient Glow & Grid Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-emerald-500/15 via-cyan-500/10 to-transparent blur-3xl opacity-70 dark:opacity-40 animate-pulse-slow" />
        <div className="absolute top-[600px] left-1/4 w-[600px] h-[400px] bg-teal-500/10 blur-3xl opacity-50 dark:opacity-30" />
        <div className="absolute top-[1200px] right-1/4 w-[700px] h-[450px] bg-cyan-500/10 blur-3xl opacity-50 dark:opacity-25" />
        <div className="absolute inset-0 bg-grid-pattern opacity-60 dark:opacity-20" />
      </div>

      {/* Top Sticky Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/75 dark:bg-[#0d1117]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                LocalGPT <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Hosted v3</span>
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-zinc-300">
            <a href="#features" className="hover:text-emerald-500 transition-colors">
              Features
            </a>
            <a href="#playground" className="hover:text-emerald-500 transition-colors">
              Live Playground
            </a>
            <a href="#rag" className="hover:text-emerald-500 transition-colors">
              Document RAG
            </a>
            <a href="#models" className="hover:text-emerald-500 transition-colors">
              Cloud Models
            </a>
            <a href="#xray" className="hover:text-emerald-500 transition-colors">
              LLM X-Ray
            </a>
            <a href="#faq" className="hover:text-emerald-500 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onStartChatting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open Workspace</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Sign in
                </Link>
                <button
                  onClick={onStartChatting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all flex items-center gap-1.5 group"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center">
        {/* ========================================================= */}
        {/* 1. HERO SECTION (Matching user screenshot + Upgraded Polish) */}
        {/* ========================================================= */}
        <section className="w-full max-w-5xl mx-auto px-4 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center flex flex-col items-center">
          {/* Hosted inference pill badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-zinc-300 text-xs font-medium mb-6 shadow-sm backdrop-blur-md hover:border-emerald-500/40 transition-all">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hosted inference · no GPU, no install</span>
          </div>

          {/* Big Bold Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl leading-[1.15] mb-5">
            A ChatGPT-style assistant
            <br />
            that{" "}
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              knows your documents
            </span>
          </h1>

          {/* Descriptive Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-zinc-400 max-w-2xl leading-relaxed mb-8">
            Multi-turn conversations with memory, real-time streaming, markdown and code rendering, and retrieval-augmented answers over your own files — all in the browser.
          </p>

          {/* Dual Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md mb-12">
            <button
              onClick={onStartChatting}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Start chatting</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {user ? (
              <button
                onClick={onStartChatting}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white font-semibold text-sm backdrop-blur-md transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Logged in as {user.email.split("@")[0]}</span>
              </button>
            ) : (
              <Link
                href="/register"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white font-semibold text-sm backdrop-blur-md transition-all flex items-center justify-center gap-2"
              >
                <span>Create an account</span>
              </Link>
            )}
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl pt-4 border-t border-slate-200/80 dark:border-white/10">
            <div className="p-3 rounded-xl bg-white/40 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 text-center">
              <div className="text-lg font-bold text-emerald-500">0 GB</div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">Local VRAM Needed</div>
            </div>
            <div className="p-3 rounded-xl bg-white/40 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 text-center">
              <div className="text-lg font-bold text-cyan-500">&lt; 50ms</div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">First Token Latency</div>
            </div>
            <div className="p-3 rounded-xl bg-white/40 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 text-center">
              <div className="text-lg font-bold text-emerald-400">5+ Formats</div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">PDF, DOCX, CSV, TXT</div>
            </div>
            <div className="p-3 rounded-xl bg-white/40 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 text-center">
              <div className="text-lg font-bold text-teal-400">100% Isolated</div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">Per-User Data Sandbox</div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. CORE VALUE FEATURES (The 4 cards from image + 2 upgrades) */}
        {/* ========================================================= */}
        <section id="features" className="w-full max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Enterprise AI Power, Zero Local Friction
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Engineered for seamless research, document synthesis, and conversational intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Streaming answers (Exact from screenshot) */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-[#13161c]/80 backdrop-blur-md hover:border-emerald-500/40 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Streaming answers
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Hosted inference over the internet — replies stream in token by token, on any device.
              </p>
            </div>

            {/* Card 2: Persistent history (Exact from screenshot) */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-[#13161c]/80 backdrop-blur-md hover:border-emerald-500/40 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Persistent history
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Every conversation is saved to your account. Rename, search, revisit or delete anytime.
              </p>
            </div>

            {/* Card 3: Document Q&A (Exact from screenshot) */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-[#13161c]/80 backdrop-blur-md hover:border-emerald-500/40 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Document Q&A
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Upload PDF, DOCX, TXT, CSV or JSON and get answers with page-level source references.
              </p>
            </div>

            {/* Card 4: Protected accounts (Exact from screenshot) */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-[#13161c]/80 backdrop-blur-md hover:border-emerald-500/40 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Protected accounts
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Email + Google sign-in, password reset and per-user data isolation by default.
              </p>
            </div>

            {/* Upgrade Card 5: LLM X-Ray Interpretability */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-[#13161c]/80 backdrop-blur-md hover:border-emerald-500/40 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                LLM X-Ray Transparency
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Inspect top-5 token candidate probabilities, entropy distribution, and layer attention weights in real-time.
              </p>
            </div>

            {/* Upgrade Card 6: Custom Personas & System Prompts */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-[#13161c]/80 backdrop-blur-md hover:border-emerald-500/40 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Custom Personas & Controls
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Configure custom system prompts, temperature, model creativity, and switch providers instantly.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. LIVE INTERACTIVE PLAYGROUND (The Big Upgrade) */}
        {/* ========================================================= */}
        <section id="playground" className="w-full max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold mb-2">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Interactive Live Preview
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Try It Directly in the Browser
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-xl mx-auto mt-1">
              Select a mode below to test real-time streaming, Document RAG citation badges, or neural LLM X-Ray inspection.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-6">
            <div className="p-1 rounded-2xl bg-slate-200/80 dark:bg-zinc-900/90 border border-slate-300 dark:border-white/10 flex flex-wrap gap-1 shadow-inner">
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "chat"
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-md text-emerald-600 dark:text-emerald-400"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Real-Time Streaming</span>
              </button>

              <button
                onClick={() => setActiveTab("rag")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "rag"
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-md text-teal-600 dark:text-teal-400"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Document RAG Citations</span>
              </button>

              <button
                onClick={() => setActiveTab("xray")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "xray"
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-md text-cyan-600 dark:text-cyan-400"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>LLM X-Ray Inspection</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="w-full">
            {activeTab === "chat" && <LiveChatDemo />}
            {activeTab === "rag" && <LiveRagDemo />}
            {activeTab === "xray" && <LiveXRayDemo />}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. MULTI-FORMAT DOCUMENT KNOWLEDGE BASE SHOWCASE */}
        {/* ========================================================= */}
        <section id="rag" className="w-full max-w-5xl mx-auto px-4 py-12">
          <div className="p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-b from-slate-100/80 to-white/40 dark:from-zinc-900/80 dark:to-zinc-950/80 backdrop-blur-xl shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
                  <Database className="w-3.5 h-3.5" />
                  Universal Document Parser
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Turn Any Document Collection into an Instant Expert
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Upload reports, research papers, legal agreements, tabular spreadsheets, or API schemas. The system performs semantic chunking, vector indexing, and real-time hybrid retrieval with verifiable source references.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Page-level citations</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Cosine similarity scores</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Per-user data isolation</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Sub-second retrieval</span>
                  </div>
                </div>
              </div>

              {/* Supported Format Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto flex-shrink-0">
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-white/5 shadow-sm text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2 font-bold text-xs">
                    PDF
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Adobe PDF</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">Multi-page parsing</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-white/5 shadow-sm text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2 font-bold text-xs">
                    DOCX
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Word Documents</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">Full heading trees</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-white/5 shadow-sm text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2 font-bold text-xs">
                    CSV
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Data Spreadsheets</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">Row-level analysis</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-white/5 shadow-sm text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2 font-bold text-xs">
                    TXT
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Plain Text</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">Fast chunking</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-white/5 shadow-sm text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2 font-bold text-xs">
                    JSON
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Structured Data</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">Key-value parsing</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-white/5 shadow-sm text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-2 font-bold text-xs">
                    MD
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Markdown</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">Code & lists</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. CLOUD LLM MODEL ECOSYSTEM */}
        {/* ========================================================= */}
        <section id="models" className="w-full max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Unified Cloud Inference Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
              Switch seamlessly between the industry's leading language models with one click.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                  Groq Cloud
                </span>
                <span className="text-[10px] font-mono text-slate-400">~300+ tok/s</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Llama 3.3 70B</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Extreme low-latency open weights hosted on LPU inference hardware.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold">
                  OpenAI
                </span>
                <span className="text-[10px] font-mono text-slate-400">128k Context</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">GPT-4o & Mini</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                State-of-the-art reasoning, code synthesis, and multi-turn instruction following.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold">
                  Anthropic
                </span>
                <span className="text-[10px] font-mono text-slate-400">200k Context</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Claude 3.5 Sonnet</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Superior coding intelligence, nuanced creative writing, and deep document synthesis.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold">
                  Google Gemini
                </span>
                <span className="text-[10px] font-mono text-slate-400">1M+ Context</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Gemini 1.5 Flash</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Ultra-long context windows capable of holding full textbooks and massive codebases.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. COMPARISON MATRIX (Why this upgraded platform wins) */}
        {/* ========================================================= */}
        <section className="w-full max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Architectural Comparison
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
              Why hosted cloud inference with deep RAG beats heavy local setups.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-zinc-950/80 font-semibold text-slate-700 dark:text-zinc-300">
                    <th className="p-4">Capability</th>
                    <th className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">This Platform (Hosted v3)</th>
                    <th className="p-4 text-slate-500 dark:text-zinc-400">Local Only (Ollama/PyTorch)</th>
                    <th className="p-4 text-slate-500 dark:text-zinc-400">Standard ChatGPT Web</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 font-sans">
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                    <td className="p-4 font-semibold text-slate-900 dark:text-zinc-200">GPU / VRAM Requirement</td>
                    <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">0 GB (Cloud Hosted)</td>
                    <td className="p-4 text-rose-500">16GB - 48GB VRAM Required</td>
                    <td className="p-4 text-slate-600 dark:text-zinc-400">0 GB</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                    <td className="p-4 font-semibold text-slate-900 dark:text-zinc-200">Document RAG & Citations</td>
                    <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">PDF, DOCX, CSV, TXT, JSON</td>
                    <td className="p-4 text-amber-500">Manual Scripting Required</td>
                    <td className="p-4 text-slate-600 dark:text-zinc-400">Limited (Paid Plus Only)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                    <td className="p-4 font-semibold text-slate-900 dark:text-zinc-200">LLM X-Ray Token Inspection</td>
                    <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">Built-in Logit Lens & Attention</td>
                    <td className="p-4 text-amber-500">Requires Heavy Custom Hooking</td>
                    <td className="p-4 text-rose-500">Black Box (No Access)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                    <td className="p-4 font-semibold text-slate-900 dark:text-zinc-200">Multi-Model Cloud Router</td>
                    <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">Groq, OpenAI, Claude, Gemini</td>
                    <td className="p-4 text-slate-600 dark:text-zinc-400">Local Weights Only</td>
                    <td className="p-4 text-slate-600 dark:text-zinc-400">OpenAI Only</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                    <td className="p-4 font-semibold text-slate-900 dark:text-zinc-200">Device Compatibility</td>
                    <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">Any Browser / Phone / Laptop</td>
                    <td className="p-4 text-rose-500">High-end PC / Mac Workstation</td>
                    <td className="p-4 text-slate-600 dark:text-zinc-400">Any Browser</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. FREQUENTLY ASKED QUESTIONS (Accordion) */}
        {/* ========================================================= */}
        <section id="faq" className="w-full max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
              Everything you need to know about inference, document security, and features.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 8. BOTTOM HERO CTA */}
        {/* ========================================================= */}
        <section className="w-full max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="p-8 sm:p-12 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-zinc-900/80 to-zinc-950 text-white backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/20 blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Ready to Experience AI That Understands Your Files?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Join now and start chatting with hosted high-speed models over your documents in seconds.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onStartChatting}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Start Chatting Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-zinc-950/80 py-8 px-4 text-xs text-slate-500 dark:text-zinc-500 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-700 dark:text-zinc-300">
              LocalGPT Hosted Platform
            </span>
            <span>• Next-Gen AI Workspace</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              All Hosted Systems Normal (99.99% Uptime)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
