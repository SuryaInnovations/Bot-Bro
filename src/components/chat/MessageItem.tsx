"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  FileText,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  ExternalLink,
  Code2,
  Eye,
  Shield,
  Download,
} from "lucide-react";
import { Message, Attachment, Artifact } from "@/types";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolStatusBadge } from "./ToolStatusBadge";
import { CitationPill } from "./CitationPill";
import { formatBytes } from "@/lib/utils";
import { NovaOrb } from "../common/NovaOrb";
import { GeneratedImageViewer } from "./GeneratedImageViewer";
import { InteractiveChart } from "./InteractiveChart";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  onFeedback?: (feedback: "positive" | "negative") => void;
  onOpenArtifact?: (artifact: Partial<Artifact>) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isStreaming = false,
  onRegenerate,
  onEdit,
  onFeedback,
  onOpenArtifact,
}) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && onEdit) {
      onEdit(editText.trim());
      setIsEditing(false);
    }
  };

  // Helper to extract artifact tags from content if present
  const extractArtifactTags = (content: string) => {
    const artifactRegex = /<antArtifact\s+identifier="([^"]+)"\s+type="([^"]+)"\s+title="([^"]+)"(?:\s+language="([^"]*)")?>([\s\S]*?)<\/antArtifact>/g;
    const artifacts: any[] = [];
    let match;
    while ((match = artifactRegex.exec(content)) !== null) {
      artifacts.push({
        id: match[1],
        type: match[2],
        title: match[3],
        language: match[4] || "",
        content: match[5].trim(),
      });
    }
    return artifacts;
  };

  // Helper to extract embedded botbroImage tag
  const extractEmbeddedImage = (content: string) => {
    try {
      const match = content.match(/<botbroImage\s+data="([^"]+)"\s*\/>/);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        return JSON.parse(decoded);
      }
    } catch {
      // ignore
    }
    return null;
  };

  // Helper to extract embedded botbroChart tag
  const extractEmbeddedChart = (content: string) => {
    try {
      const match = content.match(/<botbroChart\s+data="([^"]+)"\s*\/>/);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        return JSON.parse(decoded);
      }
    } catch {
      // ignore
    }
    return null;
  };

  // Clean out XML / custom tags from markdown rendering if we show them as interactive components
  const cleanContentForDisplay = (content: string) => {
    return (content || "")
      .replace(/<antArtifact[\s\S]*?<\/antArtifact>/g, "\n*(Artifact created — see panel below)*\n")
      .replace(/<botbroImage[\s\S]*?\/>/g, "")
      .replace(/<botbroChart[\s\S]*?\/>/g, "");
  };

  const detectedArtifacts = extractArtifactTags(message.content);
  const renderedImage = message.generatedImage || extractEmbeddedImage(message.content);
  const renderedChart = message.chartSpec || extractEmbeddedChart(message.content);

  const getFileIcon = (mimeType: string, name: string) => {
    if (mimeType.includes("sheet") || name.endsWith(".xlsx") || name.endsWith(".csv")) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    }
    if (mimeType.includes("pdf") || name.endsWith(".pdf")) {
      return <FileText className="w-4 h-4 text-rose-500" />;
    }
    return <FileCode className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div
      className={`group py-4 sm:py-5 px-3 sm:px-4 md:px-6 transition-colors ${
        isUser
          ? "bg-[var(--surface-subtle)]/40 hover:bg-[var(--surface-subtle)]/60"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-2.5 sm:gap-4 items-start w-full">
        {/* Role Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 border border-[var(--border)] flex items-center justify-center font-semibold text-xs text-white shadow-xs">
              S
            </div>
          ) : (
            <NovaOrb size="sm" />
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Label */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--foreground)]">
              {isUser ? "You" : "BOT BRO"}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* User Attachments Preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs w-full sm:max-w-xs shadow-subtle"
                >
                  {att.base64Data && att.type.startsWith("image/") ? (
                    <img
                      src={`data:${att.type};base64,${att.base64Data}`}
                      alt={att.name}
                      className="w-8 h-8 rounded object-cover border border-[var(--border)]"
                    />
                  ) : (
                    getFileIcon(att.type, att.name)
                  )}
                  <div className="truncate">
                    <p className="font-medium truncate text-xs">{att.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {formatBytes(att.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Thinking Accordion */}
          {message.thinking && (
            <ThinkingBlock
              thinking={message.thinking}
              isGenerating={isStreaming && !message.content}
            />
          )}

          {/* Tool Executions Badges */}
          {message.toolExecutions && message.toolExecutions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 my-1">
              {message.toolExecutions.map((tool) => (
                <ToolStatusBadge key={tool.id} tool={tool} />
              ))}
            </div>
          )}

          {/* Editing state for User */}
          {isEditing ? (
            <div className="space-y-2 my-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full text-sm p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-nova-500"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-nova-500 text-white rounded text-xs font-medium hover:bg-nova-600 transition"
                >
                  Save & Resend
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-[var(--surface-subtle)] border border-[var(--border)] rounded text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Main Rendered Markdown */
            <div className="prose text-sm leading-relaxed max-w-full break-words overflow-x-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  table({ children }: any) {
                    return (
                      <div className="responsive-table-wrapper">
                        <table>{children}</table>
                      </div>
                    );
                  },
                  img({ src, alt }: any) {
                    return (
                      <img
                        src={src}
                        alt={alt}
                        className="max-w-full h-auto rounded-lg border border-[var(--border)] my-2"
                        loading="lazy"
                      />
                    );
                  },
                  a({ href, children }: any) {
                    const isDownload = typeof href === "string" && href.includes("/api/conversion/download/");
                    if (isDownload) {
                      return (
                        <a
                          href={href}
                          download
                          className="inline-flex items-center gap-2 px-4 py-2 my-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-xs no-underline cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{children}</span>
                        </a>
                      );
                    }
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-500 hover:underline font-medium"
                      >
                        {children}
                      </a>
                    );
                  },
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const lang = match ? match[1] : "";
                    const codeString = String(children).replace(/\n$/, "");

                    if (!inline && lang) {
                      return (
                        <div className="my-3 rounded-lg border border-[var(--border)] bg-[#1e1e1e] text-white text-xs overflow-hidden shadow-subtle max-w-full">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-neutral-800 text-neutral-400 font-mono text-[11px]">
                            <span>{lang}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(codeString);
                              }}
                              className="flex items-center gap-1 hover:text-white transition"
                              title="Copy code"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </button>
                          </div>
                          <div className="p-3 overflow-x-auto font-mono text-xs leading-normal">
                            <code>{children}</code>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {cleanContentForDisplay(message.content)}
              </ReactMarkdown>

              {/* Rendered AI Generated Image Component */}
              {renderedImage && (
                <div className="not-prose my-3">
                  <GeneratedImageViewer image={renderedImage} />
                </div>
              )}

              {/* Rendered Interactive Data Visualization Component */}
              {renderedChart && (
                <div className="not-prose my-3">
                  <InteractiveChart spec={renderedChart} />
                </div>
              )}
            </div>
          )}

          {/* Interactive Detected Artifact Cards */}
          {detectedArtifacts.length > 0 && (
            <div className="my-3 space-y-2">
              {detectedArtifacts.map((art) => (
                <div
                  key={art.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-nova-500/30 bg-nova-500/5 hover:bg-nova-500/10 transition-colors shadow-subtle group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-nova-500 text-white">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[var(--foreground)]">
                          {art.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-muted)] font-mono">
                          {art.type.split("/").pop()}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Interactive workspace artifact ready
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenArtifact && onOpenArtifact(art)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nova-500 text-white text-xs font-medium hover:bg-nova-600 transition shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open in Workspace</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Human Confirmation Gate Card */}
          {message.content.includes("Action Requires Human Confirmation") && (
            <div className="my-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground)]">Human Approval Checkpoint</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Confirmation required before dispatching external communication.</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/assistant/email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "authorize_send", emailId: "email-1" }),
                    });
                    const d = await res.json();
                    alert(d.message || "Email authorized and dispatched successfully.");
                  } catch {
                    alert("Authorization recorded.");
                  }
                }}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0 transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Authorize & Send</span>
              </button>
            </div>
          )}

          {/* Citations Section */}
          {message.citations && message.citations.length > 0 && (
            <div className="pt-2 border-t border-[var(--border)]/50 mt-3">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider block mb-1.5">
                Sources & Citations
              </span>
              <div className="flex flex-wrap gap-1.5">
                {message.citations.map((citation) => (
                  <CitationPill key={citation.id} citation={citation} />
                ))}
              </div>
            </div>
          )}

          {/* Message Bottom Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 pt-1 opacity-80 group-hover:opacity-100 transition-opacity text-[var(--text-muted)]">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)] transition"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {isUser && onEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)] transition"
                title="Edit message"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {!isUser && onRegenerate && !isStreaming && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)] transition"
                title="Regenerate response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {!isUser && onFeedback && (
              <>
                <button
                  onClick={() => onFeedback("positive")}
                  className={`p-1 rounded hover:bg-[var(--surface-subtle)] transition ${
                    message.feedback === "positive" ? "text-emerald-500" : "hover:text-[var(--foreground)]"
                  }`}
                  title="Helpful"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onFeedback("negative")}
                  className={`p-1 rounded hover:bg-[var(--surface-subtle)] transition ${
                    message.feedback === "negative" ? "text-rose-500" : "hover:text-[var(--foreground)]"
                  }`}
                  title="Not helpful"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
