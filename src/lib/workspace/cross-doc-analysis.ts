/**
 * NOVA AI — Cross-Document Q&A & Document Comparison Engine
 * Cross-document multi-hop question answering, synthesis with citations,
 * and side-by-side semantic document comparisons.
 */

import {
  CrossDocAnswerResult,
  DocumentComparisonResult,
  KnowledgeDocument,
} from "./workspace-types";
import {
  computeEmbedding,
  cosineSimilarity,
  getStoredKnowledgeDocuments,
  semanticVectorSearch,
} from "./vector-retrieval";
import { Citation } from "@/types";

/**
 * Synthesizes cross-document evidence to answer user queries with multi-source citations.
 */
export async function answerCrossDocumentQuery(
  query: string,
  documentIds?: string[],
  userId?: string,
  projectId?: string
): Promise<CrossDocAnswerResult> {
  const searchResults = semanticVectorSearch(query, {
    userId,
    projectId,
    topK: 6,
    minSimilarity: 0.12,
  });

  // Filter by documentIds if restricted
  const filteredResults = documentIds && documentIds.length > 0
    ? searchResults.filter((r) => documentIds.includes(r.chunk.documentId))
    : searchResults;

  if (filteredResults.length === 0) {
    return {
      query,
      answer: "No relevant content found across the indexed workspace documents for this query.",
      synthesizedFromDocs: [],
      citations: [],
      confidence: 0.2,
    };
  }

  // Identify distinct source documents
  const docMap = new Map<string, string>();
  filteredResults.forEach((r) => {
    docMap.set(r.chunk.documentId, r.chunk.documentTitle);
  });

  const synthesizedFromDocs = Array.from(docMap.entries()).map(([id, title]) => ({ id, title }));

  // Collect citations
  const citations: Citation[] = filteredResults.map((r, i) => ({
    id: `cit-cross-${i + 1}`,
    title: r.citation.title,
    url: r.citation.url,
    snippet: r.chunk.content.slice(0, 160) + "...",
  }));

  // Build synthesized answer
  const answerBullets = filteredResults
    .slice(0, 4)
    .map((r, i) => `• **${r.chunk.documentTitle}** (Score: ${(r.similarityScore * 100).toFixed(0)}%):\n  "${r.chunk.content.trim().slice(0, 240)}..."`)
    .join("\n\n");

  const distinctCount = synthesizedFromDocs.length;
  const answer = `Based on cross-analysis of ${distinctCount} indexed document${distinctCount > 1 ? "s" : ""} in your personal library:\n\n${answerBullets}\n\n*Synthesized from: ${synthesizedFromDocs.map((d) => `[${d.title}]`).join(", ")}.*`;

  const avgScore = filteredResults.reduce((acc, r) => acc + r.similarityScore, 0) / filteredResults.length;
  const confidence = Math.min(0.92, parseFloat((avgScore + (distinctCount > 1 ? 0.15 : 0.05)).toFixed(2)));

  return {
    query,
    answer,
    synthesizedFromDocs,
    citations,
    confidence,
  };
}

/**
 * Performs semantic and structural comparison between two knowledge documents.
 */
export function compareDocuments(
  docIdA: string,
  docIdB: string,
  userId?: string
): DocumentComparisonResult {
  const allDocs = getStoredKnowledgeDocuments(userId);
  const docA = allDocs.find((d) => d.id === docIdA);
  const docB = allDocs.find((d) => d.id === docIdB);

  if (!docA || !docB) {
    throw new Error(`One or both documents not found in knowledge base: ${docIdA}, ${docIdB}`);
  }

  // 1. Semantic Vector Similarity
  const embA = computeEmbedding(docA.rawContent);
  const embB = computeEmbedding(docB.rawContent);
  const cosSim = cosineSimilarity(embA, embB);
  const similarityPct = Math.round(Math.max(0, cosSim) * 100);

  // 2. Shared & Unique Entities
  const entitiesA = new Set(docA.entities.map((e) => e.name));
  const entitiesB = new Set(docB.entities.map((e) => e.name));

  const sharedEntities = Array.from(entitiesA).filter((e) => entitiesB.has(e));
  const uniqueToA = Array.from(entitiesA).filter((e) => !entitiesB.has(e));
  const uniqueToB = Array.from(entitiesB).filter((e) => !entitiesA.has(e));

  // 3. Common Topics (from tags and high-frequency keywords)
  const commonTopics = Array.from(new Set([...docA.tags.filter((t) => docB.tags.includes(t))]));
  if (commonTopics.length === 0 && sharedEntities.length > 0) {
    commonTopics.push(...sharedEntities.slice(0, 3));
  }

  // 4. Difference Summary
  let diffAnalysis = "";
  if (similarityPct >= 85) {
    diffAnalysis = `The two documents are near-duplicates or revisions of the same source (${similarityPct}% semantic overlap). Both share the primary themes: ${sharedEntities.slice(0, 4).join(", ") || "identical sections"}.`;
  } else if (similarityPct >= 45) {
    diffAnalysis = `The documents share substantial contextual ground (${similarityPct}% overlap) centering around ${sharedEntities.slice(0, 3).join(", ") || "shared concepts"}, but diverge significantly in specific scope. "${docA.title}" emphasizes ${uniqueToA.slice(0, 3).join(", ") || "initial specs"}, whereas "${docB.title}" focuses on ${uniqueToB.slice(0, 3).join(", ") || "distinct criteria"}.`;
  } else {
    diffAnalysis = `The documents cover distinct subjects with low overlap (${similarityPct}%). "${docA.title}" covers ${uniqueToA.slice(0, 4).join(", ") || "domain A"}, while "${docB.title}" covers ${uniqueToB.slice(0, 4).join(", ") || "domain B"}.`;
  }

  return {
    documentA: { id: docA.id, title: docA.title, length: docA.rawContent.length },
    documentB: { id: docB.id, title: docB.title, length: docB.rawContent.length },
    semanticSimilarityPct: similarityPct,
    commonTopics: commonTopics.length > 0 ? commonTopics : ["Cross-platform documentation"],
    uniqueToA: uniqueToA.slice(0, 6),
    uniqueToB: uniqueToB.slice(0, 6),
    sharedEntities: sharedEntities.slice(0, 6),
    differenceSummary: diffAnalysis,
    comparedAt: new Date().toISOString(),
  };
}
