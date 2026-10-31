import { NextRequest, NextResponse } from "next/server";
import { runDeepResearch } from "@/lib/research/research-engine";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required for deep research" }, { status: 400 });
    }

    const report = await runDeepResearch(topic.trim());
    return NextResponse.json({ report });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Research failed" }, { status: 500 });
  }
}
