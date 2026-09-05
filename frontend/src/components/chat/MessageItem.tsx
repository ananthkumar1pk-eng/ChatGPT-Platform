"use client";

import React, { useState } from "react";
import { User as UserIcon, Bot, Sparkles, Check, X } from "lucide-react";
import { Message } from "@/types/chat";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { SourceCitations } from "./SourceCitations";
import { MessageActions } from "./MessageActions";
import { useChat } from "@/context/ChatContext";

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const { editMessage } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isUser = message.role === "user";

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setIsEditing(false);
    await editMessage(message.id, editContent);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div className={`py-6 px-4 md:px-6 w-full ${isUser ? "bg-transparent" : "bg-slate-100/50 dark:bg-[#1a1a1a]/60 border-y border-slate-200/50 dark:border-slate-800/40"}`}>
      <div className="max-w-3xl mx-auto flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center font-medium text-xs shadow-sm">
              <UserIcon className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm ring-2 ring-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              {isUser ? "You" : "Assistant"}
            </span>
            {message.model && (
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {message.model}
              </span>
            )}
            <span className="text-[11px] text-slate-400">
              {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Content / Edit Mode */}
          {isEditing ? (
            <div className="space-y-2 mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 rounded-lg border border-emerald-500 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Save & Submit
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-800 dark:text-[#ececec]">
              {message.content ? (
                <MarkdownRenderer content={message.content} />
              ) : message.isStreaming ? (
                <span className="inline-block streaming-cursor text-slate-400 italic">Thinking...</span>
              ) : null}
            </div>
          )}

          {/* Document Sources (RAG Citations) */}
          {message.sources && message.sources.length > 0 && (
            <SourceCitations sources={message.sources} />
          )}

          {/* Actions */}
          {!isEditing && (
            <MessageActions message={message} onEdit={() => setIsEditing(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
