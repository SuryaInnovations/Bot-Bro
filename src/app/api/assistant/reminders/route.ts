import { NextRequest, NextResponse } from "next/server";
import {
  getReminders,
  createReminder,
  completeReminder,
  snoozeReminder,
  deleteReminder,
  checkDueReminders,
} from "@/lib/personal-assistant/reminder-engine";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkDue = searchParams.get("check_due");

    if (checkDue === "true") {
      const due = checkDueReminders();
      return NextResponse.json({ dueReminders: due });
    }

    const reminders = getReminders();
    return NextResponse.json({ reminders });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch reminders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, minutes } = body;

    if (action === "complete" && id) {
      const updated = completeReminder(id);
      return NextResponse.json({ reminder: updated });
    }

    if (action === "snooze" && id) {
      const updated = snoozeReminder(id, minutes || 15);
      return NextResponse.json({ reminder: updated });
    }

    const created = createReminder(body);
    return NextResponse.json({ reminder: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create reminder" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Reminder ID required" }, { status: 400 });

    const success = deleteReminder(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete reminder" }, { status: 500 });
  }
}
