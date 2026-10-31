import { NextRequest, NextResponse } from "next/server";
import {
  deleteKnowledgeDocument,
  findDuplicateDocuments,
  getStoredChunks,
  getStoredKnowledgeDocuments,
  indexKnowledgeDocument,
} from "@/lib/workspace/vector-retrieval";
import { buildWorkspaceKnowledgeGraph } from "@/lib/workspace/knowledge-graph";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;

    const documents = getStoredKnowledgeDocuments(userId, projectId);
    const { duplicatePairs } = findDuplicateDocuments(userId);
    const knowledgeGraph = buildWorkspaceKnowledgeGraph(userId, projectId);

    return NextResponse.json({
      success: true,
      documents,
      totalDocuments: documents.length,
      duplicatePairs,
      knowledgeGraph,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve documents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      fileName,
      rawContent,
      fileType = "text/plain",
      fileSize,
      userId = "user-default",
      projectId,
      tags,
    } = body;

    if (!title || !rawContent) {
      return NextResponse.json(
        { success: false, error: "Document title and rawContent are required" },
        { status: 400 }
      );
    }

    const { document, chunks } = indexKnowledgeDocument({
      userId,
      projectId,
      title,
      fileName: fileName || `${title.toLowerCase().replace(/\s+/g, "_")}.txt`,
      fileType,
      fileSize: fileSize || rawContent.length,
      rawContent,
      tags,
    });

    return NextResponse.json({
      success: true,
      document,
      chunksCreated: chunks.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to index document" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Document id is required" },
        { status: 400 }
      );
    }

    const deleted = deleteKnowledgeDocument(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}
