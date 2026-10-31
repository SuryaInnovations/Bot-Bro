import { NextRequest, NextResponse } from "next/server";
import { indexDocumentContent, searchKnowledgeBase, listIndexedDocuments } from "@/lib/knowledge/rag-engine";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (q) {
    const results = searchKnowledgeBase(q);
    return NextResponse.json(results);
  }

  return NextResponse.json({ documents: listIndexedDocuments() });
}

export async function POST(req: NextRequest) {
  try {
    const { documentId, name, type, size, content } = await req.json();
    if (!content) {
      return NextResponse.json({ error: "Document content required" }, { status: 400 });
    }

    const result = indexDocumentContent(
      documentId || `doc-${Date.now()}`,
      name || "Document.txt",
      type || "text/plain",
      size || content.length,
      content
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
