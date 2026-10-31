import { CLAUDE_MODEL_CATALOGUE, ClaudeModelDefinition } from "./model-registry";

export function getModelDefinition(modelId: string): ClaudeModelDefinition {
  const match = CLAUDE_MODEL_CATALOGUE.find((m) => m.id === modelId);
  if (match) return match;

  // Fallback default
  return CLAUDE_MODEL_CATALOGUE[0];
}

export function doesModelSupportThinking(modelId: string): boolean {
  const def = getModelDefinition(modelId);
  return def.supportsThinking;
}

export function doesModelSupportVision(modelId: string): boolean {
  const def = getModelDefinition(modelId);
  return def.supportsVision;
}

export function doesModelSupportComputerUse(modelId: string): boolean {
  const def = getModelDefinition(modelId);
  return def.supportsComputerUse;
}

export function getModelMaxOutputTokens(modelId: string, useBeta128k = false): number {
  const def = getModelDefinition(modelId);
  if (useBeta128k && def.maxOutputTokensBeta) {
    return def.maxOutputTokensBeta;
  }
  return def.maxOutputTokens;
}

export function getModelContextWindow(modelId: string): number {
  const def = getModelDefinition(modelId);
  return def.contextWindow;
}
