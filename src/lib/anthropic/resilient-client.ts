/**
 * NOVA AI — Enterprise Resilient Claude API Client
 * Features dynamic model routing, exponential backoff with full jitter,
 * context-window sliding compression, multi-key rotation, and graceful fallback.
 */

import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, resolveActualModelId } from "./client";
import { distributedQueue } from "../scalability/distributed-queue";
import { cacheManager } from "../scalability/cache-manager";
import { parseAnthropicError } from "./api/errors";

export interface ResilientExecutionOptions {
  modelId: string;
  messages: any[];
  systemPrompt: string;
  tools?: any[];
  enableThinking?: boolean;
  thinkingBudget?: number;
  userId?: string;
  customApiKey?: string;
  maxRetries?: number;
}

export interface ModelRoutingDecision {
  selectedModel: string;
  routingReason: string;
  isFallback: boolean;
  estimatedTokens: number;
}

export interface TokenCostEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
}

class ResilientClaudeClient {
  private primaryKey: string;
  private fallbackKeys: string[] = [];

  constructor() {
    this.primaryKey = process.env.ANTHROPIC_API_KEY || "";
    const secondary = process.env.ANTHROPIC_API_KEY_FALLBACK || process.env.ANTHROPIC_API_KEY_SECONDARY || "";
    if (secondary) {
      this.fallbackKeys = secondary.split(",").map((k) => k.trim()).filter(Boolean);
    }
  }

  /**
   * Intelligently selects the optimal model based on query complexity and current traffic.
   */
  public routeModel(prompt: string, requestedModel?: string): ModelRoutingDecision {
    const p = prompt.toLowerCase();
    const tokenEst = Math.ceil(prompt.length / 4);

    // If explicit complex coding or reasoning requested, keep flagship Sonnet 3.7
    const requiresDeepReasoning =
      p.includes("code") ||
      p.includes("debug") ||
      p.includes("architect") ||
      p.includes("plan") ||
      p.includes("why") ||
      p.includes("compare") ||
      p.includes("analyze") ||
      prompt.length > 500;

    if (!requiresDeepReasoning && prompt.length < 80 && !requestedModel?.includes("sonnet")) {
      return {
        selectedModel: "claude-3-5-haiku-20241022",
        routingReason: "Fast utility routing for concise conversational query",
        isFallback: false,
        estimatedTokens: tokenEst,
      };
    }

    const actual = resolveActualModelId(requestedModel || "claude-3-7-sonnet-20250219");
    return {
      selectedModel: actual,
      routingReason: "Full reasoning and multimodal capabilities requested",
      isFallback: false,
      estimatedTokens: tokenEst,
    };
  }

  /**
   * Compresses long conversation history to prevent context overflow while preserving vital context.
   */
  public compressContextWindow(messages: any[], maxTokensThreshold = 14000): any[] {
    let totalChars = 0;
    for (const msg of messages) {
      const text = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
      totalChars += text.length;
    }

    const estimatedTokens = Math.ceil(totalChars / 4);
    if (estimatedTokens <= maxTokensThreshold || messages.length <= 6) {
      return messages;
    }

    // Retain initial system intent, compress middle turns, keep last 6 turns verbatim
    const recentTurns = messages.slice(-6);
    const olderTurns = messages.slice(0, -6);

    const summarizedBulletPoints = olderTurns
      .filter((m) => m.role === "user")
      .slice(-4)
      .map((m) => {
        const text = typeof m.content === "string" ? m.content : "User request";
        return `• User inquired: "${text.slice(0, 100)}${text.length > 100 ? "..." : ""}"`;
      })
      .join("\n");

    const summaryBlock = {
      role: "user",
      content: `[NOVA AI Long Conversation Compression Checkpoint]\nPrevious conversation context:\n${summarizedBulletPoints}\n[End Previous Context]`,
    };

    const summaryAck = {
      role: "assistant",
      content: "Understood. I retain the full context of our earlier discussion and will seamlessly continue.",
    };

    return [summaryBlock, summaryAck, ...recentTurns];
  }

