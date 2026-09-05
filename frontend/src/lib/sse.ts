const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface StreamCallbacks {
  onStart?: (data: { conversation_id: string; message_id: string; model: string }) => void;
  onToken?: (token: string) => void;
  onSources?: (sources: any[]) => void;
  onDone?: (data: { full_text: string; token_count: number; finish_reason: string }) => void;
  onError?: (error: string) => void;
}

export async function streamChat(
  payload: {
    conversation_id?: string;
    content: string;
    model?: string;
    provider?: string;
    temperature?: number;
    system_prompt?: string;
    use_rag?: boolean;
    document_ids?: string[];
  },
  callbacks: StreamCallbacks,
  abortSignal?: AbortSignal
): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("chatgpt_access_token") : null;
  const url = `${API_BASE_URL}/api/chat/stream`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: abortSignal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || `Server error ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("ReadableStream not supported by browser");

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const block of lines) {
        if (!block.trim()) continue;

        let eventType = "message";
        let dataStr = "";

        const blockLines = block.split("\n");
        for (const line of blockLines) {
          if (line.startsWith("event: ")) {
            eventType = line.replace("event: ", "").trim();
          } else if (line.startsWith("data: ")) {
            dataStr = line.replace("data: ", "").trim();
          }
        }

        if (!dataStr) continue;

        try {
          const parsed = JSON.parse(dataStr);
          if (eventType === "start" && callbacks.onStart) {
            callbacks.onStart(parsed);
          } else if (eventType === "token" && callbacks.onToken) {
            callbacks.onToken(parsed.token || "");
          } else if (eventType === "sources" && callbacks.onSources) {
            callbacks.onSources(parsed.sources || []);
          } else if (eventType === "done" && callbacks.onDone) {
            callbacks.onDone(parsed);
          } else if (eventType === "error" && callbacks.onError) {
            callbacks.onError(parsed.error || "Streaming error occurred");
          }
        } catch {
          // In case of non-JSON data
          if (eventType === "token" && callbacks.onToken) {
            callbacks.onToken(dataStr);
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      // Stream aborted by user
      return;
    }
    if (callbacks.onError) {
      callbacks.onError(err.message || "Failed to communicate with AI server");
    }
  }
}
