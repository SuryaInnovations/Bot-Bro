/**
 * NOVA AI — Local Ollama Provider Connector
 * Integrates local offline inference via Ollama HTTP API (http://localhost:11434).
 * Provides instantaneous offline privacy, zero network egress, and fast availability checks.
 */

import {
  AIProviderId,
  ProviderChatMessage,
  ProviderQuotaStatus,
  ProviderStreamChunk,
  UnifiedModelInfo,
} from "./provider-types";

export const DEFAULT_OLLAMA_MODELS: UnifiedModelInfo[] = [
  {
    id: "llama3.2:latest",
    provider: "ollama",
    name: "Llama 3.2 (Local Ollama)",
    description: "Meta's lightweight local model running directly on your machine. 100% private.",
    isFree: true,
    contextWindow: 131072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: false,
    badge: "Local AI",
  },
  {
    id: "mistral:latest",
    provider: "ollama",
    name: "Mistral 7B (Local Ollama)",
    description: "Fast and versatile general-purpose open model running locally via Ollama.",
    isFree: true,
    contextWindow: 32768,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsTools: false,
    supportsVision: false,
    badge: "Local AI",
  },
  {
    id: "deepseek-coder:6.7b",
    provider: "ollama",
    name: "DeepSeek Coder 6.7B (Local Ollama)",
    description: "Specialized code generation & refactoring model running entirely offline.",
    isFree: true,
    contextWindow: 16384,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsTools: false,
    supportsVision: false,
    badge: "Local AI",
  },
];

export class OllamaProvider {
  private baseUrl: string;
  private isOnline: boolean = false;
  private lastHealthCheckTime: number = 0;
  private cachedModels: UnifiedModelInfo[] = [];

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  }

  /**
   * Fast non-blocking health check to see if Ollama is running locally
   */
  public async checkAvailability(): Promise<{ online: boolean; models: UnifiedModelInfo[] }> {
    const now = Date.now();
    // Cache health check status for 30 seconds to prevent unnecessary local probes
    if (now - this.lastHealthCheckTime < 30000 && this.cachedModels.length > 0) {
      return { online: this.isOnline, models: this.cachedModels };
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(1500), // Quick 1.5s timeout
      });

      if (res.ok) {
        const data = await res.json();
        this.isOnline = true;
        this.lastHealthCheckTime = now;

        if (Array.isArray(data.models) && data.models.length > 0) {
          this.cachedModels = data.models.map((m: any) => ({
            id: m.name,
            provider: "ollama" as AIProviderId,
            name: `${m.name} (Local)`,
            description: `Locally installed Ollama model (${Math.round((m.size || 0) / (1024 * 1024 * 1024))}GB). 100% private.`,
            isFree: true,
            contextWindow: 32768,
            maxOutputTokens: 4096,
            supportsStreaming: true,
            supportsTools: false,
            supportsVision: false,
            badge: "Local AI",
          }));
        } else {
          this.cachedModels = DEFAULT_OLLAMA_MODELS;
        }

        return { online: true, models: this.cachedModels };
      }
    } catch {
      // Ollama service is not running
    }

    this.isOnline = false;
    this.lastHealthCheckTime = now;
    return { online: false, models: [] };
  }

  public getQuota(): ProviderQuotaStatus {
    return {
      provider: "ollama",
      requestsToday: 0,
      tokensToday: 0,
      dailyRequestLimit: Infinity, // Local has no quota limit!
      isRateLimited: false,
    };
  }

  public getModels(): UnifiedModelInfo[] {
    return this.cachedModels.length > 0 ? this.cachedModels : DEFAULT_OLLAMA_MODELS;
  }

  /**
   * Format messages for Ollama API
   */
  private formatMessages(messages: ProviderChatMessage[], systemPrompt?: string): any[] {
    const formatted: any[] = [];

    if (systemPrompt) {
      formatted.push({
        role: "system",
        content: systemPrompt,
      });
    }

    for (const msg of messages) {
      let textContent = msg.content || "";
      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.extractedText) {
            textContent += `\n\n[Attached Document: "${att.name}" (${att.type})]\n${att.extractedText}`;
          }
        }
      }

      formatted.push({
        role: msg.role,
        content: textContent,
      });
    }

    return formatted;
  }

  /**
   * Stream a chat response from local Ollama
   */
  public async *streamChat(params: {
    model?: string;
    messages: ProviderChatMessage[];
    systemPrompt?: string;
    tools?: any[];
    maxTokens?: number;
    temperature?: number;
  }): AsyncGenerator<ProviderStreamChunk, void, unknown> {
    const chosenModel = params.model || "llama3.2:latest";
    const url = `${this.baseUrl}/api/chat`;

    const requestBody = {
      model: chosenModel,
      messages: this.formatMessages(params.messages, params.systemPrompt),
      stream: true,
      options: {
        temperature: params.temperature ?? 0.7,
        num_predict: params.maxTokens || 4096,
      },
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000),
      });
    } catch (networkErr: any) {
      yield {
        type: "error",
        provider: "ollama",
        error: `Ollama is offline or unreachable at ${this.baseUrl}: ${networkErr?.message}`,
      };
      return;
    }

    if (!response.ok) {
      const errText = await response.text();
      yield {
        type: "error",
        provider: "ollama",
        error: `Ollama HTTP ${response.status}: ${errText}`,
      };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield {
        type: "error",
        provider: "ollama",
        error: "Failed to initialize reader from Ollama stream.",
      };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const data = JSON.parse(trimmed);
            if (data.message?.content) {
              yield {
                type: "text_delta",
                provider: "ollama",
                model: chosenModel,
                text: data.message.content,
              };
            }

            if (data.done) {
              if (data.prompt_eval_count || data.eval_count) {
                yield {
                  type: "usage",
                  provider: "ollama",
                  usage: {
                    promptTokens: data.prompt_eval_count || 0,
                    completionTokens: data.eval_count || 0,
                    totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
                  },
                };
              }
            }
          } catch {}
        }
      }

      yield {
        type: "done",
        provider: "ollama",
        model: chosenModel,
      };
    } finally {
      reader.releaseLock();
    }
  }
}
