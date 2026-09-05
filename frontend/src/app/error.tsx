"use client";

import React, { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white text-center">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 max-w-sm">
        {error.message || "An unexpected error occurred while loading this view."}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Try again</span>
      </button>
    </div>
  );
}
