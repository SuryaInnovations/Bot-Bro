import { NextRequest, NextResponse } from "next/server";
import {
  generateSvgGraphic,
  generateMermaidDiagram,
  analyzeVideoContext,
} from "@/lib/multimodal/multimodal-engine";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { action, prompt, videoUrl, type } = await req.json();

    if (action === "svg") {
      const graphic = generateSvgGraphic(prompt || "System Architecture", type || "architecture");
      return NextResponse.json({ graphic });
    }

    if (action === "mermaid") {
      const graphic = generateMermaidDiagram(prompt || "User Request Flow");
      return NextResponse.json({ graphic });
    }

    if (action === "video") {
      const analysis = analyzeVideoContext(videoUrl || "https://www.youtube.com/watch?v=claude-keynote");
      return NextResponse.json({ analysis });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
