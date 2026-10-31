import {
  createAgentSession,
  executeNextStepInPlan,
} from "../agents/agent-orchestrator";
import { AgentSessionPlan } from "../agents/agent-types";
import { createTask } from "./task-planner";
import { generateDailyBriefing } from "../realtime/daily-briefing";

export interface SmartExecutionResult {
  stepIndex: number;
  totalSteps: number;
  stageName: string;
  status: "planning" | "running" | "paused_approval" | "completed" | "failed" | "cancelled";
  session: AgentSessionPlan | null;
  deliverable?: string;
  requiresApproval?: boolean;
  message: string;
}

export async function executePersonalAssistantGoal(
  userRequest: string,
  autoRunSwarm = true
): Promise<SmartExecutionResult> {
  const req = userRequest.toLowerCase().trim();

  // 1. Identify Target Template and Swarm Role Allocation
  let templateId = "company-intelligence-squad";
  if (req.includes("website") || req.includes("landing page") || req.includes("html") || req.includes("build a web")) {
    templateId = "website-builder-swarm";
  } else if (req.includes("debug") || req.includes("bug") || req.includes("fix code") || req.includes("codebase")) {
    templateId = "codebase-debugger-squad";
  } else if (req.includes("document") || req.includes("spreadsheet") || req.includes("excel") || req.includes("financial tables")) {
    templateId = "document-data-analyst-squad";
  } else if (req.includes("compare") || req.includes("vs") || req.includes("competitor")) {
    templateId = "product-comparison-swarm";
  } else if (req.includes("presentation") || req.includes("pitch deck") || req.includes("slides")) {
    templateId = "presentation-generator-squad";
  } else if (req.includes("morning briefing") || req.includes("daily intelligence") || req.includes("news briefing")) {
    templateId = "daily-intelligence-swarm";
  }

  // 2. Step 1: Understand request & Create Task Plan
  const session = await createAgentSession(userRequest, templateId);

  // Automatically record this mission in the Daily Planner
  createTask({
    title: `Autonomous Task: ${userRequest.slice(0, 60)}`,
    description: `Multi-agent swarm execution session: ${session.sessionId}`,
    priority: "high",
    category: "work",
    tags: ["Agent Swarm", "Automated"],
  });

  // 3. Step 2 to 9: Execute via Swarm
  if (!autoRunSwarm) {
    return {
      stepIndex: 1,
      totalSteps: session.steps.length,
      stageName: session.steps[0]?.instruction || "Planning",
      status: "planning",
      session,
      message: `Created 9-step execution plan with ${session.steps.length} multi-agent milestones. Ready to execute step 1.`,
    };
  }

  // Run autonomous execution
  let currentSession = session;
  let iterations = 0;
  while (
    currentSession.status !== "completed" &&
    currentSession.status !== "failed" &&
    currentSession.status !== "paused_approval" &&
    iterations < 8
  ) {
    currentSession = await executeNextStepInPlan(currentSession, false);
    iterations++;
  }

  return {
    stepIndex: currentSession.currentStepIndex,
    totalSteps: currentSession.steps.length,
    stageName: currentSession.steps[currentSession.currentStepIndex]?.instruction || "Final Synthesis",
    status: currentSession.status,
    session: currentSession,
    deliverable: currentSession.finalResult,
    requiresApproval: currentSession.status === "paused_approval",
    message:
      currentSession.status === "completed"
        ? `Task execution completed successfully. Deliverable generated with multi-agent consensus.`
        : currentSession.status === "paused_approval"
        ? `Task paused at human authorization checkpoint: "${currentSession.steps[currentSession.currentStepIndex]?.instruction}".`
        : `Execution progressing (Stage ${currentSession.currentStepIndex + 1}/${currentSession.steps.length}).`,
  };
}
