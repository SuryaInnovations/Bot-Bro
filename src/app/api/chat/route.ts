import { NextRequest } from "next/server";
import { buildNovaSystemPrompt } from "@/lib/anthropic/client";
import { NOVA_TOOLS } from "@/lib/anthropic/tools";
import { executeToolCall } from "@/lib/anthropic/tools/tool-executor";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { validateAndSanitizePrompt } from "@/lib/security/sanitizer";
import { Attachment, Citation } from "@/types";
import { clusterManager } from "@/lib/scalability/cluster-manager";
import { sessionManager } from "@/lib/scalability/session-manager";
import { accuracyEngine } from "@/lib/accuracy/accuracy-engine";
import { providerRouter } from "@/lib/providers/provider-router";
import { ProviderChatMessage } from "@/lib/providers/provider-types";

export const runtime = "nodejs";
export const maxDuration = 120; // 2 minutes for multi-step agentic calls

export async function POST(req: NextRequest) {
  clusterManager.recordConnectionChange(1);
  clusterManager.recordRequest();

  try {
    // 1. IP / Client-based Rate Limiting (60 requests/min)
    const clientIp = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";
    const rateCheck = checkRateLimit(`chat-${clientIp}`, 60, 60000);
    if (!rateCheck.allowed) {
      clusterManager.recordConnectionChange(-1);
      return new Response(
        JSON.stringify({
          error: `Rate limit reached. Please wait ${Math.ceil(rateCheck.resetMs / 1000)}s before sending another message.`,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      messages = [],
      model = "gemini-flash-lite-latest",
      style = "normal",
      enableThinking = true,
      thinkingBudget = 2048,
      enableWebSearch = true,
      enableCodeExecution = true,
      projectInstructions,
      userMemories = [],
      customApiKey,
    } = body;

    // 2. Validate latest user prompt for prompt injection
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg && typeof lastUserMsg.content === "string") {
      const sanitized = validateAndSanitizePrompt(lastUserMsg.content);
      if (!sanitized.isValid) {
        clusterManager.recordConnectionChange(-1);
        return new Response(
          JSON.stringify({ error: "Invalid message content provided." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 2.5 Conversational Intent Orchestration Check (Daily Intel, Tasks, Reminders, Swarm, Calendar, Email, File Conversion)
    if (lastUserMsg && typeof lastUserMsg.content === "string") {
      const { orchestrateConversationalRequest } = await import("@/lib/orchestrator/unified-orchestrator");
      const memoryContents = Array.isArray(userMemories)
        ? userMemories.map((m: any) => (typeof m === "string" ? m : m.content || ""))
        : [];

      // Collect attachments from current or recent messages
      const allAttachments: Attachment[] = [];
      if (Array.isArray((lastUserMsg as any).attachments)) {
        allAttachments.push(...(lastUserMsg as any).attachments);
      }
      for (let i = messages.length - 1; i >= 0; i--) {
        if (Array.isArray(messages[i].attachments)) {
          for (const att of messages[i].attachments) {
            if (!allAttachments.some((a) => a.id === att.id)) {
              allAttachments.push(att);
            }
          }
        }
      }

      const orchestrated = await orchestrateConversationalRequest(
        lastUserMsg.content,
        memoryContents,
        allAttachments
      );

      if (orchestrated.handledInternally) {
        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
          async start(controller) {
            const sendEvent = (data: any) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            // Send citations
            if (orchestrated.citations && orchestrated.citations.length > 0) {
              for (const cit of orchestrated.citations) {
                sendEvent({ type: "citation", citation: cit });
              }
            }

            // Send artifact
            if (orchestrated.artifact) {
              sendEvent({ type: "artifact", artifact: orchestrated.artifact });
            }

            // Send generated image
            if (orchestrated.generatedImage) {
              sendEvent({ type: "generated_image", image: orchestrated.generatedImage });
            }

            // Send chart spec
            if (orchestrated.chartSpec) {
              sendEvent({ type: "chart_spec", spec: orchestrated.chartSpec });
            }

            // Stream response text chunks
            const text = orchestrated.responseText;
            const chunkSize = 25;
            for (let i = 0; i < text.length; i += chunkSize) {
              sendEvent({ type: "text_delta", text: text.slice(i, i + chunkSize) });
            }

            // Approval required event
            if (orchestrated.requiresApproval && orchestrated.approvalPayload) {
              sendEvent({ type: "approval_required", payload: orchestrated.approvalPayload });
            }

            sendEvent({ type: "done", completed: true });
            controller.close();
            clusterManager.recordConnectionChange(-1);
          },
        });

        return new Response(customStream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      }
    }

    // Format system prompt
    const systemPrompt = buildNovaSystemPrompt({
      style,
      projectInstructions,
      userMemories,
      enableArtifacts: true,
    });

    // Format message history for unified multi-provider router
    const formattedMessages: ProviderChatMessage[] = [];

    for (const msg of messages) {
      if (msg.role !== "user" && msg.role !== "assistant") continue;

      formattedMessages.push({
        role: msg.role,
        content: msg.content || "",
        attachments: msg.attachments,
      });
    }

    if (formattedMessages.length === 0) {
      clusterManager.recordConnectionChange(-1);
      return new Response(
        JSON.stringify({ error: "No valid messages found to process." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine available tools
    const tools: any[] = [];
    if (enableWebSearch) {
      tools.push(NOVA_TOOLS.find((t) => t.name === "web_search"));
      tools.push(NOVA_TOOLS.find((t) => t.name === "web_fetch"));
    }
    if (enableCodeExecution) {
      tools.push(NOVA_TOOLS.find((t) => t.name === "execute_code"));
    }
    tools.push(NOVA_TOOLS.find((t) => t.name === "create_artifact"));

    const activeTools = tools.filter(Boolean);

    // Setup encoder for SSE streaming
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          let currentMessages = [...formattedMessages];
          const collectedCitations: Citation[] = [];
          let maxIterations = 5; // Support up to 5 tool-calling loops
          let iteration = 0;
          let keepGoing = true;

          // Pre-flight accuracy analysis
          const preFlight = lastUserMsg && typeof lastUserMsg.content === "string"
            ? accuracyEngine.analyzeQuestionBeforeAnswering(lastUserMsg.content)
            : { coreIntent: "", isAmbiguous: false, needsCurrentInfo: false, domainRisk: "standard" as const, recommendedSources: [], suggestedTools: [] };

          while (keepGoing && iteration < maxIterations) {
            iteration++;

            const responseStream = providerRouter.streamChatWithFallback({
              requestedModel: model,
              messages: currentMessages,
              systemPrompt,
              tools: activeTools.length > 0 ? activeTools : undefined,
              maxTokens: 8192,
              temperature: 0.7,
              customApiKey,
            });

            const toolCalls: any[] = [];
            let assistantResponseText = "";
            let assistantThinkingText = "";

            for await (const chunk of responseStream) {
              // 1. Thinking / reasoning delta
              if (chunk.type === "thinking_delta" && chunk.text) {
                assistantThinkingText += chunk.text;
                sendEvent({
                  type: "thinking_delta",
                  text: chunk.text,
                });
              }

              // 2. Text delta
              if (chunk.type === "text_delta" && chunk.text) {
                assistantResponseText += chunk.text;
                sendEvent({
                  type: "text_delta",
                  text: chunk.text,
                });
              }

              // 3. Tool call requested by model
              if (chunk.type === "tool_call" && chunk.toolCall) {
                toolCalls.push(chunk.toolCall);
                sendEvent({
                  type: "tool_start",
                  id: chunk.toolCall.id,
                  name: chunk.toolCall.name,
                });
                sendEvent({
                  type: "tool_ready",
                  id: chunk.toolCall.id,
                  name: chunk.toolCall.name,
                  input: chunk.toolCall.input,
                });
              }

              // 4. Provider switch notice
              if (chunk.type === "provider_switch") {
                sendEvent({
                  type: "provider_switch",
                  provider: chunk.provider,
                  model: chunk.model,
                  warning: chunk.warning,
                });
              }

              // 5. Usage delta
              if (chunk.type === "usage" && chunk.usage) {
                sendEvent({
                  type: "usage_delta",
                  usage: {
                    input_tokens: chunk.usage.promptTokens,
                    output_tokens: chunk.usage.completionTokens,
                  },
                });
              }

              // 6. Error event
              if (chunk.type === "error") {
                sendEvent({
                  type: "error",
                  error: chunk.error || "An error occurred during inference.",
                });
                keepGoing = false;
                break;
              }
            }

            // If there are no tool calls, the model has completed its final response
            if (toolCalls.length === 0) {
              keepGoing = false;

              // Run Post-Delivery Accuracy & Verification Audit
              const auditResult = accuracyEngine.auditAnswerBeforeDelivery(
                assistantResponseText,
                collectedCitations,
                preFlight as any
              );

              // If freshness or high-impact notice was appended, stream it
              if (auditResult.freshnessTag || auditResult.containsHighImpactNotice) {
                const extraNotice = auditResult.sanitizedText.slice(assistantResponseText.length);
                if (extraNotice) {
                  sendEvent({ type: "text_delta", text: extraNotice });
                }
              }

              // Save stream checkpoint for resilient reconnect
              const activeConvId = messages[0]?.conversationId || "conv-active";
              sessionManager.saveStreamCheckpoint(activeConvId, iteration, assistantResponseText);

              sendEvent({
                type: "accuracy_audit",
                confidence: auditResult.confidenceScore,
                verifiedCalculations: auditResult.calculationVerified,
              });

              sendEvent({ type: "done", completed: true });
              break;
            }

            // Execute each requested tool
            sendEvent({ type: "tool_executing", count: toolCalls.length });

            // Add the assistant's intermediate response to current messages
            if (assistantResponseText) {
              currentMessages.push({
                role: "assistant",
                content: assistantResponseText,
              });
            }

            // Execute tools via unified tool-executor
            for (const toolCall of toolCalls) {
              const execResult = await executeToolCall(
                toolCall.name,
                toolCall.id,
                toolCall.input
              );

              // If citations were returned from web search, forward to client
              if (execResult.output?.citations) {
                for (const cit of execResult.output.citations) {
                  collectedCitations.push(cit);
                  sendEvent({ type: "citation", citation: cit });
                }
              }

              // If artifact was created, forward to client
              if (toolCall.name === "create_artifact") {
                sendEvent({
                  type: "artifact",
                  artifact: {
                    id: toolCall.input.identifier || `art-${Date.now()}`,
                    title: toolCall.input.title,
                    type: toolCall.input.type,
                    language: toolCall.input.language,
                    content: toolCall.input.content,
                    version: 1,
                  },
                });
              }

              sendEvent({
                type: "tool_result",
                id: toolCall.id,
                name: toolCall.name,
                output: execResult.output,
                isError: execResult.isError,
              });

              // Append tool response to current messages
              currentMessages.push({
                role: "user",
                content: typeof execResult.output === "string" ? execResult.output : JSON.stringify(execResult.output),
                toolResponse: {
                  id: toolCall.id,
                  name: toolCall.name,
                  output: execResult.output,
                },
              } as any);
            }
          }

          controller.close();
        } catch (error: any) {
          sendEvent({
            type: "error",
            error: error?.message || "Failed to process chat request.",
          });
          controller.close();
        } finally {
          clusterManager.recordConnectionChange(-1);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    clusterManager.recordConnectionChange(-1);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
