import { Citation } from "@/types";

export type AgentRole =
  | "planner"
  | "researcher"
  | "coder"
  | "analyst"
  | "critic"
  | "verifier"
  | "synthesizer";

export type AgentToolName =
  | "web_search"
  | "web_fetch"
  | "code_execution"
  | "fact_verifier"
  | "data_analysis"
  | "create_artifact"
  | "file_reader";

export interface AgentPermissions {
  allowNetwork: boolean;
  allowCodeExecution: boolean;
  allowFileSystem: boolean;
  requireApprovalForTools: boolean;
  maxExecutionTimeoutSec: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  title: string;
  avatarColor: string;
  systemPrompt: string;
  preferredModel: string;
  allowedTools: AgentToolName[];
  permissions: AgentPermissions;
  maxIterations: number;
  temperature: number;
  requiresHumanApproval: boolean;
  isCustom?: boolean;
}

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  fromAgentName: string;
  toAgentId: string;
  toAgentName: string;
  role: AgentRole;
  content: string;
  type: "handoff" | "query" | "criticism" | "validation" | "approval_request" | "system";
  timestamp: string;
}

export interface SharedTaskContext {
  goal: string;
  missionType: string;
  blackboard: Record<string, any>;
  gatheredFacts: string[];
  citations: Citation[];
  generatedCodeFiles: { path: string; language: string; content: string }[];
  criticFlags: string[];
  verificationVerdicts: { claim: string; verdict: string; confidence: number }[];
  deliverableDraft?: string;
}

export interface AgentTaskStep {
  stepId: string;
  stepNumber: number;
  assignedAgentId: string;
  assignedAgentName: string;
  assignedRole: AgentRole;
  instruction: string;
  status: "pending" | "waiting_approval" | "running" | "completed" | "failed" | "skipped";
  toolCalls?: {
    tool: AgentToolName;
    input: any;
    output?: any;
    executedAt?: string;
  }[];
  inputData?: any;
  outputData?: any;
  approvalRequired?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  approvalReason?: string;
  retryCount: number;
  maxRetries: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface AgentCostEstimate {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

export interface AgentSessionPlan {
  sessionId: string;
  goal: string;
  missionType:
    | "company_research"
    | "document_analysis"
    | "website_creation"
    | "codebase_debug"
    | "product_comparison"
    | "presentation_generation"
    | "daily_intelligence"
    | "custom_task";
  templateId: string;
  team: AgentConfig[];
  steps: AgentTaskStep[];
  currentStepIndex: number;
  status: "planning" | "running" | "paused_approval" | "completed" | "failed" | "cancelled";
  sharedContext: SharedTaskContext;
  messageLog: AgentMessage[];
  costEstimate: AgentCostEstimate;
  finalResult?: string;
  finalDeliverableType?: "report" | "code" | "website" | "presentation" | "analysis";
  createdAt: string;
  updatedAt: string;
}

export interface AgentTeamTemplate {
  id: string;
  name: string;
  missionType: AgentSessionPlan["missionType"];
  description: string;
  badge: string;
  recommendedGoal: string;
  agents: AgentConfig[];
}
