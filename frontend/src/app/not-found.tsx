"use client";

import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white text-center">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
        <Sparkles className="w-6 h-6" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 max-w-sm">
        The requested page or conversation thread does not exist.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
}
