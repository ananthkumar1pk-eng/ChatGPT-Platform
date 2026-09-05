export interface SourceCitation {
  document_id: string;
  filename: string;
  file_type: string;
  page_number: number;
  chunk_index: number;
  score: number;
  snippet: string;
}

export interface Feedback {
  id: string;
  message_id: string;
  rating: number; // 1 or -1
  feedback_text?: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  parent_id?: string;
  model?: string;
  token_count?: number;
  sources?: SourceCitation[];
  finish_reason?: string;
  created_at: string;
  feedback?: Feedback;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  provider: string;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message_preview?: string;
  system_prompt?: string;
  temperature?: string;
  messages?: Message[];
}
