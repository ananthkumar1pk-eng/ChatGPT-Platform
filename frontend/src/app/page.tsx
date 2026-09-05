"use client";

import React, { useState, useEffect } from "react";
import { PanelLeft, Sparkles, BookOpen, Share2, LayoutDashboard, MessageSquare } from "lucide-react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { FileUploadDrawer } from "@/components/chat/FileUploadDrawer";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { UserProfileModal } from "@/components/modals/UserProfileModal";
import { ShareModal } from "@/components/modals/ShareModal";
import { LandingPage } from "@/components/landing/LandingPage";
import { Conversation } from "@/types/chat";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { activeConversation, messages } = useChat();
  const { user } = useAuth();
  
  const [viewMode, setViewMode] = useState<"landing" | "chat">("landing");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareConv, setShareConv] = useState<Conversation | null>(null);

  // If user selects an active conversation or starts chatting, switch to chat canvas
  useEffect(() => {
    if (activeConversation || messages.length > 0) {
      setViewMode("chat");
    }
  }, [activeConversation, messages.length]);

  const handleShare = (conv: Conversation) => {
    setShareConv(conv);
    setShareOpen(true);
  };

  const handleStartChatting = () => {
    setViewMode("chat");
  };

  if (viewMode === "landing") {
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-[#0d1117]">
        <LandingPage
          onStartChatting={handleStartChatting}
          onOpenUpload={() => {
            setViewMode("chat");
            setUploadOpen(true);
          }}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        {/* Modals */}
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <UserProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-[#ececec]">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenUpload={() => setUploadOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onShareConv={handleShare}
      />

      {/* Main Chat Canvas */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Navigation Bar */}
        <header className="h-14 px-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-white/70 dark:bg-[#18181b]/70 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                title="Open Sidebar"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            <ModelSelector />
          </div>

          <div className="flex items-center gap-2">
            {/* Switch to Landing View Button */}
            <button
              onClick={() => setViewMode("landing")}
              title="View Landing Overview"
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Landing Overview</span>
            </button>

            <button
              onClick={() => setUploadOpen(true)}
              title="Open RAG Knowledge Base"
              className="p-2 rounded-lg text-slate-500 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {activeConversation && (
              <button
                onClick={() => handleShare(activeConversation)}
                title="Share Conversation"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Center Chat Messages */}
        <ChatContainer onOpenUpload={() => setUploadOpen(true)} />

        {/* Bottom Input Area */}
        <ChatInput onOpenUpload={() => setUploadOpen(true)} />
      </main>

      {/* Modals & Drawers */}
      <FileUploadDrawer isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <UserProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <ShareModal conversation={shareConv} isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}

