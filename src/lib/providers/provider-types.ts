/**
 * NOVA AI — Multi-Provider Abstraction Types
 * Supports Google Gemini, Groq, OpenRouter (Free :free models), Ollama, and Anthropic.
 */

export type AIProviderId = "gemini" | "groq" | "openrouter" | "ollama" | "anthropic";

export interface UnifiedModelInfo {
  id: string;
  provider: AIProviderId;
  name: string;
  description: string;
  isFree: boolean;
  contextWindow: number;
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  badge: string; // e.g. "Google Free", "Groq Speed", "OpenRouter Free", "Local"
}

export interface ProviderChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: any[];
}

export interface ProviderStreamChunk {
  type: "text_delta" | "thinking_delta" | "tool_call" | "usage" | "error" | "provider_switch" | "done";
  text?: string;
  toolCall?: {
    id: string;
    name: string;
    input: Record<string, any>;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider?: AIProviderId;
  model?: string;
  error?: string;
  warning?: string;
}

export interface ProviderQuotaStatus {
  provider: AIProviderId;
  requestsToday: number;
  tokensToday: number;
  dailyRequestLimit: number;
  isRateLimited: boolean;
  rateLimitResetTime?: number;
  lastError?: string;
}
