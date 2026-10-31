import { findToolByName } from "./tool-registry";

export function formatToolForAnthropicApi(toolName: string): any {
  const tool = findToolByName(toolName);
  if (!tool) {
    throw new Error(`Tool "${toolName}" is not registered in Anthropic tool catalogue.`);
  }

  // Format as Anthropic Tool object
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  };
}

export function formatAllToolsForApi(toolNames: string[]): any[] {
  return toolNames.map((name) => formatToolForAnthropicApi(name));
}
