import { NextRequest, NextResponse } from "next/server";
import { logoutSession } from "@/lib/auth/auth-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("nova_session_token")?.value;
    const token = authHeader?.replace(/^Bearer\s+/i, "") || cookieToken;

    if (token) {
      logoutSession(token);
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    response.cookies.delete("nova_session_token");
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to logout" }, { status: 500 });
  }
}
