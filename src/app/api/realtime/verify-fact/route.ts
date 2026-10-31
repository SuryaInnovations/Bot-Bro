import { NextRequest, NextResponse } from "next/server";
import { verifyFactualClaim } from "@/lib/realtime/fact-verifier";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { claim } = await req.json();

    if (!claim || typeof claim !== "string" || !claim.trim()) {
      return NextResponse.json({ error: "Factual claim text is required." }, { status: 400 });
    }

    const result = await verifyFactualClaim(claim.trim());
    return NextResponse.json({ result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to verify factual claim" },
      { status: 500 }
    );
  }
}
