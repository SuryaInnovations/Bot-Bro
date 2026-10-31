import { getModelDefinition } from "../models/model-capabilities";

export interface TokenCostEstimate {
  promptCost: number;
  completionCost: number;
  totalCost: number;
}

export function calculateAnthropicCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number,
  cachedTokens = 0
): TokenCostEstimate {
  const model = getModelDefinition(modelId);

  const regularPromptTokens = Math.max(0, promptTokens - cachedTokens);
  const promptCost =
    (regularPromptTokens / 1_000_000) * model.inputCostPer1M +
    (cachedTokens / 1_000_000) * model.cacheReadCostPer1M;

  const completionCost = (completionTokens / 1_000_000) * model.outputCostPer1M;
  const totalCost = promptCost + completionCost;

  return {
    promptCost,
    completionCost,
    totalCost,
  };
}
