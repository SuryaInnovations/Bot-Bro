import { NextRequest, NextResponse } from "next/server";
import { generateDailyBriefing } from "@/lib/realtime/daily-briefing";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city") || "Bengaluru";
    const type = (searchParams.get("type") as "morning" | "evening" | "weekly") || "morning";
    const topicsParam = searchParams.get("topics");
    const topics = topicsParam ? topicsParam.split(",") : ["ai", "india", "business", "science", "government"];
    const timezone = searchParams.get("timezone") || "Asia/Kolkata";

    const briefing = await generateDailyBriefing(city, type, topics, timezone);
    return NextResponse.json(briefing);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to generate daily briefing" },
      { status: 500 }
    );
  }
}
