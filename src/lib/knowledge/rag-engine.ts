export interface IndexedChunk {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  tokensEstimate: number;
  keywords: string[];
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  chunksCount: number;
  indexedAt: string;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  category: "concept" | "document" | "entity";
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  relation: string;
}

// In-memory knowledge store (persisted in store / Supabase)
let indexedChunks: IndexedChunk[] = [];
let indexedDocuments: KnowledgeDocument[] = [];

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const stopWords = new Set(["this", "that", "with", "from", "have", "more", "will", "about", "which", "there", "their"]);
  return Array.from(new Set(words.filter((w) => !stopWords.has(w)))).slice(0, 15);
}

export function indexDocumentContent(
  documentId: string,
  name: string,
  type: string,
  size: number,
  rawText: string,
  chunkSize = 600,
  overlap = 100
): { document: KnowledgeDocument; chunksCreated: number } {
  // Remove prior chunks for this doc if re-indexing
  indexedChunks = indexedChunks.filter((c) => c.documentId !== documentId);
  indexedDocuments = indexedDocuments.filter((d) => d.id !== documentId);

  const chunks: IndexedChunk[] = [];
  const words = rawText.split(/\s+/);

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunkWords = words.slice(i, i + chunkSize);
    if (chunkWords.length === 0) break;
    const content = chunkWords.join(" ");

    chunks.push({
      id: `chunk-${documentId}-${chunks.length + 1}`,
      documentId,
      documentName: name,
      content,
      tokensEstimate: Math.ceil(content.length / 4),
      keywords: extractKeywords(content),
    });
  }

  indexedChunks.push(...chunks);

  const docRecord: KnowledgeDocument = {
    id: documentId,
    name,
    type,
    size,
    chunksCount: chunks.length,
    indexedAt: new Date().toISOString(),
  };

  indexedDocuments.push(docRecord);

  return {
    document: docRecord,
    chunksCreated: chunks.length,
  };
}

export function searchKnowledgeBase(
  query: string,
  topK = 4
): {
  chunks: { chunk: IndexedChunk; score: number }[];
  compressedContext: string;
  graphNodes: KnowledgeGraphNode[];
  graphEdges: KnowledgeGraphEdge[];
} {
  const queryTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (indexedChunks.length === 0) {
    // Provide default initial knowledge
    indexDocumentContent(
      "doc-nova-arch",
      "NOVA_AI_Architecture.md",
      "text/markdown",
      4096,
      `NOVA AI Platform Architecture:
      - Uses official Anthropic Claude Messages API with streaming SSE.
      - Hybrid reasoning via Claude 3.7 Sonnet Extended Thinking.
      - Split-screen sandboxed iframe workspace for live React and HTML artifacts.
      - Integrated real-time intelligence for Indian and global financial markets, weather, and news.
      - RAG knowledge engine supporting document indexing, semantic chunk retrieval, and transparent memory control.`
    );
  }

  // Calculate TF-IDF & term overlap score
  const scored = indexedChunks.map((chunk) => {
    let matches = 0;
    const chunkLower = chunk.content.toLowerCase();

    queryTerms.forEach((term) => {
      if (chunkLower.includes(term)) matches += 2;
      if (chunk.keywords.includes(term)) matches += 3;
    });

    const score = queryTerms.length > 0 ? matches / (queryTerms.length * 3) : 0;
    return { chunk, score: Math.min(1, score) };
  });

  scored.sort((a, b) => b.score - a.score);
  const topResults = scored.slice(0, topK);

  const compressedContext = topResults
    .filter((r) => r.score > 0 || topResults.length <= 2)
    .map((r, i) => `[Source ${i + 1}: ${r.chunk.documentName}]\n${r.chunk.content}`)
    .join("\n\n---\n\n");

  // Construct Knowledge Graph entities
  const graphNodes: KnowledgeGraphNode[] = [
    { id: "query-node", label: query.slice(0, 25), category: "concept" },
  ];
  const graphEdges: KnowledgeGraphEdge[] = [];

  topResults.forEach((r, idx) => {
    const docNodeId = `doc-${r.chunk.documentId}`;
    if (!graphNodes.find((n) => n.id === docNodeId)) {
      graphNodes.push({ id: docNodeId, label: r.chunk.documentName, category: "document" });
    }
    graphEdges.push({
      source: "query-node",
      target: docNodeId,
      relation: `Relevant (Score: ${Math.round(r.score * 100)}%)`,
    });

    r.chunk.keywords.slice(0, 2).forEach((kw, kIdx) => {
      const kwNodeId = `kw-${idx}-${kIdx}`;
      graphNodes.push({ id: kwNodeId, label: kw, category: "entity" });
      graphEdges.push({ source: docNodeId, target: kwNodeId, relation: "contains" });
    });
  });

  return {
    chunks: topResults,
    compressedContext,
    graphNodes,
    graphEdges,
  };
}

export function listIndexedDocuments(): KnowledgeDocument[] {
  return indexedDocuments;
}
