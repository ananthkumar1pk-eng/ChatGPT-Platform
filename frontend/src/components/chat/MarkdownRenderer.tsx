"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Terminal } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose-custom max-w-none text-slate-800 dark:text-[#ececec] overflow-hidden">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom Table Rendering
          table({ children }) {
            return (
              <div className="my-4 w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#1e1e1e]">
                <table className="w-full text-left text-sm border-collapse min-w-[320px]">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-slate-100 dark:bg-slate-850 text-slate-900 dark:text-slate-100 font-semibold border-b border-slate-200 dark:border-slate-750">
                {children}
              </thead>
            );
          },
          tbody({ children }) {
            return (
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {children}
              </tbody>
            );
          },
          tr({ children }) {
            return (
              <tr className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                {children}
              </tr>
            );
          },
          th({ children }) {
            return (
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 align-top">
                {children}
              </td>
            );
          },

          // Code blocks and inline code
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            if (!inline && (match || codeString.includes("\n"))) {
              return (
                <CodeBlock
                  language={match ? match[1] : "plaintext"}
                  code={codeString}
                />
              );
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded font-mono text-xs font-medium bg-slate-100 dark:bg-slate-800/90 text-emerald-600 dark:text-emerald-400 border border-slate-200/60 dark:border-slate-700/50"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Headings
          h1({ children }) {
            return (
              <h1 className="text-2xl font-bold mt-6 mb-3 text-slate-900 dark:text-white tracking-tight border-b border-slate-200 dark:border-slate-800 pb-2">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-xl font-bold mt-5 mb-2.5 text-slate-900 dark:text-white tracking-tight">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-lg font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-100">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="text-base font-semibold mt-3 mb-1.5 text-slate-800 dark:text-slate-200">
                {children}
              </h4>
            );
          },

          // Lists
          ul({ children }) {
            return <ul className="my-2.5 ml-5 list-disc space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-2.5 ml-5 list-decimal space-y-1">{children}</ol>;
          },
          li({ children }) {
            return (
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed marker:text-emerald-500 dark:marker:text-emerald-400">
                {children}
              </li>
            );
          },

          // Paragraphs & Blockquotes
          p({ children }) {
            return (
              <p className="my-2.5 leading-relaxed text-slate-700 dark:text-[#d1d1d1]">
                {children}
              </p>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 pl-4 border-l-4 border-emerald-500 bg-slate-50/60 dark:bg-slate-850/40 py-2 rounded-r-md italic text-slate-600 dark:text-slate-300">
                {children}
              </blockquote>
            );
          },

          // Links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 font-medium underline underline-offset-2 hover:text-emerald-500 transition-colors"
              >
                {children}
              </a>
            );
          },

          // Divider
          hr() {
            return <hr className="my-6 border-slate-200 dark:border-slate-800" />;
          },

          // Strong & Emphasis
          strong({ children }) {
            return (
              <strong className="font-semibold text-slate-900 dark:text-white">
                {children}
              </strong>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-700/80 bg-[#0d1117] font-mono text-xs shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-slate-800 text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-300">
            {language || "code"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-4 overflow-x-auto text-slate-100 leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}
