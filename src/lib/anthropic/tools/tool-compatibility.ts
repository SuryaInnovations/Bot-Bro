import { findToolByName, isServerTool } from "./tool-registry";
import { getModelDefinition } from "../models/model-capabilities";

export interface ToolCompatibilityResult {
  isCompatible: boolean;
  requiredBetaHeaders: string[];
  incompatibleReasons: string[];
  warnings: string[];
}

export function validateModelAndToolsCompatibility(
  modelId: string,
  requestedToolNames: string[]
): ToolCompatibilityResult {
  const model = getModelDefinition(modelId);
  const requiredBetaHeaders: Set<string> = new Set();
  const incompatibleReasons: string[] = [];
  const warnings: string[] = [];

  for (const toolName of requestedToolNames) {
    const tool = findToolByName(toolName);
    if (!tool) {
      warnings.push(`Tool "${toolName}" is not recognized in official catalogue.`);
      continue;
    }

    // Check if model is listed in tool.supportedModels
    if (!tool.supportedModels.includes(model.id) && !tool.supportedModels.includes("all")) {
      incompatibleReasons.push(
        `Tool "${tool.name}" is not supported by model "${model.name}" (${model.id}). Supported models: ${tool.supportedModels.join(", ")}.`
      );
    }

    // Add beta header if applicable
    if (tool.betaHeader) {
      requiredBetaHeaders.add(tool.betaHeader);
    }
  }

  return {
    isCompatible: incompatibleReasons.length === 0,
    requiredBetaHeaders: Array.from(requiredBetaHeaders),
    incompatibleReasons,
    warnings,
  };
}
