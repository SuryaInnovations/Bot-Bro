import { NextRequest, NextResponse } from "next/server";
import { executeCodeInSandbox } from "@/lib/code-sandbox";
import { fetchWebPageContent, performWebSearch } from "@/lib/web-search";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";
    const rateCheck = checkRateLimit(`tools-${clientIp}`, 120, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Tool execution rate limit exceeded. Retry in ${Math.ceil(rateCheck.resetMs / 1000)}s.` },
        { status: 429 }
      );
    }

    const { tool, input } = await req.json();

    if (tool === "execute_code") {
      const result = await executeCodeInSandbox(input.language || "javascript", input.code);
      return NextResponse.json({ success: true, result });
    }

    if (tool === "web_search") {
      const result = await performWebSearch(input.query);
      return NextResponse.json({ success: true, result });
    }

    if (tool === "web_fetch") {
      const result = await fetchWebPageContent(input.url);
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: `Tool "${tool}" is not recognized.` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Execution error" }, { status: 500 });
  }
}
