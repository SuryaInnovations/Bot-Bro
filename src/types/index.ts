import type { GeneratedImage } from "@/lib/images/image-types";
import type { ChartSpecification } from "@/lib/analytics/data-types";

export type ClaudeModelId =
  | "claude-3-7-sonnet-20250219"
  | "claude-3-5-sonnet-20241022"
  | "claude-3-5-haiku-20241022"
  | "claude-3-opus-20240229"
  | "claude-opus-5-5"
  | "claude-sonnet-5-5"
  | "claude-haiku-5-5"
  | "claude-fable-5-1";

export interface ModelInfo {
  id: ClaudeModelId | string;
  name: string;
  description: string;
  badge?: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsThinking?: boolean;
  supportsTools?: boolean;
  supportsVision?: boolean;
  inputCostPer1M: number;
  outputCostPer1M: number;
}

export type ResponseStyle =
  | "normal"
  | "concise"
  | "detailed"
  | "educational"
  | "professional"
  | "creative";

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string; // mime type
  url?: string; // storage url or local preview
  base64Data?: string; // for images and raw files
  extractedText?: string; // for documents (pdf, docx, xlsx, txt)
  tokensEstimate?: number;
  tempPath?: string; // path to uploaded raw file on disk
}

export interface Citation {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  publishedDate?: string;
}

export interface ToolExecution {
  id: string;
  name: string; // web_search | web_fetch | execute_code | create_artifact
  input: Record<string, any>;
  output?: any;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
}

export interface Artifact {
  id: string;
  conversationId: string;
  messageId: string;
  title: string;
  type: "application/vnd.ant.code" | "text/html" | "image/svg+xml" | "text/markdown" | "application/vnd.ant.mermaid" | "application/vnd.ant.react";
  language?: string;
  content: string;
  version: number;
  versions?: { version: number; content: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  thinking?: string; // Claude reasoning process
  attachments?: Attachment[];
  citations?: Citation[];
  toolExecutions?: ToolExecution[];
  artifactIds?: string[];
  feedback?: "positive" | "negative";
  generatedImage?: GeneratedImage;
  chartSpec?: ChartSpecification;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId?: string;
  title: string;
  model: string;
  projectId?: string;
  systemPrompt?: string;
  responseStyle: ResponseStyle;
  isPinned: boolean;
  isStarred: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId?: string;
  name: string;
  description: string;
  instructions: string;
  knowledgeFiles?: Attachment[];
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMemory {
  id: string;
  userId?: string;
  projectId?: string;
  content: string;
  category: "preference" | "fact" | "instruction" | "project";
  createdAt: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  userName?: string;
  userAvatar?: string;
  defaultModel: string;
  responseStyle: ResponseStyle;
  enableThinking: boolean;
  thinkingBudget: number;
  enableWebSearch: boolean;
  enableCodeExecution: boolean;
  streamResponses: boolean;
  customApiKey?: string;
  fontSize: "sm" | "md" | "lg";
}

export interface UsageRecord {
  id: string;
  date: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface SharedConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface SharedConversation {
  id: string;
  token: string;
  conversationId: string;
  userId?: string;
  title: string;
  model: string;
  messages: SharedConversationMessage[];
  isRevoked: boolean;
  createdAt: string;
  updatedAt: string;
}
