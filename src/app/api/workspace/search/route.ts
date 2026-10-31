import { NextRequest, NextResponse } from "next/server";
import { semanticVectorSearch } from "@/lib/workspace/vector-retrieval";
import { answerCrossDocumentQuery } from "@/lib/workspace/cross-doc-analysis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      query,
      documentIds,
      userId = "user-default",
      projectId,
      topK = 5,
      mode = "hybrid", // "search" or "cross_doc_qa"
    } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Query parameter is required" },
        { status: 400 }
      );
    }

    if (mode === "cross_doc_qa") {
      const qaResult = await answerCrossDocumentQuery(query, documentIds, userId, projectId);
      return NextResponse.json({
        success: true,
        mode: "cross_doc_qa",
        result: qaResult,
      });
    }

    const searchResults = semanticVectorSearch(query, {
      userId,
      projectId,
      topK,
      minSimilarity: 0.1,
    });

    return NextResponse.json({
      success: true,
      mode: "search",
      results: searchResults,
      count: searchResults.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute semantic search" },
      { status: 500 }
    );
  }
}
