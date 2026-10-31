import { NextRequest, NextResponse } from "next/server";
import { validateSession, exportUserData } from "@/lib/auth/auth-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
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

    const exportBundle = exportUserData(user.id);
    return NextResponse.json(exportBundle, {
      headers: {
        "Content-Disposition": `attachment; filename="nova-data-export-${user.id}.json"`,
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Export failed" }, { status: 500 });
  }
}