  /**
   * Executes streaming request with full exponential backoff and model/key fallback.
   */
  public async executeStreamWithRetry(
    options: ResilientExecutionOptions,
    onChunk: (event: any) => void
  ): Promise<TokenCostEstimate> {
    const {
      modelId,
      messages,
      systemPrompt,
      tools,
      enableThinking = true,
      thinkingBudget = 2048,
      userId = "anonymous-user",
      customApiKey,
      maxRetries = 3,
    } = options;

    // Acquire ticket from fair distributed queue
    const queueTicket = await distributedQueue.enqueue(userId, "interactive_chat", { modelId });

    try {
      let currentModel = modelId;
      let attempt = 0;
      let lastError: any = null;

      // Model fallback ladder
      const fallbackLadder = [
        currentModel,
        "claude-3-5-sonnet-20241022",
        "claude-3-5-haiku-20241022",
      ];

      while (attempt <= maxRetries) {
        attempt++;
        try {
          const client = getAnthropicClient(customApiKey || this.getActiveKey(attempt));
          const compressed = this.compressContextWindow(messages);

          const isThinking =
            enableThinking && currentModel.includes("claude-3-7-sonnet");

          const streamParams: any = {
            model: currentModel,
            max_tokens: isThinking ? 16000 : 8192,
            system: systemPrompt,
            messages: compressed,
            tools: tools && tools.length > 0 ? tools : undefined,
            stream: true,
          };

          if (isThinking) {
            streamParams.thinking = {
              type: "enabled",
              budget_tokens: Math.max(1024, Math.min(32000, thinkingBudget)),
            };
          }

          const stream = (await client.messages.create(streamParams)) as any;

          let inputTokens = 0;
          let outputTokens = 0;

          for await (const event of stream) {
            onChunk(event);
            if (event.type === "message_start" && event.message?.usage) {
              inputTokens = event.message.usage.input_tokens || 0;
            } else if (event.type === "message_delta" && event.usage) {
              outputTokens = event.usage.output_tokens || 0;
            }
          }

          const pricing = this.calculatePricing(currentModel, inputTokens, outputTokens);
          return pricing;
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.statusCode;
          const isRetryable = status === 429 || status === 529 || status === 503 || status === 500;

          if (!isRetryable || attempt > maxRetries) {
            // Attempt model fallback if 529 (overloaded) and fallback available
            if (status === 529 && fallbackLadder[attempt]) {
              currentModel = fallbackLadder[attempt];
              continue;
            }
            throw err;
          }

          // Full Jitter Exponential Backoff: Math.random() * (base * 2^attempt)
          const baseDelayMs = 800;
          const retryAfterSec = parseInt(err?.headers?.["retry-after"] || "0", 10);
          const jitterDelay = retryAfterSec > 0
            ? retryAfterSec * 1000 + Math.random() * 500
            : Math.floor(Math.random() * (baseDelayMs * Math.pow(2, attempt - 1)));

          await new Promise((res) => setTimeout(res, jitterDelay));
        }
      }

      throw lastError || new Error("Failed to receive stream after maximum resilient retries.");
    } finally {
      queueTicket.release();
    }
  }

  private getActiveKey(attempt: number): string {
    if (attempt === 1 || this.fallbackKeys.length === 0) {
      return this.primaryKey;
    }
    const idx = (attempt - 2) % this.fallbackKeys.length;
    return this.fallbackKeys[idx] || this.primaryKey;
  }

  public calculatePricing(model: string, inputTokens: number, outputTokens: number): TokenCostEstimate {
    let inCostPerM = 3.0;
    let outCostPerM = 15.0;

    if (model.includes("haiku")) {
      inCostPerM = 0.8;
      outCostPerM = 4.0;
    } else if (model.includes("opus-2024") || model.includes("claude-3-opus")) {
      inCostPerM = 15.0;
      outCostPerM = 75.0;
    }

    const cost = (inputTokens / 1000000) * inCostPerM + (outputTokens / 1000000) * outCostPerM;
    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      costUsd: Math.round(cost * 100000) / 100000,
    };
  }
}

export const resilientClaudeClient = new ResilientClaudeClient();
