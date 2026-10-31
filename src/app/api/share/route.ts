import { NextRequest, NextResponse } from "next/server";
import {
  createShare,
  revokeShare,
  getShareStatus,
} from "@/lib/share/share-service";
import { validateSession } from "@/lib/auth/auth-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = "create", conversationId, title, model, messages, forceRegenerate } = body;

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "conversationId is required." },
        { status: 400 }
      );
    }

    // Extract user session if available
    let userId: string | undefined = undefined;
    const sessionToken =
      req.cookies.get("nova_session_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (sessionToken) {
      const user = validateSession(sessionToken);
      if (user) {
        userId = user.id;
      }
    }

    if (action === "revoke") {
      const result = revokeShare(conversationId, userId);
      return NextResponse.json(result, { status: result.success ? 200 : 403 });
    }

    if (action === "status") {
      const status = getShareStatus(conversationId, userId);
      return NextResponse.json({
        success: true,
        isShared: Boolean(status && !status.isRevoked),
        share: status || null,
      });
    }

    // Action: "create" or "regenerate"
    const isRegen = action === "regenerate" || Boolean(forceRegenerate);
    const share = createShare({
      conversationId,
      userId,
      title: title || "Shared Chat",
      model: model || "gemini-flash-lite-latest",
      messages: messages || [],
      forceRegenerate: isRegen,
    });

    return NextResponse.json({
      success: true,
      share: {
        token: share.token,
        conversationId: share.conversationId,
        title: share.title,
        model: share.model,
        isRevoked: share.isRevoked,
        createdAt: share.createdAt,
      },
    });
  } catch (err: any) {
    console.error("[ShareAPI Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
