export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  page_number: number;
  content: string;
  token_count: number;
  meta_info?: Record<string, any>;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  total_pages: number;
  total_chunks: number;
  created_at: string;
  chunks?: DocumentChunk[];
}
