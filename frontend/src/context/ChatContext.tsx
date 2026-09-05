"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Conversation, Message, SourceCitation } from "@/types/chat";
import { AvailableModel } from "@/types/auth";
import { DocumentItem } from "@/types/document";
import { ApiClient } from "@/lib/api";
import { streamChat } from "@/lib/sse";
import { useAuth } from "@/context/AuthContext";

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  models: AvailableModel[];
  selectedModel: string;
  selectedProvider: string;
  isStreaming: boolean;
  attachedDocs: DocumentItem[];
  useRag: boolean;
  loadConversations: (query?: string) => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  createConversation: (title?: string) => Promise<string>;
  sendMessage: (prompt: string) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  togglePinConversation: (id: string, pinned: boolean) => Promise<void>;
  submitFeedback: (messageId: string, rating: number, comment?: string) => Promise<void>;
  stopStreaming: () => void;
  setSelectedModel: (modelId: string) => void;
  attachDocument: (doc: DocumentItem) => void;
  removeAttachedDocument: (docId: string) => void;
  setUseRag: (val: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [models, setModels] = useState<AvailableModel[]>([]);
  const [selectedModel, setSelectedModelState] = useState<string>("llama-3.3-70b-versatile");
  const [selectedProvider, setSelectedProvider] = useState<string>("groq");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [attachedDocs, setAttachedDocs] = useState<DocumentItem[]>([]);
  const [useRag, setUseRag] = useState<boolean>(true);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load models on startup
  useEffect(() => {
    async function fetchModels() {
      try {
        const list = await ApiClient.get<AvailableModel[]>("/api/models");
        setModels(list);
        if (list.length > 0) {
          const def = list.find((m) => m.is_default) || list[0];
          setSelectedModelState(def.id);
          setSelectedProvider(def.provider);
        }
      } catch (err) {
        console.error("Failed to fetch models", err);
      }
    }
    fetchModels();
  }, []);

  // Load conversations on mount and when user logs in/out
  useEffect(() => {
    loadConversations();
  }, [user]);


  const loadConversations = async (query?: string) => {
    try {
      const endpoint = query ? `/api/chat/conversations?q=${encodeURIComponent(query)}` : "/api/chat/conversations";
      const list = await ApiClient.get<Conversation[]>(endpoint);
      setConversations(list);
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  };

  const selectConversation = async (id: string) => {
    try {
      const detail = await ApiClient.get<Conversation>(`/api/chat/conversations/${id}`);
      setActiveConversation(detail);
      setMessages(detail.messages || []);
      if (detail.model) setSelectedModelState(detail.model);
      if (detail.provider) setSelectedProvider(detail.provider);
    } catch (err) {
      console.error("Failed to select conversation", err);
    }
  };

  const createConversation = async (title = "New Chat"): Promise<string> => {
    try {
      const newConv = await ApiClient.post<Conversation>("/api/chat/conversations", {
        title,
        model: selectedModel,
        provider: selectedProvider,
      });
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversation(newConv);
      setMessages([]);
      router.push(`/c/${newConv.id}`);
      return newConv.id;
    } catch (err) {
      console.error("Failed to create conversation", err);
      return "";
    }
  };

  const setSelectedModel = (modelId: string) => {
    setSelectedModelState(modelId);
    const found = models.find((m) => m.id === modelId);
    if (found) {
      setSelectedProvider(found.provider);
    }
    if (activeConversation) {
      ApiClient.patch(`/api/chat/conversations/${activeConversation.id}`, {
        model: modelId,
        provider: found?.provider,
      }).catch(console.error);
    }
  };

  const attachDocument = (doc: DocumentItem) => {
    if (!attachedDocs.some((d) => d.id === doc.id)) {
      setAttachedDocs((prev) => [...prev, doc]);
    }
  };

  const removeAttachedDocument = (docId: string) => {
    setAttachedDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const sendMessage = async (promptText: string) => {
    if (!promptText.trim() || isStreaming) return;

    const userTempId = `user-${Date.now()}`;
    const assistantTempId = `assistant-${Date.now()}`;

    const userMessage: Message = {
      id: userTempId,
      conversation_id: activeConversation?.id || "",
      role: "user",
      content: promptText,
      created_at: new Date().toISOString(),
    };

    const assistantPlaceholder: Message = {
      id: assistantTempId,
      conversation_id: activeConversation?.id || "",
      role: "assistant",
      content: "",
      model: selectedModel,
      created_at: new Date().toISOString(),
      isStreaming: true,
      sources: [],
    };

    // Optimistically update message stream
    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setIsStreaming(true);

    abortControllerRef.current = new AbortController();

    const docIds = attachedDocs.map((d) => d.id);

    try {
      await streamChat(
        {
          conversation_id: activeConversation?.id,
          content: promptText,
          model: selectedModel,
          provider: selectedProvider,
          use_rag: useRag && docIds.length > 0,
          document_ids: docIds.length > 0 ? docIds : undefined,
        },
        {
          onStart: (data) => {
            if (!activeConversation || activeConversation.id !== data.conversation_id) {
              // Created a new conversation on the fly
              loadConversations();
              if (window.location.pathname === "/") {
                window.history.replaceState(null, "", `/c/${data.conversation_id}`);
              }
            }
          },
          onToken: (token) => {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: updated[lastIdx].content + token,
                };
              }
              return updated;
            });
          },
          onSources: (sources) => {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  sources,
                };
              }
              return updated;
            });
          },
          onDone: (data) => {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: data.full_text || updated[lastIdx].content,
                  isStreaming: false,
                };
              }
              return updated;
            });
            setIsStreaming(false);
            loadConversations();
          },
          onError: (errMsg) => {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: updated[lastIdx].content + `\n\n⚠️ *${errMsg}*`,
                  isStreaming: false,
                };
              }
              return updated;
            });
            setIsStreaming(false);
          },
        },
        abortControllerRef.current.signal
      );
    } catch (err: any) {
      console.error("Stream send failed", err);
      setIsStreaming(false);
    }
  };

  const regenerateMessage = async (messageId: string) => {
    // Find preceding user prompt
    const msgIdx = messages.findIndex((m) => m.id === messageId);
    if (msgIdx <= 0) return;
    const userPrompt = messages[msgIdx - 1].content;
    // Remove the assistant message and resend
    setMessages((prev) => prev.slice(0, msgIdx));
    await sendMessage(userPrompt);
  };

  const editMessage = async (messageId: string, newContent: string) => {
    const msgIdx = messages.findIndex((m) => m.id === messageId);
    if (msgIdx === -1) return;
    // Cut message history to this edit point and send new message
    setMessages((prev) => prev.slice(0, msgIdx));
    await sendMessage(newContent);
  };

  const deleteConversation = async (id: string) => {
    try {
      await ApiClient.delete(`/api/chat/conversations/${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversation?.id === id) {
        setActiveConversation(null);
        setMessages([]);
        router.push("/");
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  };

  const updateConversationTitle = async (id: string, title: string) => {
    try {
      await ApiClient.patch(`/api/chat/conversations/${id}`, { title });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
      if (activeConversation?.id === id) {
        setActiveConversation((prev) => (prev ? { ...prev, title } : null));
      }
    } catch (err) {
      console.error("Failed to update title", err);
    }
  };

  const togglePinConversation = async (id: string, pinned: boolean) => {
    try {
      await ApiClient.patch(`/api/chat/conversations/${id}`, { is_pinned: pinned });
      loadConversations();
    } catch (err) {
      console.error("Failed to toggle pin", err);
    }
  };

  const submitFeedback = async (messageId: string, rating: number, feedbackText?: string) => {
    try {
      const fb = await ApiClient.post<any>(`/api/chat/messages/${messageId}/feedback`, {
        rating,
        feedback_text: feedbackText,
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback: fb } : m))
      );
    } catch (err) {
      console.error("Failed to submit feedback", err);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        models,
        selectedModel,
        selectedProvider,
        isStreaming,
        attachedDocs,
        useRag,
        loadConversations,
        selectConversation,
        createConversation,
        sendMessage,
        regenerateMessage,
        editMessage,
        deleteConversation,
        updateConversationTitle,
        togglePinConversation,
        submitFeedback,
        stopStreaming,
        setSelectedModel,
        attachDocument,
        removeAttachedDocument,
        setUseRag,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
}
