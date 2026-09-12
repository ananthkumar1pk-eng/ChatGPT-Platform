"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUp,
  Square,
  Paperclip,
  X,
  BookOpen,
  Camera,
  Sparkles,
  Image as ImageIcon
} from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
import { ApiClient } from "@/lib/api";

interface ChatInputProps {
  onOpenUpload: () => void;
  onOpenCamera?: () => void;
  onOpenImageStudio?: () => void;
}

export function ChatInput({
  onOpenUpload,
  onOpenCamera,
  onOpenImageStudio,
}: ChatInputProps) {
  const {
    sendMessage,
    isStreaming,
    stopStreaming,
    attachedDocs,
    removeAttachedDocument,
  } = useChat();

  const [prompt, setPrompt] = useState("");
  const [attachedImage, setAttachedImage] = useState<{ dataUri: string; name: string } | null>(null);
  const [isVisionAnalyzing, setIsVisionAnalyzing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [prompt]);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage({
        dataUri: reader.result as string,
        name: file.name || "attached_image.png",
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleImageFile(file);
          break;
        }
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!prompt.trim() && !attachedImage) || isStreaming || isVisionAnalyzing) return;

    const trimmed = prompt.trim();

    // Check for slash commands
    if (trimmed.startsWith("/image") || trimmed.startsWith("/imagine")) {
      if (onOpenImageStudio) {
        onOpenImageStudio();
        setPrompt("");
        return;
      }
    } else if (trimmed === "/camera" || trimmed === "/vision") {
      if (onOpenCamera) {
        onOpenCamera();
        setPrompt("");
        return;
      }
    }

    // If an image is attached, run Florence-2 VLM multimodal analysis with user prompt as custom question
    if (attachedImage) {
      setIsVisionAnalyzing(true);
      try {
        const payload = {
          image_base64: attachedImage.dataUri,
          task: trimmed ? "vqa" : "more_detailed_caption",
          custom_question: trimmed || undefined,
        };

        const result = await ApiClient.post<any>("/api/vision/analyze", payload);
        const analysisMarkdown =
          result.summary_markdown ||
          result.detailed_caption ||
          "Image visual analysis completed.";

        const fullPrompt = trimmed
          ? `[Image Attached]: Question: "${trimmed}"\n\n${analysisMarkdown}`
          : `[Image Attached]: Visual Analysis Request\n\n${analysisMarkdown}`;

        setAttachedImage(null);
        setPrompt("");
        setIsVisionAnalyzing(false);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }

        await sendMessage(fullPrompt);
        return;
      } catch (err: any) {
        console.error("Vision analysis error:", err);
        setIsVisionAnalyzing(false);
      }
    }

    sendMessage(trimmed);
    setPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceTranscribed = (text: string) => {
    setPrompt((prev) => (prev ? `${prev} ${text}` : text));
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Attached Document & Image Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2 px-1">
        {/* Attached Image Preview */}
        {attachedImage && (
          <div className="inline-flex items-center gap-2 p-1.5 pr-2.5 rounded-xl text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm animate-fade-in">
            <img
              src={attachedImage.dataUri}
              alt="Attached preview"
              className="w-7 h-7 object-cover rounded-lg border border-emerald-500/30"
            />
            <div className="flex flex-col">
              <span className="font-semibold truncate max-w-[150px] leading-tight">
                {attachedImage.name}
              </span>
              <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                Florence-2 VLM Ready
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="p-1 hover:text-rose-500 rounded-md hover:bg-rose-500/10 transition-colors ml-1"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attached RAG Document Badges */}
        {attachedDocs.length > 0 && (
          <>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> RAG Active:
            </span>
            {attachedDocs.map((doc) => (
              <span
                key={doc.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 max-w-[200px]"
              >
                <span className="truncate">{doc.filename}</span>
                <button
                  type="button"
                  onClick={() => removeAttachedDocument(doc.id)}
                  className="hover:text-rose-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </>
        )}
      </div>

      {/* Main Input Box */}
      <div className="relative rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#2f2f2f] shadow-lg focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all">
        {/* Hidden File Input for Image Upload */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
          }}
          className="hidden"
        />

        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            attachedImage
              ? "Ask a question about this image, or press Enter for full Florence-2 analysis..."
              : "Message ChatGPT-Platform, paste/attach image, /image with Sana 1.6B, or use Florence-2 camera..."
          }
          rows={1}
          className="w-full pl-4 pr-40 py-3.5 rounded-2xl bg-transparent resize-none text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none max-h-48 overflow-y-auto leading-relaxed"
        />

        {/* Multimodal Input Controls Bar */}
        <div className="absolute right-2.5 bottom-2 flex items-center gap-1">
          {/* Attach Image Directly */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            title="Attach Image for Florence-2 Vision Analysis"
            className={`p-2 rounded-xl transition-colors ${
              attachedImage
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                : "text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Camera Picture Analysis (Florence-2 VLM) */}
          {onOpenCamera && (
            <button
              type="button"
              onClick={onOpenCamera}
              title="Camera Picture Analysis (Florence-2 VLM)"
              className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}

          {/* Text-to-Image Diffusion (Sana 1.6B) */}
          {onOpenImageStudio && (
            <button
              type="button"
              onClick={onOpenImageStudio}
              title="Text to Image Generation (Sana 1.6B Diffusion)"
              className="p-2 rounded-xl text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {/* Voice to Text (Faster-Whisper ASR) */}
          <VoiceRecorder
            onTranscribed={handleVoiceTranscribed}
            disabled={isStreaming || isVisionAnalyzing}
          />

          {/* File Upload (RAG Documents) */}
          <button
            type="button"
            onClick={onOpenUpload}
            title="Attach Document (PDF, DOCX, TXT, CSV, JSON)"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Send / Stop Button */}
          {isStreaming || isVisionAnalyzing ? (
            <button
              type="button"
              onClick={stopStreaming}
              title="Stop Generating"
              className="p-2 rounded-xl bg-slate-800 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!prompt.trim() && !attachedImage}
              title="Send Prompt (Enter)"
              className={`p-2 rounded-xl transition-all ${
                prompt.trim() || attachedImage
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-md"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2 px-1">
        <span>
          Florence-2 (Vision) • Sana 1.6B (Image Gen) • Faster-Whisper (Voice)
        </span>
        <span>Press Enter to send, Shift+Enter for new line</span>
      </div>
    </div>
  );
}
