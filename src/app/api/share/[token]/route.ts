import { NextRequest, NextResponse } from "next/server";
import { getShareByToken } from "@/lib/share/share-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Share token required." },
        { status: 400 }
      );
    }

    const conversation = getShareByToken(token);

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          error: "Conversation not found or link has been revoked by the owner.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (err: any) {
    console.error("[GetShareByToken Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load shared conversation." },
      { status: 500 }
    );
  }
}
