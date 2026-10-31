/**
 * NOVA AI — Groq Provider Connector
 * Integrates Groq's high-speed LPU inference engine via OpenAI-compatible endpoints.
 * Supports streaming, reasoning/thinking tokens, function calling, and rate-limit tracking.
 */

import {
  AIProviderId,
  ProviderChatMessage,
  ProviderQuotaStatus,
  ProviderStreamChunk,
  UnifiedModelInfo,
} from "./provider-types";

export const GROQ_FREE_MODELS: UnifiedModelInfo[] = [
  {
    id: "openai/gpt-oss-120b",
    provider: "groq",
    name: "GPT-OSS 120B (Groq Ultra-Fast)",
    description: "Flagship 120B open model powered by Groq LPUs. Sub-second latency with deep reasoning.",
    isFree: true,
    contextWindow: 131072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: false,
    badge: "Groq Speed",
  },
  {
    id: "qwen/qwen3.8-27b",
    provider: "groq",
    name: "Qwen 3.8 27B (Groq Ultra-Fast)",
    description: "Highly capable multilingual reasoning model with 131k context window on Groq.",
    isFree: true,
    contextWindow: 131072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: false,
    badge: "Groq Speed",
  },
  {
    id: "openai/gpt-oss-20b",
    provider: "groq",
    name: "GPT-OSS 20B (Groq Turbo)",
    description: "Ultra-compact 20B model delivering 800+ tokens/sec for rapid tool executions & workflows.",
    isFree: true,
    contextWindow: 131072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: false,
    badge: "Groq Speed",
  },
];

export class GroqProvider {
  private apiKey: string;
  private quotaStatus: ProviderQuotaStatus = {
    provider: "groq",
    requestsToday: 0,
    tokensToday: 0,
    dailyRequestLimit: 14400, // Groq generous free tier: ~30 RPM, 14.4k RPD
    isRateLimited: false,
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || "";
  }

  public getQuota(): ProviderQuotaStatus {
    return { ...this.quotaStatus };
  }

  public getModels(): UnifiedModelInfo[] {
    return GROQ_FREE_MODELS;
  }

  /**
   * Format generic tools into OpenAI/Groq function call schemas
   */
  private formatTools(tools?: any[]): any[] | undefined {
    if (!tools || tools.length === 0) return undefined;

    return tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description || `Tool: ${tool.name}`,
        parameters: tool.input_schema || tool.parameters || { type: "object", properties: {} },
      },
    }));
  }

  /**
   * Format messages for Groq OpenAI-compatible endpoint
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
      if ((msg as any).toolResponse) {
        const tr = (msg as any).toolResponse;
        formatted.push({
          role: "tool",
          tool_call_id: tr.id || "tool-call-id",
          content: typeof tr.output === "string" ? tr.output : JSON.stringify(tr.output),
        });
        continue;
      }

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
   * Stream a chat response from Groq with tool calling & reasoning support
   */
  public async *streamChat(params: {
    model?: string;
    messages: ProviderChatMessage[];
    systemPrompt?: string;
    tools?: any[];
    maxTokens?: number;
    temperature?: number;
  }): AsyncGenerator<ProviderStreamChunk, void, unknown> {
    const chosenModel = params.model || "openai/gpt-oss-120b";
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const requestBody: any = {
      model: chosenModel,
      messages: this.formatMessages(params.messages, params.systemPrompt),
      max_tokens: params.maxTokens || 8192,
      temperature: params.temperature ?? 0.7,
      stream: true,
    };

    const formattedTools = this.formatTools(params.tools);
    if (formattedTools && formattedTools.length > 0) {
      requestBody.tools = formattedTools;
    }

    this.quotaStatus.requestsToday++;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(45000), // 45s timeout
      });
    } catch (networkErr: any) {
      yield {
        type: "error",
        provider: "groq",
        error: `Groq Network Error: ${networkErr?.message || "Failed to reach Groq API."}`,
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
        this.quotaStatus.lastError = "Groq rate limit reached (429).";
      }

      yield {
        type: "error",
        provider: "groq",
        error: `Groq HTTP ${response.status}: ${parsedMessage}`,
      };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield {
        type: "error",
        provider: "groq",
        error: "Failed to initialize response reader from Groq stream.",
      };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    const activeToolCalls: Record<number, { id: string; name: string; args: string }> = {};

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

            if (choice?.delta) {
              // 1. Thinking / reasoning delta
              if (choice.delta.reasoning) {
                yield {
                  type: "thinking_delta",
                  provider: "groq",
                  model: chosenModel,
                  text: choice.delta.reasoning,
                };
              }

              // 2. Text delta
              if (choice.delta.content) {
                yield {
                  type: "text_delta",
                  provider: "groq",
                  model: chosenModel,
                  text: choice.delta.content,
                };
              }

              // 3. Tool calls assembly
              if (choice.delta.tool_calls) {
                for (const tc of choice.delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  if (!activeToolCalls[idx]) {
                    activeToolCalls[idx] = {
                      id: tc.id || `call-groq-${Date.now()}-${idx}`,
                      name: tc.function?.name || "",
                      args: tc.function?.arguments || "",
                    };
                  } else {
                    if (tc.id) activeToolCalls[idx].id = tc.id;
                    if (tc.function?.name) activeToolCalls[idx].name += tc.function.name;
                    if (tc.function?.arguments) activeToolCalls[idx].args += tc.function.arguments;
                  }
                }
              }
            }

            // If finish_reason indicates tool_calls, emit them
            if (choice?.finish_reason === "tool_calls") {
              for (const [_, tc] of Object.entries(activeToolCalls)) {
                let parsedArgs = {};
                try {
                  parsedArgs = JSON.parse(tc.args || "{}");
                } catch {
                  parsedArgs = { raw: tc.args };
                }

                yield {
                  type: "tool_call",
                  provider: "groq",
                  model: chosenModel,
                  toolCall: {
                    id: tc.id,
                    name: tc.name,
                    input: parsedArgs,
                  },
                };
              }
            }

            // Usage reporting
            if (data.usage) {
              const promptTokens = data.usage.prompt_tokens || 0;
              const completionTokens = data.usage.completion_tokens || 0;
              const totalTokens = data.usage.total_tokens || 0;
              this.quotaStatus.tokensToday += totalTokens;

              yield {
                type: "usage",
                provider: "groq",
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
        provider: "groq",
        model: chosenModel,
      };
    } finally {
      reader.releaseLock();
    }
  }
}
