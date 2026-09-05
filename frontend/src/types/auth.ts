export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  auth_provider: string;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface UserSettings {
  default_model: string;
  default_provider: string;
  system_prompt?: string;
  temperature: string;
  theme: string;
  custom_api_keys_status: {
    groq: boolean;
    openai: boolean;
    gemini: boolean;
    anthropic: boolean;
    openrouter: boolean;
  };
}

export interface AvailableModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  context_window: string;
  is_default: boolean;
  is_free: boolean;
}
