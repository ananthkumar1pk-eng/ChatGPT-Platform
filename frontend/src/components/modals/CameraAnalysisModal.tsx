"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  RefreshCw,
  Sparkles,
  Upload,
  Scan,
  Layers,
  FileText,
  HelpCircle,
  Check,
  Copy,
  ArrowRight,
  Loader2,
  Eye,
  Crosshair
} from "lucide-react";
import { ApiClient } from "@/lib/api";

interface CameraAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat: (analysisText: string, imagePreview?: string) => void;
}

const FLORENCE_TASKS = [
  { id: "more_detailed_caption", label: "Deep Scene Analysis", icon: Eye, desc: "Comprehensive high-fidelity scene description" },
  { id: "object_detection", label: "Object Detection", icon: Scan, desc: "Detect & locate visual objects with 2D coordinates" },
  { id: "ocr", label: "OCR Text Extraction", icon: FileText, desc: "Extract printed & handwritten text from image" },
  { id: "dense_caption", label: "Dense Regions", icon: Layers, desc: "Segment & describe distinct image regions" },
  { id: "vqa", label: "Visual Q&A", icon: HelpCircle, desc: "Ask specific questions about the camera picture" },
];

export function CameraAnalysisModal({
  isOpen,
  onClose,
  onInsertToChat,
}: CameraAnalysisModalProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");
  const [selectedTask, setSelectedTask] = useState<string>("more_detailed_caption");
  const [customQuestion, setCustomQuestion] = useState<string>("");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start webcam when modal opens on camera tab
  useEffect(() => {
    if (isOpen && activeTab === "camera" && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, cameraFacing, capturedImage]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(err.message || "Could not access camera. Please allow camera permissions or upload an image.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const switchCamera = () => {
    setCameraFacing((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL("image/jpeg", 0.92);
      setCapturedImage(dataUri);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    if (activeTab === "camera") {
      startCamera();
    }
  };

  const runFlorenceAnalysis = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const isQuestionProvided = Boolean(customQuestion && customQuestion.trim());
      const payload = {
        image_base64: capturedImage,
        task: isQuestionProvided ? "vqa" : selectedTask,
        custom_question: isQuestionProvided ? customQuestion.trim() : undefined,
      };

      const result = await ApiClient.post<any>("/api/vision/analyze", payload);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error("Florence-2 analysis failed:", err);
      setAnalysisResult({
        success: false,
        summary_markdown: `**Analysis Error**: ${err.message || "Failed to analyze image with Florence-2."}`,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendToChat = () => {
    if (!analysisResult) return;
    const md = analysisResult.summary_markdown || analysisResult.detailed_caption || "Visual analysis completed.";
    onInsertToChat(md, capturedImage || undefined);
    onClose();
  };

  const copyResultText = () => {
    if (!analysisResult) return;
    const text = analysisResult.ocr_text || analysisResult.summary_markdown || analysisResult.detailed_caption || "";
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Florence-2 VLM Picture Analysis
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">
                  Microsoft Vision Foundation
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Snap camera pictures or upload images for deep visual reasoning, OCR, and object detection.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Viewfinder / Image Canvas (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-3">
            {/* Tab switch */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("camera");
                  setCapturedImage(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "camera"
                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Camera className="w-3.5 h-3.5" /> Live Camera
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("upload");
                  stopCamera();
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "upload"
                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> Upload Image
              </button>
            </div>

            {/* Viewfinder Canvas */}
            <div className="relative aspect-video rounded-xl bg-black overflow-hidden flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-inner">
              {capturedImage ? (
                // Captured freeze frame
                <div className="relative w-full h-full">
                  <img
                    src={capturedImage}
                    alt="Captured Scene"
                    className="w-full h-full object-contain bg-zinc-950"
                  />
                  {isAnalyzing && (
                    // Florence Radar Scan Animation
                    <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] flex flex-col items-center justify-center">
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-0 animate-bounce" />
                      <div className="p-3 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 text-center shadow-xl">
                        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
                        <span className="text-xs font-semibold text-emerald-400">Florence-2 Vision Reasoning...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : activeTab === "camera" ? (
                cameraError ? (
                  <div className="p-6 text-center text-rose-400 text-xs max-w-sm">
                    <p className="mb-3">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold"
                    >
                      Retry Camera
                    </button>
                  </div>
                ) : (
                  // Live Camera Stream
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        onClick={switchCamera}
                        title="Flip Camera"
                        className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              ) : (
                // Upload Dropzone
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6 hover:bg-zinc-900/50 transition-colors border-2 border-dashed border-zinc-700 m-2 rounded-lg"
                >
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-300">Click to select photo or drag and drop</p>
                  <p className="text-[11px] text-slate-500 mt-1">PNG, JPG, WEBP up to 25MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Viewfinder Controls */}
            <div className="flex items-center justify-between gap-3">
              {capturedImage ? (
                <>
                  <button
                    onClick={handleRetake}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retake / New Image
                  </button>
                  <button
                    onClick={runFlorenceAnalysis}
                    disabled={isAnalyzing}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> Analyze with Florence-2
                      </>
                    )}
                  </button>
                </>
              ) : activeTab === "camera" ? (
                <button
                  onClick={handleCaptureSnapshot}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Crosshair className="w-4 h-4" /> Capture Snapshot
                </button>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                  Choose Image File
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Florence-2 Task Selector & Results (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            {/* Task selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                Select Florence-2 Vision Task
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {FLORENCE_TASKS.map((task) => {
                  const Icon = task.icon;
                  const isSelected = selectedTask === task.id;
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTask(task.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-white"
                          : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? "text-emerald-500" : "text-slate-400"}`} />
                      <div>
                        <div className="text-xs font-bold">{task.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{task.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visual Question input (Always available for deep VQA or custom questions) */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3 bg-slate-50/70 dark:bg-zinc-800/50">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Ask a Question about this Image</span>
                {customQuestion.trim() && (
                  <span className="text-[10px] text-emerald-500 font-mono">VQA Mode Active</span>
                )}
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && capturedImage && !isAnalyzing) {
                      e.preventDefault();
                      runFlorenceAnalysis();
                    }
                  }}
                  placeholder="e.g. What does this image show? What is written on it?"
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                Leave empty for automatic scene analysis, or type your question and press Enter.
              </span>
            </div>

            {/* Results Box */}
            {analysisResult && (
              <div className="flex-1 flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-white/10 animate-fade-in max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Florence-2 Results
                  </span>
                  <button
                    onClick={copyResultText}
                    title="Copy Result"
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {analysisResult.summary_markdown || analysisResult.detailed_caption || JSON.stringify(analysisResult, null, 2)}
                </div>

                {/* Detected Objects Chips */}
                {analysisResult.objects && analysisResult.objects.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-zinc-700">
                    <span className="text-[10px] font-semibold text-slate-500 block mb-1">Detected Bounding Boxes:</span>
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.objects.map((obj: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono border border-emerald-500/20"
                        >
                          {obj.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/40">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Powered by Microsoft Florence-2 Open Vision Foundation Model.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            {analysisResult && (
              <button
                onClick={handleSendToChat}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-md"
              >
                <span>Insert Analysis into Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
