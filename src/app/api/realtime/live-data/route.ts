import { NextRequest, NextResponse } from "next/server";
import { fetchLiveWeather } from "@/lib/realtime/weather";
import { getCompleteFinancialSnapshot } from "@/lib/realtime/finance";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city") || "Bengaluru";

    const [weather, finance] = await Promise.all([
      fetchLiveWeather(city),
      getCompleteFinancialSnapshot(),
    ]);

    return NextResponse.json({
      weather,
      finance,
      retrievedAt: new Date().toISOString(),
      timezone: "Asia/Kolkata (IST)",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch live data" },
      { status: 500 }
    );
  }
}
