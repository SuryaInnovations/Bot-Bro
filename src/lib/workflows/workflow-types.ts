export type WorkflowNodeType =
  | "trigger"
  | "ai_model"
  | "agent"
  | "tool"
  | "condition"
  | "approval"
  | "output";

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface VisualWorkflow {
  id: string;
  name: string;
  description: string;
  version: number;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecutionLog {
  nodeId: string;
  nodeLabel: string;
  status: "pending" | "running" | "completed" | "paused_approval" | "failed";
  output: any;
  durationMs: number;
  timestamp: string;
}

export const PRESET_WORKFLOWS: VisualWorkflow[] = [
  {
    id: "wf-daily-intel",
    name: "Automated Morning Intelligence Briefing",
    description: "Fetches live weather & market data, runs Claude 3.7 synthesis, and produces an executive morning briefing.",
    version: 1,
    nodes: [
      { id: "node-1", type: "trigger", label: "Schedule: 08:00 AM IST", config: { cron: "0 8 * * *" }, position: { x: 50, y: 150 } },
      { id: "node-2", type: "tool", label: "Fetch Live Weather", config: { tool: "weather", city: "Bengaluru" }, position: { x: 260, y: 80 } },
      { id: "node-3", type: "tool", label: "Fetch Financial Markets", config: { tool: "finance" }, position: { x: 260, y: 220 } },
      { id: "node-4", type: "ai_model", label: "Claude 3.7 Sonnet (Synthesizer)", config: { model: "claude-3-7-sonnet-20250219" }, position: { x: 490, y: 150 } },
      { id: "node-5", type: "approval", label: "Human Verification Checkpoint", config: { approver: "User" }, position: { x: 720, y: 150 } },
      { id: "node-6", type: "output", label: "Deliver to Daily Dashboard", config: { target: "dashboard" }, position: { x: 950, y: 150 } },
    ],
    connections: [
      { id: "c1", fromNodeId: "node-1", toNodeId: "node-2" },
      { id: "c2", fromNodeId: "node-1", toNodeId: "node-3" },
      { id: "c3", fromNodeId: "node-2", toNodeId: "node-4" },
      { id: "c4", fromNodeId: "node-3", toNodeId: "node-4" },
      { id: "c5", fromNodeId: "node-4", toNodeId: "node-5" },
      { id: "c6", fromNodeId: "node-5", toNodeId: "node-6" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
