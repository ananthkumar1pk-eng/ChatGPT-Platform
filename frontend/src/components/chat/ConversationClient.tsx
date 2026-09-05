"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PanelLeft, BookOpen, Share2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { FileUploadDrawer } from "@/components/chat/FileUploadDrawer";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { UserProfileModal } from "@/components/modals/UserProfileModal";
import { ShareModal } from "@/components/modals/ShareModal";
import { Conversation } from "@/types/chat";
import { useChat } from "@/context/ChatContext";

export function ConversationClient() {
  const params = useParams();
  const convId = params?.id as string;
  const { selectConversation, activeConversation } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareConv, setShareConv] = useState<Conversation | null>(null);

  useEffect(() => {
    if (convId) {
      selectConversation(convId);
    }
  }, [convId]);

  const handleShare = (conv: Conversation) => {
    setShareConv(conv);
    setShareOpen(true);
  };

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

          <div className="flex items-center gap-1.5">
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
