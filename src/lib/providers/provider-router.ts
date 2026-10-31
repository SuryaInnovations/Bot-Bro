/**
 * NOVA AI — Central Multi-Provider Router & Auto-Failover Engine
 * Orchestrates free AI providers:
 *   1. Google Gemini (Primary Free Tier)
 *   2. Groq (Secondary Ultra-Fast Free Tier)
 *   3. OpenRouter (Tertiary Free :free Models Only)
 *   4. Ollama (Offline Local AI)
 *   5. Anthropic (Legacy Fallback if custom key is provided)
 *
 * Automatically fails over across providers on 429 rate limits, 503 service spikes, or network drops.
 */

import { GeminiProvider, GEMINI_FREE_MODELS } from "./gemini-provider";
import { GroqProvider, GROQ_FREE_MODELS } from "./groq-provider";
import { OpenRouterProvider, OPENROUTER_FREE_MODELS } from "./openrouter-provider";
import { OllamaProvider, DEFAULT_OLLAMA_MODELS } from "./ollama-provider";
import {
  AIProviderId,
  ProviderChatMessage,
  ProviderQuotaStatus,
  ProviderStreamChunk,
  UnifiedModelInfo,
} from "./provider-types";

export class ProviderRouter {
  private gemini: GeminiProvider;
  private groq: GroqProvider;
  private openrouter: OpenRouterProvider;
  private ollama: OllamaProvider;

  constructor() {
    this.gemini = new GeminiProvider();
    this.groq = new GroqProvider();
    this.openrouter = new OpenRouterProvider();
    this.ollama = new OllamaProvider();
  }

  /**
   * Get all supported models across all active providers
   */
  public async getAvailableModels(): Promise<UnifiedModelInfo[]> {
    const models: UnifiedModelInfo[] = [
      ...this.gemini.getModels(),
      ...this.groq.getModels(),
      ...this.openrouter.getModels(),
    ];

    // Check if Ollama is available locally
    try {
      const ollamaCheck = await this.ollama.checkAvailability();
      if (ollamaCheck.online && ollamaCheck.models.length > 0) {
        models.push(...ollamaCheck.models);
      }
    } catch {}

    return models;
  }

  /**
   * Resolve which provider owns a specific model ID
   */
  public resolveProvider(modelId: string): AIProviderId {
    if (!modelId) return "gemini";

    const lower = modelId.toLowerCase();
    if (lower.startsWith("gemini") || lower.includes("gemma")) {
      return "gemini";
    }
    if (lower.startsWith("openai/") || lower.startsWith("qwen/") || lower.startsWith("llama-") || lower.includes("groq")) {
      return "groq";
    }
    if (lower.includes(":free") || lower.startsWith("liquid/") || lower.startsWith("nvidia/")) {
      return "openrouter";
    }
    if (lower.includes(":latest") || lower.includes("ollama") || lower.includes("deepseek-coder")) {
      return "ollama";
    }
    if (lower.includes("claude")) {
      return "anthropic";
    }

    return "gemini";
  }

  /**
   * Get current quota health across all providers
   */
  public getQuotaStatuses(): Record<AIProviderId, ProviderQuotaStatus> {
    return {
      gemini: this.gemini.getQuota(),
      groq: this.groq.getQuota(),
      openrouter: this.openrouter.getQuota(),
      ollama: this.ollama.getQuota(),
      anthropic: {
        provider: "anthropic",
        requestsToday: 0,
        tokensToday: 0,
        dailyRequestLimit: 0,
        isRateLimited: false,
        lastError: "Paid Anthropic API omitted in favor of Free AI Providers",
      },
    };
  }

