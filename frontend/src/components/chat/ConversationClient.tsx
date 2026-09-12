"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PanelLeft, BookOpen, Share2, Camera, Sparkles } from "lucide-react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { FileUploadDrawer } from "@/components/chat/FileUploadDrawer";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { UserProfileModal } from "@/components/modals/UserProfileModal";
import { ShareModal } from "@/components/modals/ShareModal";
import { CameraAnalysisModal } from "@/components/modals/CameraAnalysisModal";
import { SanaImageModal } from "@/components/modals/SanaImageModal";
import { Conversation } from "@/types/chat";
import { useChat } from "@/context/ChatContext";

export function ConversationClient() {
  const params = useParams();
  const convId = params?.id as string;
  const { selectConversation, activeConversation, sendMessage } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareConv, setShareConv] = useState<Conversation | null>(null);

  // Multimodal Modals
  const [cameraOpen, setCameraOpen] = useState(false);
  const [imageStudioOpen, setImageStudioOpen] = useState(false);

  useEffect(() => {
    if (convId) {
      selectConversation(convId);
    }
  }, [convId]);

  const handleShare = (conv: Conversation) => {
    setShareConv(conv);
    setShareOpen(true);
  };

  const handleInsertFromCamera = (analysisText: string) => {
    sendMessage(
      `Please review and elaborate on this Florence-2 Camera Analysis:\n\n${analysisText}`
    );
  };

  const handleInsertFromImageStudio = (imageMarkdown: string) => {
    sendMessage(
      `Here is an image generated with Sana 1.6B Diffusion:\n\n${imageMarkdown}\n\nLet's brainstorm creative variations and artistic backstory for this concept!`
    );
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
            {/* Quick Florence-2 Camera Launch */}
            <button
              onClick={() => setCameraOpen(true)}
              title="Florence-2 Camera VLM Analysis"
              className="p-2 rounded-lg text-slate-500 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Quick Sana 1.6B Studio Launch */}
            <button
              onClick={() => setImageStudioOpen(true)}
              title="Sana 1.6B Text-to-Image Diffusion Studio"
              className="p-2 rounded-lg text-slate-500 hover:text-violet-500 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* RAG Knowledge Base */}
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
        <ChatInput
          onOpenUpload={() => setUploadOpen(true)}
          onOpenCamera={() => setCameraOpen(true)}
          onOpenImageStudio={() => setImageStudioOpen(true)}
        />
      </main>

      {/* Modals & Drawers */}
      <FileUploadDrawer
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <UserProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
      <ShareModal
        conversation={shareConv}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      {/* Multimodal Modals */}
      <CameraAnalysisModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onInsertToChat={handleInsertFromCamera}
      />
      <SanaImageModal
        isOpen={imageStudioOpen}
        onClose={() => setImageStudioOpen(false)}
        onInsertToChat={handleInsertFromImageStudio}
      />
    </div>
  );
}
