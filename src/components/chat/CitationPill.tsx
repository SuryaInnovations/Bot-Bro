"use client";

import React from "react";
import { ExternalLink, Globe } from "lucide-react";
import { Citation } from "@/types";

interface CitationPillProps {
  citation: Citation;
}

export const CitationPill: React.FC<CitationPillProps> = ({ citation }) => {
  let hostname = "";
  try {
    hostname = new URL(citation.url).hostname.replace(/^www\./, "");
  } catch {
    hostname = "source";
  }

  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-[var(--surface-subtle)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:text-nova-500 transition-colors max-w-xs truncate group"
      title={`${citation.title}\n${citation.snippet || ""}`}
    >
      <Globe className="w-2.5 h-2.5 text-[var(--text-muted)] group-hover:text-nova-500 shrink-0" />
      <span className="font-medium truncate">{citation.title || hostname}</span>
      <span className="text-[10px] text-[var(--text-muted)] shrink-0">({hostname})</span>
      <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 shrink-0" />
    </a>
  );
};
