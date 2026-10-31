import { NextRequest, NextResponse } from "next/server";
import {
  createAgentSession,
  executeNextStepInPlan,
  cancelAgentSession,
} from "@/lib/agents/agent-orchestrator";
import { AgentSessionPlan } from "@/lib/agents/agent-types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, goal, templateId, session, approved, customAgents } = body;

    // 1. Action: Create Session
    if (action === "create") {
      const newSession = await createAgentSession(
        goal || "Autonomous Task",
        templateId,
        customAgents
      );
      return NextResponse.json({ session: newSession });
    }

    // 2. Action: Execute Single Step
    if (action === "step") {
      if (!session) {
        return NextResponse.json({ error: "Session required for step execution" }, { status: 400 });
      }
      const updatedSession = await executeNextStepInPlan(session as AgentSessionPlan, !!approved);
      return NextResponse.json({ session: updatedSession });
    }

    // 3. Action: Run Pipeline Autonomously
    if (action === "run_all") {
      if (!session) {
        return NextResponse.json({ error: "Session required for pipeline execution" }, { status: 400 });
      }
      let currentSession: AgentSessionPlan = session as AgentSessionPlan;
      let iterations = 0;
      const MAX_STEPS = 10;

      while (
        currentSession.status !== "completed" &&
        currentSession.status !== "failed" &&
        currentSession.status !== "cancelled" &&
        currentSession.status !== "paused_approval" &&
        iterations < MAX_STEPS
      ) {
        currentSession = await executeNextStepInPlan(currentSession, false);
        iterations++;
      }

      return NextResponse.json({ session: currentSession });
    }

    // 4. Action: Cancel Session
    if (action === "cancel") {
      if (!session) {
        return NextResponse.json({ error: "Session required for cancellation" }, { status: 400 });
      }
      const cancelled = cancelAgentSession(session as AgentSessionPlan);
      return NextResponse.json({ session: cancelled });
    }

    return NextResponse.json({ error: "Action not recognized" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Agent execution error" }, { status: 500 });
  }
}
