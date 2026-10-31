import { NextRequest, NextResponse } from "next/server";
import { parseNaturalLanguageTaskCommand } from "@/lib/personal-assistant/task-planner";
import { parseNaturalLanguageReminder } from "@/lib/personal-assistant/reminder-engine";
import { executePersonalAssistantGoal } from "@/lib/personal-assistant/smart-task-executor";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { command, executeSwarm } = body;

    if (!command || typeof command !== "string" || !command.trim()) {
      return NextResponse.json({ error: "Command string required" }, { status: 400 });
    }

    const c = command.toLowerCase().trim();

    // 1. Check if command is a smart reminder
    if (c.startsWith("remind me")) {
      const reminderResult = parseNaturalLanguageReminder(command);
      return NextResponse.json({
        handled: true,
        type: "reminder",
        intent: "reminder",
        result: reminderResult,
        message: reminderResult.message,
      });
    }

    // 2. Check if command is task planner instruction
    if (
      c.includes("plan my day") ||
      c.includes("plan today") ||
      c.includes("schedule for tomorrow") ||
      c.includes("move my unfinished tasks") ||
      c.includes("reschedule unfinished") ||
      c.includes("show my important tasks") ||
      c.includes("urgent tasks") ||
      c.startsWith("create task") ||
      c.startsWith("add task")
    ) {
      const taskResult = parseNaturalLanguageTaskCommand(command);
      return NextResponse.json({
        handled: true,
        type: "planner",
        intent: taskResult.intent,
        result: taskResult,
        message: taskResult.message,
      });
    }

    // 3. Complex autonomous mission execution via Multi-Agent Swarm 2.0
    const swarmResult = await executePersonalAssistantGoal(command, !!executeSwarm);
    return NextResponse.json({
      handled: true,
      type: "swarm_execution",
      intent: "swarm_execution",
      result: swarmResult,
      message: swarmResult.message,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to execute assistant command" }, { status: 500 });
  }
}
