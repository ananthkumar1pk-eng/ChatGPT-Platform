export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    }
    return "https://chatgpt-platform-wpci.onrender.com";
  }
  return process.env.NEXT_PUBLIC_API_URL || "https://chatgpt-platform-wpci.onrender.com";
}

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("chatgpt_access_token");
  }

  private static getHeaders(isFormData = false): HeadersInit {
    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  public static async get<T>(endpoint: string): Promise<T> {
    const url = `${getApiBaseUrl()}${endpoint}`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Request failed");
    }
    return res.json();
  }

  public static async post<T>(endpoint: string, body?: any): Promise<T> {
    const url = `${getApiBaseUrl()}${endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Request failed");
    }
    return res.json();
  }

  public static async patch<T>(endpoint: string, body: any): Promise<T> {
    const url = `${getApiBaseUrl()}${endpoint}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Request failed");
    }
    return res.json();
  }

  public static async delete<T>(endpoint: string): Promise<T> {
    const url = `${getApiBaseUrl()}${endpoint}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Request failed");
    }
    return res.json();
  }

  public static async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${getApiBaseUrl()}${endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(true),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  }

  public static async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.upload<T>(endpoint, formData);
  }
}

