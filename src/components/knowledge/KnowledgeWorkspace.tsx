"use client";

import React, { useState } from "react";
import {
  Database,
  Search,
  FileText,
  Upload,
  Plus,
  Trash2,
  Share2,
  Sparkles,
  Layers,
  Brain,
} from "lucide-react";
import {
  indexDocumentContent,
  searchKnowledgeBase,
  listIndexedDocuments,
  KnowledgeDocument,
  IndexedChunk,
} from "@/lib/knowledge/rag-engine";

export const KnowledgeWorkspace: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(() => listIndexedDocuments());
  const [searchQuery, setSearchQuery] = useState("vector database architecture");
  const [searchResults, setSearchResults] = useState<{
    chunks: { chunk: IndexedChunk; score: number }[];
    compressedContext: string;
    graphNodes: any[];
    graphEdges: any[];
  } | null>(() => searchKnowledgeBase("vector database architecture"));

  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocText, setNewDocText] = useState("");
  const [isIndexing, setIsIndexing] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const res = searchKnowledgeBase(searchQuery.trim());
    setSearchResults(res);
  };

  const handleIndexDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocText.trim()) return;

    setIsIndexing(true);
    try {
      const res = indexDocumentContent(
        `doc-${Date.now()}`,
        newDocTitle.trim() || "Untitled Document",
        "text/plain",
        newDocText.length,
        newDocText.trim()
      );
      setDocuments(listIndexedDocuments());
      setNewDocTitle("");
      setNewDocText("");
      // Refresh search
      setSearchResults(searchKnowledgeBase(searchQuery));
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-cyan-500" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Personal Knowledge & RAG Engine
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 font-bold uppercase tracking-wider">
              Semantic Search
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Index documents, extract structured knowledge graphs, and execute semantic retrieval with zero-token context compression.
          </p>
        </div>
      </div>

      {/* Semantic Search Box */}
      <form onSubmit={handleSearch} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle space-y-3">
        <label className="font-semibold text-xs text-[var(--foreground)] block">
          Semantic Search Knowledge Base:
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts, architecture rules, or indexed documents..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-700 transition shadow-sm"
          >
            Search RAG
          </button>
        </div>
      </form>

      {/* Semantic Search Results */}
      {searchResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <h3 className="font-bold text-sm">Relevant Knowledge Chunks</h3>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              {searchResults.chunks.length} chunks retrieved
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.chunks.map((res, i) => (
              <div
                key={res.chunk.id}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2 shadow-subtle"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span className="font-semibold truncate">{res.chunk.documentName}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-600 font-mono font-bold">
                    Score: {Math.round(res.score * 100)}%
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {res.chunk.content}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {res.chunk.keywords.map((kw, ki) => (
                    <span
                      key={ki}
                      className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-muted)] font-mono"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Compressed Context for Claude */}
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-2">
            <span className="font-semibold text-xs text-cyan-800 dark:text-cyan-400 block">
              Compressed RAG Context (Injected into Claude Prompts):
            </span>
            <pre className="text-xs text-[var(--foreground)] font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {searchResults.compressedContext}
            </pre>
          </div>
        </div>
      )}

      {/* Add New Knowledge Document Form */}
      <form onSubmit={handleIndexDoc} className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-cyan-500" />
          <h3 className="font-bold text-sm">Index New Knowledge Document</h3>
        </div>

        <input
          type="text"
          value={newDocTitle}
          onChange={(e) => setNewDocTitle(e.target.value)}
          placeholder="Document Title (e.g. System_Spec_2026.md)"
          className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-cyan-500"
        />

        <textarea
          value={newDocText}
          onChange={(e) => setNewDocText(e.target.value)}
          placeholder="Paste full document content, technical documentation, or guidelines to index into RAG vector memory..."
          rows={5}
          className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-cyan-500 leading-relaxed font-mono"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isIndexing || !newDocText.trim()}
            className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-700 transition disabled:opacity-50"
          >
            {isIndexing ? "Chunking & Indexing..." : "Index Document Chunks"}
          </button>
        </div>
      </form>
    </div>
  );
};
