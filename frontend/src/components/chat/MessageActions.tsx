"use client";

import React, { useState } from "react";
import { Copy, Check, RotateCw, Edit3, ThumbsUp, ThumbsDown } from "lucide-react";
import { Message } from "@/types/chat";
import { useChat } from "@/context/ChatContext";

interface MessageActionsProps {
  message: Message;
  onEdit?: () => void;
}

export function MessageActions({ message, onEdit }: MessageActionsProps) {
  const { regenerateMessage, submitFeedback } = useChat();
  const [copied, setCopied] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(
    message.feedback?.rating || null
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (rating: number) => {
    const newRating = feedbackRating === rating ? 0 : rating;
    setFeedbackRating(newRating === 0 ? null : newRating);
    if (newRating !== 0) {
      await submitFeedback(message.id, newRating);
    }
  };

  return (
    <div className="flex items-center gap-1.5 mt-2 text-slate-400 dark:text-slate-400">
      {/* Copy */}
      <button
        onClick={handleCopy}
        title="Copy message"
        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>

      {/* User Actions: Edit */}
      {message.role === "user" && onEdit && (
        <button
          onClick={onEdit}
          title="Edit message"
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Assistant Actions: Regenerate & Feedback */}
      {message.role === "assistant" && !message.isStreaming && (
        <>
          <button
            onClick={() => regenerateMessage(message.id)}
            title="Regenerate response"
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleFeedback(1)}
            title="Good response"
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${
              feedbackRating === 1 ? "text-emerald-500" : "hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleFeedback(-1)}
            title="Bad response"
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${
              feedbackRating === -1 ? "text-rose-500" : "hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
