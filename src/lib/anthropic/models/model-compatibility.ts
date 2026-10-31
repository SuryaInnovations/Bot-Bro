import { getModelDefinition } from "./model-capabilities";

export interface FeatureCompatibilityCheck {
  compatible: boolean;
  requiredBetaHeaders: string[];
  warning?: string;
  error?: string;
}

export function validateModelFeatureCompatibility(
  modelId: string,
  features: {
    useThinking?: boolean;
    useComputerUse?: boolean;
    usePromptCaching?: boolean;
    use128kOutput?: boolean;
  }
): FeatureCompatibilityCheck {
  const model = getModelDefinition(modelId);
  const requiredBetaHeaders: string[] = [];

  // Check thinking
  if (features.useThinking && !model.supportsThinking) {
    return {
      compatible: false,
      requiredBetaHeaders: [],
      error: `Model ${model.name} (${model.id}) does not support extended thinking. Select Claude 3.7 Sonnet or Claude Opus 5.5.`,
    };
  }

  // Check computer use
  if (features.useComputerUse) {
    if (!model.supportsComputerUse) {
      return {
        compatible: false,
        requiredBetaHeaders: [],
        error: `Model ${model.name} does not support Computer Use. Use Claude 3.7 Sonnet or Claude 3.5 Sonnet.`,
      };
    }
    requiredBetaHeaders.push("computer-use-2025-01-24");
  }

  // Check 128k output
  if (features.use128kOutput) {
    if (!model.maxOutputTokensBeta) {
      return {
        compatible: false,
        requiredBetaHeaders: [],
        warning: `Model ${model.name} max output is ${model.maxOutputTokens} tokens. 128k output is only available on Claude 3.7 Sonnet.`,
      };
    }
    requiredBetaHeaders.push("output-128k-2025-02-19");
  }

  // Check prompt caching
  if (features.usePromptCaching && model.supportsPromptCaching) {
    requiredBetaHeaders.push("prompt-caching-2024-07-31");
  }

  return {
    compatible: true,
    requiredBetaHeaders,
  };
}
