import { NextRequest, NextResponse } from "next/server";
import { loginWithEmailPassword } from "@/lib/auth/auth-service";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";
    const rateCheck = checkRateLimit(`auth-login-${clientIp}`, 20, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please wait ${Math.ceil(rateCheck.resetMs / 1000)}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const result = await loginWithEmailPassword(email, password);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const response = NextResponse.json(result);
    if (result.token) {
      response.cookies.set("nova_session_token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 3600,
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Login failed" }, { status: 500 });
  }
}
