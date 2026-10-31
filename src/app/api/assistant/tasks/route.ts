import { NextRequest, NextResponse } from "next/server";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  rescheduleUnfinishedTasks,
} from "@/lib/personal-assistant/task-planner";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;
    const priority = searchParams.get("priority") as any;
    const category = searchParams.get("category") as any;

    const tasks = getTasks({ status, priority, category });
    const summary = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "completed").length,
      pending: tasks.filter((t) => t.status !== "completed").length,
      urgent: tasks.filter((t) => t.priority === "urgent" && t.status !== "completed").length,
    };
    return NextResponse.json({ tasks, summary });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "reschedule_unfinished") {
      const result = rescheduleUnfinishedTasks(!!body.toTomorrow);
      return NextResponse.json(result);
    }

    if (action === "complete") {
      const updated = completeTask(body.id);
      return NextResponse.json({ task: updated });
    }

    const newTask = createTask(body);
    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to process task" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, updates } = body;
    const updated = updateTask(id, updates);
    return NextResponse.json({ task: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Task ID required" }, { status: 400 });

    const success = deleteTask(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete task" }, { status: 500 });
  }
}
