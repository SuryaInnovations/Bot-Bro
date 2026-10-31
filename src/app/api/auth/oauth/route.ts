import { NextRequest, NextResponse } from "next/server";
import { loginWithGoogleOAuth } from "@/lib/auth/auth-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider = "google", email, fullName, avatarUrl } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required for OAuth login." }, { status: 400 });
    }

    if (provider !== "google") {
      return NextResponse.json({ error: "Only Google OAuth is currently supported." }, { status: 400 });
    }

    const result = await loginWithGoogleOAuth(email, fullName || "", avatarUrl);
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
    return NextResponse.json({ error: err?.message || "OAuth login failed" }, { status: 500 });
  }
}
