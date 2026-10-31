import { NextRequest, NextResponse } from "next/server";
import { validateSession, deleteUserAccount } from "@/lib/auth/auth-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("nova_session_token")?.value;
    const token = authHeader?.replace(/^Bearer\s+/i, "") || cookieToken;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = validateSession(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = deleteUserAccount(user.id);
    const response = NextResponse.json({ success, message: "Account and associated data deleted." });
    response.cookies.delete("nova_session_token");
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Account deletion failed" }, { status: 500 });
  }
}
