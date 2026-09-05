"use client";

import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, FileText, Trash2, CheckCircle, X, Plus, BookCheck, Layers } from "lucide-react";
import { DocumentItem } from "@/types/document";
import { ApiClient } from "@/lib/api";
import { formatBytes } from "@/lib/utils";
import { useChat } from "@/context/ChatContext";

interface FileUploadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FileUploadDrawer({ isOpen, onClose }: FileUploadDrawerProps) {
  const { attachedDocs, attachDocument, removeAttachedDocument } = useChat();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen]);

  const loadDocuments = async () => {
    try {
      const list = await ApiClient.get<DocumentItem[]>("/api/documents");
      setDocuments(list);
    } catch (err: any) {
      console.error("Failed to load documents", err);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const newDoc = await ApiClient.upload<DocumentItem>("/api/documents/upload", formData);
        setDocuments((prev) => [newDoc, ...prev]);
        attachDocument(newDoc);
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await ApiClient.delete(`/api/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      removeAttachedDocument(docId);
    } catch (err: any) {
      setError(err.message || "Failed to delete document");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#212121] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <BookCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">RAG Knowledge Base & Documents</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Upload PDF, DOCX, TXT, CSV, JSON for AI document Q&A</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Drag and drop upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-emerald-500 bg-emerald-500/5"
                : "border-slate-300 dark:border-slate-700 hover:border-emerald-500/60 bg-slate-50 dark:bg-slate-900/40"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files)}
              multiple
              accept=".pdf,.docx,.doc,.txt,.md,.csv,.json"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {isUploading ? "Parsing and Indexing Documents..." : "Click or Drag & Drop documents here"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supported Formats: PDF, Word (DOCX), Text (TXT, MD), CSV Tables, JSON Data (Max 25MB)
            </p>
          </div>

          {/* Documents List */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Your Uploaded Library ({documents.length})
            </h3>

            {documents.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No documents uploaded yet.</p>
            ) : (
              documents.map((doc) => {
                const isAttached = attachedDocs.some((d) => d.id === doc.id);
                return (
                  <div
                    key={doc.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isAttached
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        {doc.file_type}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {doc.filename}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{formatBytes(doc.file_size)}</span>
                          <span>•</span>
                          <span>{doc.total_pages} {doc.total_pages > 1 ? "Pages" : "Page"}</span>
                          <span>•</span>
                          <span>{doc.total_chunks} Chunks</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => (isAttached ? removeAttachedDocument(doc.id) : attachDocument(doc))}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          isAttached
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                        }`}
                      >
                        {isAttached ? <CheckCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {isAttached ? "Active in Chat" : "Attach to Chat"}
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        title="Delete document"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a1a1a] flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {attachedDocs.length} document{attachedDocs.length !== 1 ? "s" : ""} attached for RAG context
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
