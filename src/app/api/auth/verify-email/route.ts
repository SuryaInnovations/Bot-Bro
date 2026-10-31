import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth/auth-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Verification token is required." }, { status: 400 });
    }

    const res = verifyEmailToken(token);
    if (!res.success) {
      return NextResponse.json({ error: res.message }, { status: 400 });
    }

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Verification failed" }, { status: 500 });
  }
}
