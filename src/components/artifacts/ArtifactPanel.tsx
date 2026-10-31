"use client";

import React, { useState } from "react";
import {
  X,
  Code2,
  Eye,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  History,
  Sparkles,
} from "lucide-react";
import { Artifact } from "@/types";
import { SandboxedIframe } from "./SandboxedIframe";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ArtifactPanelProps {
  artifact: Artifact | null;
  onClose: () => void;
  onSelectVersion?: (version: number) => void;
}

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({
  artifact,
  onClose,
  onSelectVersion,
}) => {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number>(
    artifact?.version || 1
  );

  if (!artifact) return null;

  const currentContent =
    artifact.versions?.find((v) => v.version === selectedVersion)?.content ||
    artifact.content;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let extension = ".txt";
    if (artifact.type === "text/html") extension = ".html";
    else if (artifact.type === "image/svg+xml") extension = ".svg";
    else if (artifact.type === "text/markdown") extension = ".md";
    else if (artifact.language === "javascript" || artifact.language === "js")
      extension = ".js";
    else if (artifact.language === "typescript" || artifact.language === "ts")
      extension = ".ts";
    else if (artifact.language === "python" || artifact.language === "py")
      extension = ".py";

    const blob = new Blob([currentContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${artifact.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportFormat = async (format: "pdf" | "docx" | "markdown" | "code") => {
    setShowExportMenu(false);
    try {
      const res = await fetch("/api/workspace/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "export",
          title: artifact.title,
          content: currentContent,
          type: artifact.type,
          language: artifact.language,
          format,
        }),
      });
      const data = await res.json();
      if (data.success && data.export) {
        const blob = new Blob([data.export.content], { type: data.export.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.export.fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.warn("Export failed", e);
    }
  };

  const isPreviewable =
    artifact.type === "text/html" ||
    artifact.type === "application/vnd.ant.react" ||
    artifact.type === "image/svg+xml" ||
    artifact.type === "text/markdown";

  return (
    <div
      className={`flex flex-col border-l border-[var(--border)] bg-[var(--background)] transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 w-full h-full"
          : "fixed inset-0 z-30 lg:relative lg:inset-auto lg:z-20 lg:w-[48%] h-full shrink-0 shadow-2xl lg:shadow-none"
      }`}
    >
      {/* Top Bar */}
      <div className="h-14 border-b border-[var(--border)] px-4 flex items-center justify-between bg-[var(--surface)] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-nova-500/10 text-nova-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h3 className="font-semibold text-xs text-[var(--foreground)] truncate">
              {artifact.title}
            </h3>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              {artifact.language || artifact.type.split("/").pop()}
            </span>
          </div>

          {/* Version Selector */}
          {artifact.versions && artifact.versions.length > 1 && (
            <div className="flex items-center gap-1 ml-2">
              <History className="w-3 h-3 text-[var(--text-muted)]" />
              <select
                value={selectedVersion}
                onChange={(e) => {
                  const ver = Number(e.target.value);
                  setSelectedVersion(ver);
                  if (onSelectVersion) onSelectVersion(ver);
                }}
                className="text-[11px] bg-[var(--surface-subtle)] border border-[var(--border)] rounded px-1.5 py-0.5 text-[var(--foreground)] focus:outline-none"
              >
                {artifact.versions.map((v) => (
                  <option key={v.version} value={v.version}>
                    v{v.version}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab & Action Controls */}
        <div className="flex items-center gap-1.5">
          {isPreviewable && (
            <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-0.5 mr-2">
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  activeTab === "preview"
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow-subtle"
                    : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  activeTab === "code"
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow-subtle"
                    : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Code2 className="w-3 h-3" />
                <span>Code</span>
              </button>
            </div>
          )}

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition"
            title="Copy artifact source"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Download & Multi-Format Exporter */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition flex items-center gap-1"
              title="Export Artifact"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl p-1 z-50 text-xs">
                <button
                  onClick={() => handleExportFormat("pdf")}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--foreground)] flex items-center justify-between"
                >
                  <span>Export PDF</span>
                  <span className="text-[10px] text-red-500 font-mono font-bold">.pdf</span>
                </button>
                <button
                  onClick={() => handleExportFormat("docx")}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--foreground)] flex items-center justify-between"
                >
                  <span>Export DOCX</span>
                  <span className="text-[10px] text-blue-500 font-mono font-bold">.docx</span>
                </button>
                <button
                  onClick={() => handleExportFormat("markdown")}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--foreground)] flex items-center justify-between"
                >
                  <span>Export Markdown</span>
                  <span className="text-[10px] text-amber-500 font-mono font-bold">.md</span>
                </button>
                <button
                  onClick={() => handleExportFormat("code")}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--foreground)] flex items-center justify-between"
                >
                  <span>Export Code File</span>
                  <span className="text-[10px] text-emerald-500 font-mono font-bold">code</span>
                </button>
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--surface-subtle)] transition"
            title="Close workspace"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Workspace Body */}
      <div className="flex-1 overflow-auto bg-[var(--surface-subtle)]">
        {activeTab === "preview" && isPreviewable ? (
          artifact.type === "image/svg+xml" ? (
            <div
              className="p-8 flex items-center justify-center h-full bg-white"
              dangerouslySetInnerHTML={{ __html: currentContent }}
            />
          ) : artifact.type === "text/markdown" ? (
            <div className="p-6 max-w-3xl mx-auto prose bg-white min-h-full">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentContent}
              </ReactMarkdown>
            </div>
          ) : (
            <SandboxedIframe content={currentContent} type={artifact.type} />
          )
        ) : (
          <div className="h-full bg-[#1e1e1e] p-4 text-white font-mono text-xs overflow-auto">
            <pre className="leading-relaxed">
              <code>{currentContent}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
