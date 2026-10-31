/**
 * NOVA AI — OpenRouter Provider Connector (Strict Free Tier Protection)
 * Exclusively queries zero-cost models ending with `:free`.
 * Includes hardcoded safeguard: Never requests paid models under any circumstances.
 */

import {
  AIProviderId,
  ProviderChatMessage,
  ProviderQuotaStatus,
  ProviderStreamChunk,
  UnifiedModelInfo,
} from "./provider-types";

export const OPENROUTER_FREE_MODELS: UnifiedModelInfo[] = [
  {
    id: "liquid/lfm-2.5-2.6b:free",
    provider: "openrouter",
    name: "Liquid LFM 2.5 2.6B (Free)",
    description: "Ultra-efficient Liquid Neural Network model. Zero cost, responsive and agile.",
    isFree: true,
    contextWindow: 32768,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsTools: false,
    supportsVision: false,
    badge: "OpenRouter Free",
  },
  {
    id: "nvidia/nemotron-3.5-lightning:free",
    provider: "openrouter",
    name: "NVIDIA Nemotron 3.5 Lightning (Free)",
    description: "NVIDIA accelerated foundation model for synthesis, analysis and coding.",
    isFree: true,
    contextWindow: 65536,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsTools: false,
    supportsVision: false,
    badge: "OpenRouter Free",
  },
  {
    id: "meta-llama/llama-3.2-3b-instruct:free",
    provider: "openrouter",
    name: "Meta Llama 3.2 3B Instruct (Free)",
    description: "Fast lightweight instruction-tuned model by Meta, free on OpenRouter.",
    isFree: true,
    contextWindow: 131072,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsTools: false,
    supportsVision: false,
    badge: "OpenRouter Free",
  },
];

export class OpenRouterProvider {
  private apiKey: string;
  private quotaStatus: ProviderQuotaStatus = {
    provider: "openrouter",
    requestsToday: 0,
    tokensToday: 0,
    dailyRequestLimit: 200, // OpenRouter Free Tier: 200 requests/day
    isRateLimited: false,
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || "";
  }

  public getQuota(): ProviderQuotaStatus {
    return { ...this.quotaStatus };
  }

  public getModels(): UnifiedModelInfo[] {
    return OPENROUTER_FREE_MODELS;
  }

  /**
   * Enforce strict zero-cost model check.
   * NEVER allow a paid model to be invoked through OpenRouter.
   */
  private enforceFreeModelOnly(modelId?: string): string {
    const defaultFree = "liquid/lfm-2.5-2.6b:free";
    if (!modelId) return defaultFree;

    const trimmed = modelId.trim();
    if (trimmed.endsWith(":free")) {
      return trimmed;
    }

    console.warn(
      `[OpenRouter Guard] Blocked attempt to query non-free model "${modelId}". Safely redirected to free model: ${defaultFree}`
    );
    return defaultFree;
  }

  /**
   * Format messages for OpenRouter OpenAI-compatible endpoint
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
   * Stream a chat response from OpenRouter
   */
  public async *streamChat(params: {
    model?: string;
    messages: ProviderChatMessage[];
    systemPrompt?: string;
    tools?: any[];
    maxTokens?: number;
    temperature?: number;
  }): AsyncGenerator<ProviderStreamChunk, void, unknown> {
    // CRITICAL: Ensure model is 100% free
    const chosenModel = this.enforceFreeModelOnly(params.model);
    const url = "https://openrouter.ai/api/v1/chat/completions";

    const requestBody: any = {
      model: chosenModel,
      messages: this.formatMessages(params.messages, params.systemPrompt),
      max_tokens: params.maxTokens || 4096,
      temperature: params.temperature ?? 0.7,
      stream: true,
    };

    this.quotaStatus.requestsToday++;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://nova-ai.local",
          "X-Title": "NOVA AI Free Intelligence",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000),
      });
    } catch (networkErr: any) {
      yield {
        type: "error",
        provider: "openrouter",
        error: `OpenRouter Network Error: ${networkErr?.message || "Failed to reach OpenRouter API."}`,
      };
      return;
    }

    if (!response.ok) {
      const errText = await response.text();
      let parsedMessage = errText;
      try {
        const json = JSON.parse(errText);
        parsedMessage = json.error?.message || errText;
      } catch {}

      if (response.status === 429) {
        this.quotaStatus.isRateLimited = true;
        this.quotaStatus.rateLimitResetTime = Date.now() + 60000;
        this.quotaStatus.lastError = "OpenRouter free limit reached (429).";
      }

      yield {
        type: "error",
        provider: "openrouter",
        error: `OpenRouter HTTP ${response.status}: ${parsedMessage}`,
      };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield {
        type: "error",
        provider: "openrouter",
        error: "Failed to initialize response reader from OpenRouter stream.",
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
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          if (trimmed === "data: [DONE]") continue;

          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            const choice = data.choices?.[0];

            if (choice?.delta?.content) {
              yield {
                type: "text_delta",
                provider: "openrouter",
                model: chosenModel,
                text: choice.delta.content,
              };
            }

            if (data.usage) {
              const promptTokens = data.usage.prompt_tokens || 0;
              const completionTokens = data.usage.completion_tokens || 0;
              const totalTokens = data.usage.total_tokens || 0;
              this.quotaStatus.tokensToday += totalTokens;

              yield {
                type: "usage",
                provider: "openrouter",
                usage: {
                  promptTokens,
                  completionTokens,
                  totalTokens,
                },
              };
            }
          } catch {}
        }
      }

      yield {
        type: "done",
        provider: "openrouter",
        model: chosenModel,
      };
    } finally {
      reader.releaseLock();
    }
  }
}
