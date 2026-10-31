import { NextRequest, NextResponse } from "next/server";
import { getBriefingSchedule, updateBriefingSchedule } from "@/lib/realtime/daily-briefing";

export const runtime = "nodejs";

export async function GET() {
  try {
    const schedule = getBriefingSchedule();
    return NextResponse.json({ schedule });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch schedule" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateBriefingSchedule(body);
    return NextResponse.json({ schedule: updated, message: "Schedule updated successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update schedule" }, { status: 500 });
  }
}
