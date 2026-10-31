import { NextRequest, NextResponse } from "next/server";
import { validateSession, logoutSession } from "@/lib/auth/auth-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("nova_session_token")?.value;
    const token = authHeader?.replace(/^Bearer\s+/i, "") || cookieToken;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const user = validateSession(token);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    return NextResponse.json({ authenticated: true, user, token });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to validate session" }, { status: 500 });
  }
}

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
