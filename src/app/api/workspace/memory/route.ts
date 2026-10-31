import { NextRequest, NextResponse } from "next/server";
import {
  deleteUserMemory,
  getUserMemories,
  saveUserMemory,
  toggleMemoryEnabled,
  updateUserMemory,
} from "@/lib/workspace/memory-manager";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;

    const memories = getUserMemories(userId, projectId);
    return NextResponse.json({
      success: true,
      memories,
      count: memories.length,
      activeCount: memories.filter((m) => m.isEnabled).length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch user memories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      key,
      value,
      category = "preference",
      userId = "user-default",
      projectId,
      confidence = 0.95,
      isEnabled = true,
    } = body;

    if (!key || !value) {
      return NextResponse.json(
        { success: false, error: "Memory key and value are required" },
        { status: 400 }
      );
    }

    const saved = saveUserMemory({
      userId,
      projectId,
      key,
      value,
      category,
      isEnabled,
      confidence,
    });

    return NextResponse.json({
      success: true,
      memory: saved,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save memory" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isEnabled, key, value, category } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Memory id is required" },
        { status: 400 }
      );
    }

    if (isEnabled !== undefined) {
      const toggled = toggleMemoryEnabled(id, Boolean(isEnabled));
      return NextResponse.json({ success: true, memory: toggled });
    }

    const updated = updateUserMemory(id, { key, value, category });
    return NextResponse.json({ success: true, memory: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update memory" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Memory id is required" },
        { status: 400 }
      );
    }

    const deleted = deleteUserMemory(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete memory" },
      { status: 500 }
    );
  }
}
