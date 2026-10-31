"use client";

import React, { useState } from "react";
import {
  SearchCode,
  Sparkles,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Layers,
  FileText,
  Printer,
} from "lucide-react";
import { DeepResearchReport } from "@/lib/research/research-engine";

export const DeepResearchWorkspace: React.FC = () => {
  const [topic, setTopic] = useState("Quantum Computing & Post-Quantum Cryptography Migration Roadmaps");
  const [isResearching, setIsResearching] = useState(false);
  const [report, setReport] = useState<DeepResearchReport | null>(null);

  const handleStartResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsResearching(true);
    try {
      const res = await fetch("/api/research/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } finally {
      setIsResearching(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!report) return;
    const md = `# Deep Research Dossier: ${report.topic}
*Generated on ${new Date(report.generatedAt).toLocaleString()} by NOVA AI Deep Research Engine*

## Executive Summary
${report.executiveSummary}

## Key Findings
${report.keyFindings.map((f) => `### ${f.title}\n${f.explanation}\n`).join("\n")}

## Cross-Source Comparison
${report.crossSourceComparison
  .map(
    (c) =>
      `### ${c.theme}\n- **Source A**: ${c.sourceAView}\n- **Source B**: ${c.sourceBView}\n- **Consensus**: ${c.consensusAnalysis}\n`
  )
  .join("\n")}

## Verified Sources
${report.sources.map((s) => `- [${s.title}](${s.url}) (${s.publisher})`).join("\n")}
`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `research_report_${report.topic.slice(0, 20).replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <SearchCode className="w-6 h-6 text-emerald-500" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Deep Research Engine
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold uppercase tracking-wider">
              Autonomous Synthesis
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Formulate multi-angle hypotheses, extract primary institutional citations, and construct cross-source consensus dossiers.
          </p>
        </div>
      </div>

      {/* Query Form */}
      <form onSubmit={handleStartResearch} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle space-y-3">
        <label className="font-semibold text-xs text-[var(--foreground)] block">
          Enter Research Subject, Technology, or Market Competitor:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Impact of AI Agent protocols on Enterprise SaaS business models..."
            className="flex-1 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={isResearching}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
          >
            {isResearching ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Conduct Research</span>
          </button>
        </div>
      </form>

      {/* Report View */}
      {report && (
        <div className="space-y-6 animate-fadeIn">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">
              Execution Duration: {(report.durationMs / 1000).toFixed(1)}s • {report.sources.length} sources evaluated
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-xs text-[var(--foreground)] transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
              <button
                onClick={handleExportMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Dossier (.md)</span>
              </button>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 shadow-subtle space-y-2">
            <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-400">
              Executive Synthesis
            </h3>
            <p className="text-xs md:text-sm text-[var(--foreground)] leading-relaxed">
              {report.executiveSummary}
            </p>
          </div>

          {/* Key Findings */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Verified Key Findings</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.keyFindings.map((finding, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2 shadow-subtle"
                >
                  <h4 className="font-semibold text-xs text-[var(--foreground)]">
                    {finding.title}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {finding.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-Source Comparison Matrix */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>Cross-Source Comparison & Evidence Consensus</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border)]">
                  <tr>
                    <th className="p-3 font-semibold">Theme</th>
                    <th className="p-3 font-semibold">Source Perspective A</th>
                    <th className="p-3 font-semibold">Source Perspective B</th>
                    <th className="p-3 font-semibold">Consensus Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {report.crossSourceComparison.map((comp, i) => (
                    <tr key={i} className="hover:bg-[var(--surface-subtle)]/40 transition">
                      <td className="p-3 font-medium text-[var(--foreground)]">{comp.theme}</td>
                      <td className="p-3 text-[var(--text-muted)]">{comp.sourceAView}</td>
                      <td className="p-3 text-[var(--text-muted)]">{comp.sourceBView}</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">
                        {comp.consensusAnalysis}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sources & Citations */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Primary Evidence Sources</span>
            </h3>
            <div className="space-y-2">
              {report.sources.map((src) => (
                <div
                  key={src.id}
                  className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between"
                >
                  <div className="truncate mr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs truncate">{src.title}</span>
                      {src.isPrimarySource && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                          Primary
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] truncate block mt-0.5">
                      {src.snippet}
                    </span>
                  </div>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:underline shrink-0"
                  >
                    <span>{src.publisher}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
