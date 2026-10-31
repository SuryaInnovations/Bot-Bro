/**
 * NOVA AI — Personal AI Workspace 2.0
 * Unified data models for Knowledge, Vector Embeddings, Memory,
 * Cross-Document Analysis, Artifact Versions, and Project Permissions.
 */

import { Citation } from "@/types";

export type DocumentType =
  | "text/plain"
  | "text/markdown"
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/json"
  | "text/code";

export interface EntityItem {
  name: string;
  type: "concept" | "technology" | "organization" | "person" | "location";
  frequency: number;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  projectId?: string;
  chunkIndex: number;
  content: string;
  startChar: number;
  endChar: number;
  tokenEstimate: number;
  embedding: number[];
  keywords: string[];
  entities: string[];
}

export interface KnowledgeDocument {
  id: string;
  userId: string;
  projectId?: string; // Optional: if provided, isolated to that project
  title: string;
  fileName: string;
  fileType: DocumentType | string;
  fileSize: number;
  rawContent: string;
  summary?: string;
  chunksCount: number;
  entities: EntityItem[];
  tags: string[];
  isDuplicateOf?: string; // ID of original if duplicate detected
  duplicateConfidence?: number;
  relatedDocIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  category: "document" | "concept" | "entity" | "project";
  weight: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  weight: number;
}

export interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  lastUpdated: string;
}

export interface VectorSearchResult {
  chunk: DocumentChunk;
  similarityScore: number;
  matchType: "vector" | "keyword" | "hybrid";
  citation: Citation;
}

export interface UserMemoryItem {
  id: string;
  userId: string;
  projectId?: string;
  key: string;
  value: string;
  category: "preference" | "fact" | "instruction" | "project_rule";
  isEnabled: boolean; // User control to disable without deleting
  confidence: number;
  sourceConversationId?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  conversationId: string;
  userId: string;
  projectId?: string;
  title: string;
  summaryText: string;
  keyTopics: string[];
  actionItems: string[];
  originalMessageCount: number;
  compressedTokenCount: number;
  createdAt: string;
}

export type ProjectRole = "viewer" | "editor" | "admin";

export interface ProjectShareMember {
  userId: string;
  userEmail: string;
  role: ProjectRole;
  addedAt: string;
}

export interface ProjectPermissionConfig {
  projectId: string;
  ownerId: string;
  isPublic: boolean;
  allowComments: boolean;
  allowExport: boolean;
  members: ProjectShareMember[];
  updatedAt: string;
}

export interface ArtifactVersionRecord {
  id: string;
  artifactId: string;
  version: number;
  title: string;
  type: string;
  language?: string;
  content: string;
  changeDescription: string;
  authorId?: string;
  createdAt: string;
}

export type ArtifactExportFormat = "pdf" | "docx" | "markdown" | "code" | "html";

export interface ArtifactExportResult {
  format: ArtifactExportFormat;
  fileName: string;
  mimeType: string;
  content: string; // Base64 encoded or text
  downloadUrl?: string;
}

export interface DocumentComparisonResult {
  documentA: { id: string; title: string; length: number };
  documentB: { id: string; title: string; length: number };
  semanticSimilarityPct: number;
  commonTopics: string[];
  uniqueToA: string[];
  uniqueToB: string[];
  sharedEntities: string[];
  differenceSummary: string;
  comparedAt: string;
}

export interface CrossDocAnswerResult {
  query: string;
  answer: string;
  synthesizedFromDocs: { id: string; title: string }[];
  citations: Citation[];
  confidence: number;
}
