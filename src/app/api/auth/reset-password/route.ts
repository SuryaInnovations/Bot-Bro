import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset, resetPasswordWithToken } from "@/lib/auth/auth-service";

export const runtime = "nodejs";

// POST /api/auth/reset-password
// action: "request" | "reset"
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = "request", email, token, newPassword } = body;

    if (action === "request") {
      if (!email) {
        return NextResponse.json({ error: "Email is required to request reset." }, { status: 400 });
      }
      const res = requestPasswordReset(email);
      return NextResponse.json(res);
    }

    if (action === "reset") {
      if (!token || !newPassword) {
        return NextResponse.json({ error: "Reset token and new password are required." }, { status: 400 });
      }
      const res = resetPasswordWithToken(token, newPassword);
      if (!res.success) {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to process password reset" }, { status: 500 });
  }
}
