"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, MoreHorizontal, Pin, Trash2, Edit3, Share2, Check, X } from "lucide-react";
import { Conversation } from "@/types/chat";
import { useChat } from "@/context/ChatContext";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onShare: (conv: Conversation) => void;
}

export function ConversationItem({ conversation, isActive, onShare }: ConversationItemProps) {
  const router = useRouter();
  const { selectConversation, deleteConversation, updateConversationTitle, togglePinConversation } = useChat();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = () => {
    if (!isEditing) {
      selectConversation(conversation.id);
      router.push(`/c/${conversation.id}`);
    }
  };

  const handleSaveRename = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (title.trim() && title !== conversation.title) {
      await updateConversationTitle(conversation.id, title.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-all ${
        isActive
          ? "bg-slate-200 dark:bg-[#212121] text-slate-900 dark:text-white font-medium shadow-sm"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-[#212121]/60 hover:text-slate-900 dark:hover:text-slate-200"
      }`}
      onClick={handleSelect}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-emerald-500" : "text-slate-400"}`} />

        {isEditing ? (
          <form onSubmit={handleSaveRename} className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-500 text-xs focus:outline-none"
            />
            <button type="submit" className="text-emerald-500 hover:text-emerald-600"><Check className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
          </form>
        ) : (
          <span className="truncate flex-1">{conversation.title}</span>
        )}
      </div>

      {conversation.is_pinned && !isEditing && (
        <Pin className="w-3 h-3 text-emerald-500 flex-shrink-0 ml-1 fill-current" />
      )}

      {/* Action Menu Trigger */}
      {!isEditing && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-300 dark:hover:bg-slate-700 transition-opacity ${
              showMenu ? "opacity-100" : ""
            }`}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Context Dropdown */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#2f2f2f] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50 animate-slide-down">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onShare(conversation);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <Share2 className="w-3.5 h-3.5" /> Share / Export
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  setIsEditing(true);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <Edit3 className="w-3.5 h-3.5" /> Rename
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  togglePinConversation(conversation.id, !conversation.is_pinned);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <Pin className="w-3.5 h-3.5" /> {conversation.is_pinned ? "Unpin Chat" : "Pin Chat"}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  deleteConversation(conversation.id);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
