export interface AnthropicServerToolDefinition {
  name: string;
  typeIdentifier: string;
  supportedVersions: string[];
  defaultVersion: string;
  betaHeader: string;
  description: string;
  executionEnvironment: "Anthropic Managed Sandbox" | "Anthropic Crawler Infra" | "Anthropic Multi-Agent Architecture";
  inputSchema: Record<string, any>;
  supportedModels: string[];
  officialDocUrl: string;
}

export const ANTHROPIC_SERVER_TOOLS: AnthropicServerToolDefinition[] = [
  {
    name: "web_search",
    typeIdentifier: "web_search",
    supportedVersions: ["web_search_20260318", "web_search_20260209", "web_search_20250305"],
    defaultVersion: "web_search_20250305",
    betaHeader: "web-search-2025-03-05",
    description: "Enables Claude to search the live web for breaking news, up-to-date documentation, real-time facts, and citations.",
    executionEnvironment: "Anthropic Crawler Infra",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query string." },
      },
      required: ["query"],
    },
    supportedModels: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-sonnet-5-5",
      "claude-opus-5-5",
      "claude-haiku-5-5",
    ],
    officialDocUrl: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview",
  },
  {
    name: "web_fetch",
    typeIdentifier: "web_fetch",
    supportedVersions: ["web_fetch_20260318", "web_fetch_20260309", "web_fetch_20260209", "web_fetch_20250910"],
    defaultVersion: "web_fetch_20250910",
    betaHeader: "web-fetch-2025-09-10",
    description: "Fetches and reads webpage or online PDF document content from URLs present in conversation context.",
    executionEnvironment: "Anthropic Crawler Infra",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The exact HTTP or HTTPS URL to fetch." },
      },
      required: ["url"],
    },
    supportedModels: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-sonnet-5-5",
      "claude-opus-5-5",
    ],
    officialDocUrl: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview",
  },
  {
    name: "code_execution",
    typeIdentifier: "code_execution",
    supportedVersions: ["code_execution_20260521", "code_execution_20260120", "code_execution_20250825"],
    defaultVersion: "code_execution_20250825",
    betaHeader: "code-execution-2025-08-25",
    description: "Anthropic-managed Python sandbox allowing Claude to execute calculations, data processing, and programmatic tool invocation.",
    executionEnvironment: "Anthropic Managed Sandbox",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Python code to execute." },
      },
      required: ["code"],
    },
    supportedModels: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-sonnet-5-5",
      "claude-opus-5-5",
    ],
    officialDocUrl: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview",
  },
  {
    name: "advisor",
    typeIdentifier: "advisor",
    supportedVersions: ["advisor_20260301"],
    defaultVersion: "advisor_20260301",
    betaHeader: "advisor-tool-2026-03-01",
    description: "Allows a faster executor model to consult a higher-tier advisor model (e.g. Opus) mid-generation for architectural review.",
    executionEnvironment: "Anthropic Multi-Agent Architecture",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "Consultation prompt for the advisor model." },
      },
      required: ["question"],
    },
    supportedModels: [
      "claude-3-7-sonnet-20250219",
      "claude-sonnet-5-5",
      "claude-fable-5-1",
    ],
    officialDocUrl: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview",
  },
  {
    name: "tool_search",
    typeIdentifier: "tool_search",
    supportedVersions: ["tool_search_tool_bm25_20251119", "tool_search_tool_regex_20251119"],
    defaultVersion: "tool_search_tool_bm25_20251119",
    betaHeader: "tool-search-2025-11-19",
    description: "Indexes large libraries of tools using BM25 ranking or regex matching, returning only relevant tools on demand.",
    executionEnvironment: "Anthropic Managed Sandbox",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query or regex pattern to discover tools." },
      },
      required: ["query"],
    },
    supportedModels: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-sonnet-5-5",
      "claude-opus-5-5",
    ],
    officialDocUrl: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview",
  },
  {
    name: "mcp_connector",
    typeIdentifier: "mcp_toolset",
    supportedVersions: ["mcp_toolset"],
    defaultVersion: "mcp_toolset",
    betaHeader: "mcp-client-2025-04-01",
    description: "Connects Claude to external tools, databases, and services exposed via the open Model Context Protocol (MCP).",
    executionEnvironment: "Anthropic Multi-Agent Architecture",
    inputSchema: {
      type: "object",
      properties: {
        server_name: { type: "string" },
        tool_name: { type: "string" },
        parameters: { type: "object" },
      },
      required: ["server_name", "tool_name"],
    },
    supportedModels: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-sonnet-5-5",
      "claude-opus-5-5",
      "claude-fable-5-1",
    ],
    officialDocUrl: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview",
  },
];