  /**
   * Stream a chat response with automatic multi-tier fallback
   */
  public async *streamChatWithFallback(params: {
    requestedModel?: string;
    messages: ProviderChatMessage[];
    systemPrompt?: string;
    tools?: any[];
    maxTokens?: number;
    temperature?: number;
    customApiKey?: string;
  }): AsyncGenerator<ProviderStreamChunk, void, unknown> {
    const requestedModel = params.requestedModel || "gemini-flash-lite-latest";
    const primaryProvider = this.resolveProvider(requestedModel);

    // Build the ordered fallback ladder based on requested provider
    const fallbackLadder: Array<{ provider: AIProviderId; defaultModel: string }> = [];

    // Add primary choice first
    fallbackLadder.push({
      provider: primaryProvider,
      defaultModel: requestedModel,
    });

    // Add remaining free providers in optimal reliability order
    const defaultOrder: Array<{ provider: AIProviderId; defaultModel: string }> = [
      { provider: "gemini", defaultModel: "gemini-flash-lite-latest" },
      { provider: "groq", defaultModel: "openai/gpt-oss-120b" },
      { provider: "openrouter", defaultModel: "liquid/lfm-2.5-2.6b:free" },
    ];

    for (const item of defaultOrder) {
      if (item.provider !== primaryProvider) {
        fallbackLadder.push(item);
      }
    }

    let lastError = "";
    let successfullyStarted = false;

    for (let i = 0; i < fallbackLadder.length; i++) {
      const currentTier = fallbackLadder[i];
      const isFallback = i > 0;

      if (isFallback) {
        yield {
          type: "provider_switch",
          provider: currentTier.provider,
          model: currentTier.defaultModel,
          warning: `Switching to free provider (${currentTier.provider}: ${currentTier.defaultModel}) due to: ${lastError}`,
        };
      }

      let hasYieldedChunk = false;
      let encounteredError = false;

      try {
        let streamGen: AsyncGenerator<ProviderStreamChunk, void, unknown>;

        if (currentTier.provider === "gemini") {
          streamGen = this.gemini.streamChat({
            model: isFallback ? "gemini-flash-lite-latest" : currentTier.defaultModel,
            messages: params.messages,
            systemPrompt: params.systemPrompt,
            tools: params.tools,
            maxTokens: params.maxTokens,
            temperature: params.temperature,
          });
        } else if (currentTier.provider === "groq") {
          streamGen = this.groq.streamChat({
            model: isFallback ? "openai/gpt-oss-120b" : currentTier.defaultModel,
            messages: params.messages,
            systemPrompt: params.systemPrompt,
            tools: params.tools,
            maxTokens: params.maxTokens,
            temperature: params.temperature,
          });
        } else if (currentTier.provider === "openrouter") {
          streamGen = this.openrouter.streamChat({
            model: isFallback ? "liquid/lfm-2.5-2.6b:free" : currentTier.defaultModel,
            messages: params.messages,
            systemPrompt: params.systemPrompt,
            tools: params.tools,
            maxTokens: params.maxTokens,
            temperature: params.temperature,
          });
        } else if (currentTier.provider === "ollama") {
          streamGen = this.ollama.streamChat({
            model: currentTier.defaultModel,
            messages: params.messages,
            systemPrompt: params.systemPrompt,
            tools: params.tools,
            maxTokens: params.maxTokens,
            temperature: params.temperature,
          });
        } else {
          // Anthropic fallback only if custom key provided
          lastError = "Anthropic API skipped (Free provider mode active).";
          continue;
        }

        for await (const chunk of streamGen) {
          if (chunk.type === "error") {
            encounteredError = true;
            lastError = chunk.error || "Unknown provider error";
            break;
          }

          hasYieldedChunk = true;
          successfullyStarted = true;
          yield chunk;
        }

        // If this provider successfully completed its stream, break out of fallback loop
        if (!encounteredError && hasYieldedChunk) {
          return;
        }
      } catch (err: any) {
        lastError = err?.message || "Execution exception occurred";
        encounteredError = true;
      }

      // If we already yielded parts of the response to the user, we cannot switch midway
      // without duplicating text, so we report the error and terminate.
      if (successfullyStarted && hasYieldedChunk) {
        yield {
          type: "error",
          provider: currentTier.provider,
          error: `Stream interrupted during output: ${lastError}`,
        };
        return;
      }
    }

    // If all providers in the fallback ladder failed
    yield {
      type: "error",
      error: `All free AI providers are currently busy or rate-limited. Last error: ${lastError}. Please wait a moment and retry.`,
    };
  }
}

export const providerRouter = new ProviderRouter();
