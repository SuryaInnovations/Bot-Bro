import { NextRequest, NextResponse } from "next/server";
import { registerWithEmailPassword } from "@/lib/auth/auth-service";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";
    const rateCheck = checkRateLimit(`auth-reg-${clientIp}`, 15, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many registration attempts. Please wait ${Math.ceil(rateCheck.resetMs / 1000)}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password, fullName } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const result = await registerWithEmailPassword(email, password, fullName || "");
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const response = NextResponse.json(result, { status: 201 });
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
    return NextResponse.json({ error: err?.message || "Registration failed" }, { status: 500 });
  }
}
