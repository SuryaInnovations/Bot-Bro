import { CLAUDE_MODEL_CATALOGUE, ClaudeModelDefinition } from "./model-registry";

interface DiscoveredModel {
  id: string;
  type: string;
  display_name: string;
  created_at: string;
}

interface ModelsApiResponse {
  data: DiscoveredModel[];
  has_more: boolean;
  first_id: string;
  last_id: string;
}

// In-memory cache for discovered models
let cachedModels: ClaudeModelDefinition[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function discoverClaudeModels(options?: {
  apiKey?: string;
  forceRefresh?: boolean;
  limit?: number;
  lifecycle?: ("active" | "deprecated" | "retired")[];
}): Promise<{
  models: ClaudeModelDefinition[];
  isLive: boolean;
  lastUpdated: string;
  error?: string;
}> {
  const now = Date.now();
  if (
    !options?.forceRefresh &&
    cachedModels &&
    now - lastCacheTime < CACHE_TTL_MS
  ) {
    return {
      models: cachedModels,
      isLive: true,
      lastUpdated: new Date(lastCacheTime).toISOString(),
    };
  }

  const apiKey = options?.apiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      models: CLAUDE_MODEL_CATALOGUE,
      isLive: false,
      lastUpdated: new Date().toISOString(),
      error: "No Anthropic API key provided. Showing verified official catalogue.",
    };
  }

  try {
    const url = new URL("https://api.anthropic.com/v1/models");
    url.searchParams.set("limit", String(options?.limit || 20));

    if (options?.lifecycle && options.lifecycle.length > 0) {
      options.lifecycle.forEach((status) => url.searchParams.append("lifecycle", status));
    }

    const response = await fetch(url.toString(), {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`Anthropic Models API returned HTTP ${response.status}`);
    }

    const json: ModelsApiResponse = await response.json();

    // Merge discovered models with our detailed metadata catalogue
    const mergedList: ClaudeModelDefinition[] = json.data.map((liveModel) => {
      const match = CLAUDE_MODEL_CATALOGUE.find((m) => m.id === liveModel.id);
      if (match) {
        return {
          ...match,
          name: liveModel.display_name || match.name,
        };
      }

      // Model newly returned by API not yet in static catalogue
      const isSonnet = liveModel.id.includes("sonnet");
      const isHaiku = liveModel.id.includes("haiku");
      const isOpus = liveModel.id.includes("opus");
      const isThinking = liveModel.id.includes("3-7") || liveModel.id.includes("opus");

      return {
        id: liveModel.id,
        name: liveModel.display_name || liveModel.id,
        family: isSonnet ? "sonnet" : isHaiku ? "haiku" : isOpus ? "opus" : "fable",
        description: `Official Claude model ${liveModel.display_name} retrieved dynamically from Anthropic Models API.`,
        contextWindow: 200000,
        maxOutputTokens: isThinking ? 64000 : 8192,
        inputCostPer1M: isHaiku ? 0.8 : isOpus ? 15.0 : 3.0,
        outputCostPer1M: isHaiku ? 4.0 : isOpus ? 75.0 : 15.0,
        cacheReadCostPer1M: isHaiku ? 0.08 : isOpus ? 1.5 : 0.3,
        cacheWriteCostPer1M: isHaiku ? 1.0 : isOpus ? 18.75 : 3.75,
        supportsThinking: isThinking,
        supportsVision: !isHaiku,
        supportsTools: true,
        supportsComputerUse: isSonnet,
        supportsPromptCaching: true,
        supportedInputModalities: ["text", "image", "document"],
        supportedOutputModalities: ["text", "tool_use"],
        lifecycle: "active",
        officialDocUrl: "https://platform.claude.com/docs/en/about-claude/models/overview",
      };
    });

    cachedModels = mergedList;
    lastCacheTime = now;

    return {
      models: mergedList,
      isLive: true,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      models: CLAUDE_MODEL_CATALOGUE,
      isLive: false,
      lastUpdated: new Date().toISOString(),
      error: error.message || "Failed to contact Models API",
    };
  }
}
