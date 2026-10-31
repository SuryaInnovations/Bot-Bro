import { NextRequest, NextResponse } from "next/server";
import { compareDocuments } from "@/lib/workspace/cross-doc-analysis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { docIdA, docIdB, userId = "user-default" } = body;

    if (!docIdA || !docIdB) {
      return NextResponse.json(
        { success: false, error: "docIdA and docIdB are required for document comparison" },
        { status: 400 }
      );
    }

    const comparison = compareDocuments(docIdA, docIdB, userId);
    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to compare documents" },
      { status: 500 }
    );
  }
}
