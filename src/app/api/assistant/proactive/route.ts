import { NextRequest, NextResponse } from "next/server";
import {
  generateProactiveInsights,
  dismissProactiveInsight,
} from "@/lib/personal-assistant/proactive-engine";

export const runtime = "nodejs";

export async function GET() {
  try {
    const insights = generateProactiveInsights();
    return NextResponse.json({ insights });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch proactive insights" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;
    if (id) {
      dismissProactiveInsight(id);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to dismiss insight" }, { status: 500 });
  }
}
