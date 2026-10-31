import { NextRequest, NextResponse } from "next/server";
import { fetchLiveNewsByCategory } from "@/lib/realtime/news";
import { NewsCategory } from "@/lib/realtime/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") as NewsCategory) || "ai";
    const customQuery = searchParams.get("query") || undefined;

    const result = await fetchLiveNewsByCategory(category, customQuery);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch live news" },
      { status: 500 }
    );
  }
}
