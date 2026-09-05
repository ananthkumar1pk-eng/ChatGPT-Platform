"use client";

import React, { useState, useEffect } from "react";
import { Search, MessageSquare, X, ArrowRight } from "lucide-react";
import { Conversation } from "@/types/chat";
import { ApiClient } from "@/lib/api";
import { useChat } from "@/context/ChatContext";
import { useRouter } from "next/navigation";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { selectConversation } = useChat();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Conversation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const list = await ApiClient.get<Conversation[]>(`/api/chat/conversations?q=${encodeURIComponent(query)}`);
        setResults(list);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (id: string) => {
    selectConversation(id);
    router.push(`/c/${id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#212121] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversation titles or messages..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {isSearching ? (
            <p className="p-4 text-center text-xs text-slate-400">Searching chats...</p>
          ) : results.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-400">
              {query.trim() ? "No matching conversations found." : "Type keywords to search past conversations."}
            </p>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2f2f2f] flex items-center justify-between gap-3 group transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{c.title}</p>
                    {c.last_message_preview && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.last_message_preview}</p>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
