import Anthropic from "@anthropic-ai/sdk";
import { ModelInfo, ResponseStyle } from "@/types";
import { BOT_BRO_CODING_STANDARDS, CodingRequestContext } from "@/lib/coding/coding-prompt";

export const CLAUDE_MODELS: ModelInfo[] = [
  {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude 3.7 Sonnet (Hybrid Reasoning)",
    description: "Most intelligent model with dynamic hybrid reasoning and coding mastery.",
    badge: "Smartest",
    contextWindow: 200000,
    maxOutputTokens: 64000,
    supportsThinking: true,
    supportsTools: true,
    supportsVision: true,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    description: "Industry-leading balance of high intelligence, coding, and fast speed.",
    badge: "Popular",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsThinking: false,
    supportsTools: true,
    supportsVision: true,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    description: "Next-gen lightning fast responses with high coding capability.",
    badge: "Fastest",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsThinking: false,
    supportsTools: true,
    supportsVision: true,
    inputCostPer1M: 0.8,
    outputCostPer1M: 4.0,
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    description: "Deep analytical intelligence and nuanced understanding of complex topics.",
    badge: "Deep Thinker",
    contextWindow: 200000,
    maxOutputTokens: 4096,
    supportsThinking: false,
    supportsTools: true,
    supportsVision: true,
    inputCostPer1M: 15.0,
    outputCostPer1M: 75.0,
  },
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5",
    description: "Nova tier: Advanced reasoning and complex multi-step tasks.",
    badge: "Nova Flagship",
    contextWindow: 200000,
    maxOutputTokens: 64000,
    supportsThinking: true,
    supportsTools: true,
    supportsVision: true,
    inputCostPer1M: 5.0,
    outputCostPer1M: 25.0,
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    description: "Nova tier: Balanced intelligence, coding, and workflow automation.",
    badge: "Recommended",
    contextWindow: 200000,
    maxOutputTokens: 16000,
    supportsThinking: true,
    supportsTools: true,
    supportsVision: true,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
  },
  {
    id: "claude-haiku-5-5",
    name: "Claude Haiku 5.5",
    description: "Nova tier: Rapid turnaround for everyday questions and tasks.",
    badge: "Instant",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsThinking: false,
    supportsTools: true,
    supportsVision: true,
    inputCostPer1M: 0.8,
    outputCostPer1M: 4.0,
  },
];

/**
 * Resolves alias IDs to real official Anthropic API model identifiers.
 */
export function resolveActualModelId(modelId: string): string {
  switch (modelId) {
    case "claude-opus":
      return "claude-3-opus-20240229";
    case "claude-sonnet":
      return "claude-3-5-sonnet-20241022";
    case "claude-haiku":
      return "claude-3-5-haiku-20241022";
    default:
      return modelId || "claude-3-7-sonnet-20250219";
  }
}

export function getAnthropicClient(customApiKey?: string): Anthropic {
  const apiKey = customApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing Anthropic API Key. Please provide your ANTHROPIC_API_KEY in .env.local or enter it in NOVA AI Settings."
    );
  }
  return new Anthropic({
    apiKey,
    // When run on edge or serverless
    timeout: 60000,
    maxRetries: 2,
  });
}

export { buildNovaSystemPrompt } from "@/lib/coding/coding-prompt";
