import { NextRequest, NextResponse } from "next/server";
import {
  getCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  findAvailableTimeSlots,
} from "@/lib/personal-assistant/calendar-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const getSlots = searchParams.get("slots");

    if (getSlots === "true") {
      const slots = findAvailableTimeSlots(dateStr || undefined);
      return NextResponse.json({ slots });
    }

    const events = getCalendarEvents();
    const availableSlots = findAvailableTimeSlots(dateStr || undefined);
    return NextResponse.json({ events, availableSlots });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch calendar events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createCalendarEvent(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create event" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Event ID required" }, { status: 400 });

    const success = deleteCalendarEvent(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete event" }, { status: 500 });
  }
}
