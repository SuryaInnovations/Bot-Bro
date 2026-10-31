import { NextRequest, NextResponse } from "next/server";
import { validateSession, updateUserProfile } from "@/lib/auth/auth-service";

export const runtime = "nodejs";

function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("nova_session_token")?.value;
  const token = authHeader?.replace(/^Bearer\s+/i, "") || cookieToken;
  if (!token) return null;
  return validateSession(token);
}

export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await req.json();
    const updatedUser = updateUserProfile(user.id, updates);
    return NextResponse.json({ user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update profile" }, { status: 500 });
  }
}
