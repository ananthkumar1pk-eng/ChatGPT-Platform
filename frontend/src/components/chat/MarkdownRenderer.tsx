"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Simple, resilient parser for markdown formatting
  const renderFormattedText = (text: string) => {
    // Split by code blocks ```lang ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      // Push preceding text
      if (matchIndex > lastIndex) {
        elements.push(
          <div key={`text-${lastIndex}`} className="prose-custom whitespace-pre-wrap">
            {renderInlineMarkdown(text.substring(lastIndex, matchIndex))}
          </div>
        );
      }

      const language = match[1] || "plaintext";
      const codeContent = match[2];
      elements.push(
        <CodeBlock key={`code-${matchIndex}`} language={language} code={codeContent} />
      );

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < text.length) {
      elements.push(
        <div key={`text-${lastIndex}`} className="prose-custom whitespace-pre-wrap">
          {renderInlineMarkdown(text.substring(lastIndex))}
        </div>
      );
    }

    return elements;
  };

  const renderInlineMarkdown = (raw: string): React.ReactNode => {
    // Process markdown headers, bold, bullet points, blockquotes
    const lines = raw.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return <h3 key={idx} className="text-lg font-bold mt-4 mb-2 text-slate-900 dark:text-white">{line.slice(4)}</h3>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={idx} className="text-xl font-bold mt-5 mb-2 text-slate-900 dark:text-white">{line.slice(3)}</h2>;
      }
      if (line.startsWith("# ")) {
        return <h1 key={idx} className="text-2xl font-bold mt-6 mb-3 text-slate-900 dark:text-white">{line.slice(2)}</h1>;
      }
      if (line.startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-4 border-emerald-500 pl-3 italic my-2 text-slate-600 dark:text-slate-300">
            {line.slice(2)}
          </blockquote>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc my-1">
            {formatInlineText(line.slice(2))}
          </li>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        const numMatch = line.match(/^\d+\.\s/);
        const prefix = numMatch ? numMatch[0] : "";
        return (
          <li key={idx} className="ml-4 list-decimal my-1">
            {formatInlineText(line.slice(prefix.length))}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="my-1.5">{formatInlineText(line)}</p>;
    });
  };

  const formatInlineText = (text: string): React.ReactNode => {
    // Bold **text** and inline `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-xs text-emerald-600 dark:text-emerald-400">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return <div className="space-y-2">{renderFormattedText(content)}</div>;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 font-mono text-xs">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-400">
        <span className="text-[11px] font-medium uppercase tracking-wider">{language || "Code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white transition-colors text-[11px]"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-slate-200 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
