import { ANTHROPIC_SERVER_TOOLS, AnthropicServerToolDefinition } from "./server-tools";
import { ANTHROPIC_CLIENT_TOOLS, AnthropicClientToolDefinition } from "./client-tools";

export type AnyAnthropicTool = AnthropicServerToolDefinition | AnthropicClientToolDefinition;

export function getAllTools(): {
  serverTools: AnthropicServerToolDefinition[];
  clientTools: AnthropicClientToolDefinition[];
  all: AnyAnthropicTool[];
} {
  return {
    serverTools: ANTHROPIC_SERVER_TOOLS,
    clientTools: ANTHROPIC_CLIENT_TOOLS,
    all: [...ANTHROPIC_SERVER_TOOLS, ...ANTHROPIC_CLIENT_TOOLS],
  };
}

export function findToolByName(name: string): AnyAnthropicTool | undefined {
  return (
    ANTHROPIC_SERVER_TOOLS.find((t) => t.name === name) ||
    ANTHROPIC_CLIENT_TOOLS.find((t) => t.name === name)
  );
}

export function isServerTool(tool: AnyAnthropicTool): tool is AnthropicServerToolDefinition {
  return "betaHeader" in tool && "executionEnvironment" in tool && !("whatAppImplements" in tool);
}

export function isClientTool(tool: AnyAnthropicTool): tool is AnthropicClientToolDefinition {
  return "whatAppImplements" in tool;
}
