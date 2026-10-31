/**
 * NOVA AI — Google Gemini Provider Connector
 * Integrates Google Gemini API using official v1beta endpoints.
 * Supports streaming, system instructions, multi-turn chat, function/tool calling,
 * file/multimodal inputs, and free-tier quota tracking.
 */

import {
  AIProviderId,
  ProviderChatMessage,
  ProviderQuotaStatus,
  ProviderStreamChunk,
  UnifiedModelInfo,
} from "./provider-types";

export const GEMINI_FREE_MODELS: UnifiedModelInfo[] = [
  {
    id: "gemini-flash-lite-latest",
    provider: "gemini",
    name: "Gemini 2.5 Flash Lite (Free)",
    description: "Fastest Google Gemini model, optimized for cost-free everyday assistance & code.",
    isFree: true,
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: true,
    badge: "Google Free",
  },
  {
    id: "gemini-3.1-flash-lite",
    provider: "gemini",
    name: "Gemini 3.1 Flash Lite (Free)",
    description: "Next-generation high-efficiency multimodal model from Google.",
    isFree: true,
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: true,
    badge: "Google Free",
  },
  {
    id: "gemini-flash-latest",
    provider: "gemini",
    name: "Gemini Flash (Free Tier)",
    description: "Balanced reasoning and multimodal understanding with generous free rate limits.",
    isFree: true,
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: true,
    badge: "Google Free",
  },
];

export class GeminiProvider {
  private apiKey: string;
  private quotaStatus: ProviderQuotaStatus = {
    provider: "gemini",
    requestsToday: 0,
    tokensToday: 0,
    dailyRequestLimit: 1500, // Gemini Free Tier: 15 RPM / 1,500 RPD
    isRateLimited: false,
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
  }

  public getQuota(): ProviderQuotaStatus {
    return { ...this.quotaStatus };
  }

  public getModels(): UnifiedModelInfo[] {
    return GEMINI_FREE_MODELS;
  }

  /**
   * Convert JSON schema types to Gemini UPPERCASE types
   */
  private convertSchemaType(type: string): string {
    const map: Record<string, string> = {
      string: "STRING",
      number: "NUMBER",
      integer: "INTEGER",
      boolean: "BOOLEAN",
      array: "ARRAY",
      object: "OBJECT",
    };
    return map[type.toLowerCase()] || "STRING";
  }

  /**
   * Recursively transform standard JSON schema to Gemini Schema format
   */
  private formatGeminiSchema(schema: any): any {
    if (!schema || typeof schema !== "object") return { type: "STRING" };

    const formatted: any = {};
    if (schema.type) {
      formatted.type = this.convertSchemaType(schema.type);
    }
    if (schema.description) formatted.description = schema.description;
    if (schema.enum) formatted.enum = schema.enum;
    if (schema.required) formatted.required = schema.required;

    if (schema.properties) {
      formatted.properties = {};
      for (const [key, prop] of Object.entries<any>(schema.properties)) {
        formatted.properties[key] = this.formatGeminiSchema(prop);
      }
    }

    if (schema.items) {
      formatted.items = this.formatGeminiSchema(schema.items);
    }

    return formatted;
  }

  /**
   * Format generic tools into Gemini Function Declarations
   */
  private formatTools(tools?: any[]): any[] | undefined {
    if (!tools || tools.length === 0) return undefined;

    const declarations = tools
      .map((tool) => {
        if (!tool.name) return null;
        return {
          name: tool.name,
          description: tool.description || `Tool: ${tool.name}`,
          parameters: this.formatGeminiSchema(tool.input_schema || tool.parameters || { type: "object" }),
        };
      })
      .filter(Boolean);

    if (declarations.length === 0) return undefined;
    return [{ functionDeclarations: declarations }];
  }

  /**
   * Transform chat messages and attachments to Gemini contents format
   */
  private formatContents(messages: ProviderChatMessage[]): any[] {
    const contents: any[] = [];

    for (const msg of messages) {
      const parts: any[] = [];

      // Multimodal attachments
      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.base64Data && att.type?.startsWith("image/")) {
            parts.push({
              inlineData: {
                mimeType: att.type,
                data: att.base64Data,
              },
            });
          } else if (att.extractedText) {
            parts.push({
              text: `[Attached Document: "${att.name}" (${att.type})]\n${att.extractedText}`,
            });
          }
        }
      }

      // If message is a tool response
      if ((msg as any).toolResponse) {
        const tr = (msg as any).toolResponse;
        parts.push({
          functionResponse: {
            name: tr.name,
            response: {
              content: typeof tr.output === "string" ? tr.output : JSON.stringify(tr.output),
            },
          },
        });
        contents.push({
          role: "user",
          parts,
        });
        continue;
      }

      // Text part
      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts,
        });
      }
    }

    return contents;
  }

  /**
   * Stream a chat response from Gemini with function calling
   */
  public async *streamChat(params: {
    model?: string;
    messages: ProviderChatMessage[];
    systemPrompt?: string;
    tools?: any[];
    maxTokens?: number;
    temperature?: number;
  }): AsyncGenerator<ProviderStreamChunk, void, unknown> {
    const chosenModel = params.model || "gemini-flash-lite-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const requestBody: any = {
      contents: this.formatContents(params.messages),
      generationConfig: {
        maxOutputTokens: params.maxTokens || 8192,
        temperature: params.temperature ?? 0.7,
      },
    };

    if (params.systemPrompt) {
      requestBody.systemInstruction = {
        parts: [{ text: params.systemPrompt }],
      };
    }

    const formattedTools = this.formatTools(params.tools);
    if (formattedTools) {
      requestBody.tools = formattedTools;
    }

    this.quotaStatus.requestsToday++;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000), // 60s timeout
      });
    } catch (networkErr: any) {
      yield {
        type: "error",
        provider: "gemini",
        error: `Gemini Network Error: ${networkErr?.message || "Failed to reach Google Gemini API."}`,
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
        this.quotaStatus.lastError = "Rate limit reached (429).";
      }

      yield {
        type: "error",
        provider: "gemini",
        error: `Gemini HTTP ${response.status}: ${parsedMessage}`,
      };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield {
        type: "error",
        provider: "gemini",
        error: "Failed to initialize response reader from Gemini stream.",
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

          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            const candidate = data.candidates?.[0];

            if (candidate?.content?.parts) {
              for (const part of candidate.content.parts) {
                // 1. Text delta
                if (part.text) {
                  yield {
                    type: "text_delta",
                    provider: "gemini",
                    model: chosenModel,
                    text: part.text,
                  };
                }

                // 2. Tool / Function call
                if (part.functionCall) {
                  yield {
                    type: "tool_call",
                    provider: "gemini",
                    model: chosenModel,
                    toolCall: {
                      id: part.functionCall.id || `call-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                      name: part.functionCall.name,
                      input: part.functionCall.args || {},
                    },
                  };
                }
              }
            }

            // Usage metadata
            if (data.usageMetadata) {
              const promptTokens = data.usageMetadata.promptTokenCount || 0;
              const completionTokens = data.usageMetadata.candidatesTokenCount || 0;
              const totalTokens = data.usageMetadata.totalTokenCount || 0;
              this.quotaStatus.tokensToday += totalTokens;

              yield {
                type: "usage",
                provider: "gemini",
                usage: {
                  promptTokens,
                  completionTokens,
                  totalTokens,
                },
              };
            }
          } catch (parseError) {
            // Ignore incomplete chunks in SSE
          }
        }
      }

      yield {
        type: "done",
        provider: "gemini",
        model: chosenModel,
      };
    } finally {
      reader.releaseLock();
    }
  }
}
