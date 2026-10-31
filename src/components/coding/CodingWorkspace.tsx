"use client";

import React, { useState } from "react";
import {
  Terminal as TerminalIcon,
  Play,
  Copy,
  Check,
  Download,
  Code2,
  Database,
  Eye,
  FileCode,
  Sparkles,
} from "lucide-react";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  success: boolean;
  truncated: boolean;
}

interface CodeFile {
  name: string;
  language: "javascript" | "python" | "sql";
  content: string;
}

const INITIAL_FILES: CodeFile[] = [
  {
    name: "script.js",
    language: "javascript",
    content: `// Statistical Analysis & Algorithmic Calculation
function calculateCompoundGrowth(principal, annualRate, years) {
  let balance = principal;
  const history = [];
  
  for (let y = 1; y <= years; y++) {
    balance += balance * annualRate;
    history.push({ year: y, balance: Math.round(balance) });
  }
  return { finalBalance: Math.round(balance), history };
}

const result = calculateCompoundGrowth(100000, 0.12, 10);
console.log("=== COMPOUND GROWTH SIMULATION (10 Years @ 12%) ===");
console.log("Initial Principal: ₹1,00,000");
console.log("Final Capital: ₹" + result.finalBalance.toLocaleString());
console.log("Growth Multiple: " + (result.finalBalance / 100000).toFixed(2) + "x");
`,
  },
  {
    name: "schema.sql",
    language: "sql",
    content: `-- Enterprise Multi-Tenant Schema with RLS
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  tokens_used BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for agents" ON public.agent_executions
  FOR ALL USING (tenant_id = auth.uid());
`,
  },
];

export const CodingWorkspace: React.FC = () => {
  const [files, setFiles] = useState<CodeFile[]>(INITIAL_FILES);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<ExecutionResult | null>(null);
  const [activeView, setActiveView] = useState<"code" | "schema" | "preview">("code");
  const [copied, setCopied] = useState(false);

  const currentFile = files[activeFileIndex];

  const handleUpdateContent = (text: string) => {
    const updated = [...files];
    updated[activeFileIndex].content = text;
    setFiles(updated);
  };

  const handleRunCode = async () => {
    setIsExecuting(true);
    try {
      const res = await fetch("/api/tools/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "execute_code",
          input: {
            language: currentFile.language === "python" ? "python" : "javascript",
            code: currentFile.content,
          },
        }),
      });
      const data = await res.json();
      if (data.result) {
        setTerminalOutput(data.result);
      } else if (data.error) {
        setTerminalOutput({
          stdout: "",
          stderr: data.error,
          executionTimeMs: 0,
          success: false,
          truncated: false,
        });
      }
    } catch (err: any) {
      setTerminalOutput({
        stdout: "",
        stderr: err.message || "Failed to execute code in sandbox.",
        executionTimeMs: 0,
        success: false,
        truncated: false,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--background)]">
      {/* Top Bar */}
      <div className="h-12 border-b border-[var(--border)] bg-[var(--surface)] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {/* File Tabs */}
          {files.map((file, idx) => (
            <button
              key={file.name}
              onClick={() => setActiveFileIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                activeFileIndex === idx
                  ? "bg-nova-500/10 text-nova-500 font-semibold border border-nova-500/20"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{file.name}</span>
            </button>
          ))}
        </div>

        {/* View & Action Controls */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-0.5">
            <button
              onClick={() => setActiveView("code")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                activeView === "code" ? "bg-[var(--surface)] text-[var(--foreground)] shadow-subtle" : "text-[var(--text-muted)]"
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveView("schema")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                activeView === "schema" ? "bg-[var(--surface)] text-[var(--foreground)] shadow-subtle" : "text-[var(--text-muted)]"
              }`}
            >
              Schema Gen
            </button>
          </div>

          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleRunCode}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 transition shadow-sm disabled:opacity-50"
          >
            <Play className={`w-3 h-3 fill-current ${isExecuting ? "animate-pulse" : ""}`} />
            <span>{isExecuting ? "Running..." : "Run Sandbox"}</span>
          </button>
        </div>
      </div>

      {/* Editor & Terminal Split */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Editor Pane */}
        <div className="flex-1 p-4 flex flex-col min-h-0 bg-[var(--surface)]">
          <textarea
            value={currentFile.content}
            onChange={(e) => handleUpdateContent(e.target.value)}
            className="w-full flex-1 p-4 rounded-xl border border-[var(--border)] bg-[#1e1e1e] text-white font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-nova-500"
            spellCheck={false}
          />
        </div>

        {/* Terminal Sandbox Pane */}
        <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col shrink-0">
          <div className="h-10 border-b border-[var(--border)] px-4 flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] bg-[var(--surface)]">
            <div className="flex items-center gap-1.5">
              <TerminalIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>Sandboxed Execution Terminal</span>
            </div>
            {terminalOutput && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {terminalOutput.executionTimeMs}ms
              </span>
            )}
          </div>

          <div className="flex-1 p-3 font-mono text-xs overflow-y-auto bg-[#141413] text-neutral-300">
            {terminalOutput ? (
              <div className="space-y-2">
                {terminalOutput.stdout && (
                  <pre className="text-emerald-400 whitespace-pre-wrap">{terminalOutput.stdout}</pre>
                )}
                {terminalOutput.stderr && (
                  <pre className="text-rose-400 whitespace-pre-wrap">{terminalOutput.stderr}</pre>
                )}
                <div className="text-[10px] text-neutral-500 pt-2 border-t border-neutral-800">
                  Process completed with exit code: {terminalOutput.success ? 0 : 1}
                </div>
              </div>
            ) : (
              <div className="text-neutral-500 py-12 text-center text-xs">
                Click &ldquo;Run Sandbox&rdquo; to execute code safely in isolated environment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
