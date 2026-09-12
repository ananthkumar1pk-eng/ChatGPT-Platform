"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { ApiClient } from "@/lib/api";

interface VoiceRecorderProps {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscribed, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];
    setDuration(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone API not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await handleTranscription(audioBlob);
      };

      mediaRecorder.start(250); // Slice every 250ms
      setIsRecording(true);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone error:", err);
      setErrorMsg(err.message || "Microphone access denied.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", blob, "microphone_recording.webm");
      formData.append("model_size", "base");

      const res = await ApiClient.postFormData<{
        success: boolean;
        text: string;
        language?: string;
        latency_seconds?: number;
      }>("/api/audio/transcribe", formData);

      if (res && res.text) {
        onTranscribed(res.text);
      } else {
        setErrorMsg("No speech recognized. Please try speaking closer to the mic.");
      }
    } catch (err: any) {
      console.error("Transcription error:", err);
      setErrorMsg("Faster-Whisper transcription failed. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isTranscribing) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium animate-pulse">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Faster-Whisper Transcribing...</span>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 shadow-sm animate-pulse">
        {/* Pulsing indicator */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
        </span>
        <span className="text-xs font-mono font-semibold">{formatDuration(duration)}</span>

        <button
          type="button"
          onClick={stopRecording}
          title="Stop Recording & Transcribe with Faster-Whisper"
          className="ml-1 px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
        >
          <MicOff className="w-3 h-3" /> Stop
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={startRecording}
        disabled={disabled || isTranscribing}
        title="Voice to Text (Faster-Whisper Model)"
        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
      >
        <Mic className="w-4 h-4" />
      </button>

      {errorMsg && (
        <div className="absolute bottom-full mb-2 left-0 w-64 p-2 rounded-xl bg-rose-500 text-white text-[11px] font-medium shadow-lg z-30 flex items-center gap-1.5 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="opacity-80 hover:opacity-100 text-xs">✕</button>
        </div>
      )}
    </div>
  );
}
