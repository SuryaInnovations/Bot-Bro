/**
 * NOVA AI — Knowledge Graph & Entity Extraction Engine
 * Extracts named entities, constructs multi-tiered semantic knowledge graphs,
 * and links documents, concepts, and project scopes.
 */

import {
  EntityItem,
  KnowledgeGraph,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
} from "./workspace-types";
import { getStoredChunks, getStoredKnowledgeDocuments } from "./vector-retrieval";

const TECH_TERMS = new Set([
  "claude", "anthropic", "react", "typescript", "python", "javascript", "sql", "postgresql",
  "supabase", "nextjs", "node", "tailwind", "api", "rest", "graphql", "rag", "vector",
  "mcp", "docker", "llm", "ai", "gemini", "openai", "embeddings", "json", "html", "css",
  "webrtc", "sse", "scrypt", "jwt", "oauth",
]);

const ORG_TERMS = new Set([
  "anthropic", "google", "deepmind", "isro", "nasa", "pib", "tata", "meta", "microsoft",
  "amazon", "aws", "openai", "rbi", "bse", "nse", "ibja",
]);

/**
 * Extracts important named entities, technology terms, and concepts from text.
 */
export function extractImportantEntities(text: string): EntityItem[] {
  if (!text || text.trim().length === 0) return [];

  const entitiesMap = new Map<string, { type: EntityItem["type"]; count: number }>();

  // 1. Identify Tech Terms
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9_\-\s]/g, " ")
    .split(/\s+/);

  words.forEach((w) => {
    if (TECH_TERMS.has(w)) {
      const canonical = w.toUpperCase() === "AI" ? "AI" : w.charAt(0).toUpperCase() + w.slice(1);
      const curr = entitiesMap.get(canonical) || { type: "technology", count: 0 };
      entitiesMap.set(canonical, { type: "technology", count: curr.count + 1 });
    } else if (ORG_TERMS.has(w)) {
      const canonical = w.toUpperCase() === "ISRO" || w.toUpperCase() === "NASA" ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1);
      const curr = entitiesMap.get(canonical) || { type: "organization", count: 0 };
      entitiesMap.set(canonical, { type: "organization", count: curr.count + 1 });
    }
  });

  // 2. Identify Proper Nouns (Capitalized multi-word phrases)
  const regex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  const matches = text.match(regex) || [];
  const blacklist = new Set(["The", "This", "That", "When", "What", "Where", "How", "Also", "However", "In", "On", "At", "By"]);

  matches.forEach((m) => {
    if (m.length > 2 && !blacklist.has(m)) {
      if (!entitiesMap.has(m)) {
        entitiesMap.set(m, { type: "concept", count: 1 });
      } else {
        const curr = entitiesMap.get(m)!;
        entitiesMap.set(m, { type: curr.type, count: curr.count + 1 });
      }
    }
  });

  return Array.from(entitiesMap.entries())
    .map(([name, { type, count }]) => ({
      name,
      type,
      frequency: count,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20);
}

/**
 * Builds the entire knowledge graph for a user/project workspace.
 */
export function buildWorkspaceKnowledgeGraph(
  userId?: string,
  projectId?: string
): KnowledgeGraph {
  const docs = getStoredKnowledgeDocuments(userId, projectId);
  const chunks = getStoredChunks();

  const nodes: KnowledgeGraphNode[] = [];
  const edges: KnowledgeGraphEdge[] = [];
  const nodeIds = new Set<string>();

  // 1. Add Document Nodes
  docs.forEach((doc) => {
    const docNodeId = `node-doc-${doc.id}`;
    nodes.push({
      id: docNodeId,
      label: doc.title,
      category: "document",
      weight: Math.min(10, Math.max(3, doc.chunksCount)),
    });
    nodeIds.add(docNodeId);

    // 2. Add Entity Nodes and Edges from Document
    const docEntities = doc.entities.slice(0, 8);
    docEntities.forEach((ent) => {
      const entNodeId = `node-ent-${ent.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      if (!nodeIds.has(entNodeId)) {
        nodes.push({
          id: entNodeId,
          label: ent.name,
          category: ent.type === "technology" ? "entity" : "concept",
          weight: Math.min(8, ent.frequency + 2),
        });
        nodeIds.add(entNodeId);
      }

      edges.push({
        id: `edge-${docNodeId}-${entNodeId}`,
        source: docNodeId,
        target: entNodeId,
        relation: "references",
        weight: parseFloat((ent.frequency / 5).toFixed(2)),
      });
    });

    // 3. Add Cross-Document Edges (Related Documents)
    (doc.relatedDocIds || []).forEach((relId) => {
      const targetDocNodeId = `node-doc-${relId}`;
      const edgeId = `edge-sim-${doc.id}-${relId}`;
      const reverseEdgeId = `edge-sim-${relId}-${doc.id}`;

      // Avoid duplicating bidirectional edges
      if (!edges.some((e) => e.id === edgeId || e.id === reverseEdgeId)) {
        edges.push({
          id: edgeId,
          source: docNodeId,
          target: targetDocNodeId,
          relation: "semantically_related",
          weight: 0.8,
        });
      }
    });
  });

  return {
    nodes,
    edges,
    lastUpdated: new Date().toISOString(),
  };
}
