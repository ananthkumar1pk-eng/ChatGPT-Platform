"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  BookOpen,
  Settings,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { ConversationItem } from "./ConversationItem";
import { SearchModal } from "./SearchModal";
import { Conversation } from "@/types/chat";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  onOpenUpload: () => void;
  onOpenProfile: () => void;
  onShareConv: (conv: Conversation) => void;
}

export function Sidebar({
  isOpen,
  onToggle,
  onOpenSettings,
  onOpenUpload,
  onOpenProfile,
  onShareConv,
}: SidebarProps) {
  const router = useRouter();
  const { conversations, activeConversation, createConversation } = useChat();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleNewChat = async () => {
    await createConversation("New Chat");
  };

  // Group conversations by time category
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const sevenDaysAgo = today - 86400000 * 7;

  const pinnedList = conversations.filter((c) => c.is_pinned);
  const unpinned = conversations.filter((c) => !c.is_pinned);

  const todayList = unpinned.filter((c) => new Date(c.updated_at).getTime() >= today);
  const yesterdayList = unpinned.filter(
    (c) => new Date(c.updated_at).getTime() >= yesterday && new Date(c.updated_at).getTime() < today
  );
  const prev7DaysList = unpinned.filter(
    (c) => new Date(c.updated_at).getTime() >= sevenDaysAgo && new Date(c.updated_at).getTime() < yesterday
  );
  const olderList = unpinned.filter((c) => new Date(c.updated_at).getTime() < sevenDaysAgo);

  return (
    <>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-100 dark:bg-[#171717] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:w-0 md:border-none md:overflow-hidden"
        }`}
      >
        {/* Header: Logo & New Chat */}
        <div className="p-3 space-y-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">ChatGPT AI</span>
            </div>
            <button
              onClick={onToggle}
              title="Close Sidebar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={handleNewChat}
              className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-[#212121] border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/50 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-between shadow-sm transition-all group"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500 group-hover:rotate-90 transition-transform" />
                <span>New Chat</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">⌘K</span>
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              title="Search Conversations"
              className="p-2 rounded-xl bg-white dark:bg-[#212121] border border-slate-200 dark:border-slate-700/80 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shadow-sm"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenUpload}
            className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Document Knowledge Base</span>
          </button>
        </div>

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {pinnedList.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pinned Chats
              </p>
              <div className="space-y-0.5">
                {pinnedList.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conversation={c}
                    isActive={activeConversation?.id === c.id}
                    onShare={onShareConv}
                  />
                ))}
              </div>
            </div>
          )}

          {todayList.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Today
              </p>
              <div className="space-y-0.5">
                {todayList.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conversation={c}
                    isActive={activeConversation?.id === c.id}
                    onShare={onShareConv}
                  />
                ))}
              </div>
            </div>
          )}

          {yesterdayList.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Yesterday
              </p>
              <div className="space-y-0.5">
                {yesterdayList.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conversation={c}
                    isActive={activeConversation?.id === c.id}
                    onShare={onShareConv}
                  />
                ))}
              </div>
            </div>
          )}

          {prev7DaysList.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Previous 7 Days
              </p>
              <div className="space-y-0.5">
                {prev7DaysList.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conversation={c}
                    isActive={activeConversation?.id === c.id}
                    onShare={onShareConv}
                  />
                ))}
              </div>
            </div>
          )}

          {olderList.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Older
              </p>
              <div className="space-y-0.5">
                {olderList.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conversation={c}
                    isActive={activeConversation?.id === c.id}
                    onShare={onShareConv}
                  />
                ))}
              </div>
            </div>
          )}

          {conversations.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-slate-400">
              No conversations yet. Start a new chat!
            </p>
          )}
        </div>

        {/* Footer: User Account, Settings, Theme */}
        <div className="p-2 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-[#141414] space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenSettings}
              title="System Settings & API Keys"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile Card */}
          {user ? (
            <div
              onClick={onOpenProfile}
              className="p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between gap-2.5 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                  {user.full_name ? user.full_name[0] : user.email[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {user.full_name || user.email}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              Log in / Sign up
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
