"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Search,
  Cpu,
  Wrench,
  Layers,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Brain,
  Code2,
  FileCode,
  Sparkles,
} from "lucide-react";
import { CLAUDE_MODEL_CATALOGUE } from "@/lib/anthropic/models/model-registry";
import { ANTHROPIC_SERVER_TOOLS } from "@/lib/anthropic/tools/server-tools";
import { ANTHROPIC_CLIENT_TOOLS } from "@/lib/anthropic/tools/client-tools";
import { validateModelAndToolsCompatibility } from "@/lib/anthropic/tools/tool-compatibility";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Interactive Compatibility Checker State
  const [testModel, setTestModel] = useState(CLAUDE_MODEL_CATALOGUE[0].id);
  const [testTool, setTestTool] = useState(ANTHROPIC_SERVER_TOOLS[0].name);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const compatResult = validateModelAndToolsCompatibility(testModel, [testTool]);

  const filteredModels = CLAUDE_MODEL_CATALOGUE.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServerTools = ANTHROPIC_SERVER_TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClientTools = ANTHROPIC_CLIENT_TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-[var(--border)] bg-[var(--surface-subtle)]/40 flex flex-col shrink-0 select-none hidden md:flex">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)] hover:text-nova-500 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Chat</span>
          </Link>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-nova-500/10 text-nova-500 font-medium">
            Docs v1.0
          </span>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter models & tools..."
              className="w-full bg-transparent text-xs text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none"
            />
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 text-xs">
          <NavItem
            active={activeSection === "overview"}
            onClick={() => setActiveSection("overview")}
            icon={<BookOpen className="w-3.5 h-3.5" />}
            label="Overview & Architecture"
          />
          <NavItem
            active={activeSection === "models"}
            onClick={() => setActiveSection("models")}
            icon={<Cpu className="w-3.5 h-3.5" />}
            label="Claude Models"
          />
          <NavItem
            active={activeSection === "comparison"}
            onClick={() => setActiveSection("comparison")}
            icon={<Layers className="w-3.5 h-3.5" />}
            label="Model Comparison"
          />
          <NavItem
            active={activeSection === "server-tools"}
            onClick={() => setActiveSection("server-tools")}
            icon={<Zap className="w-3.5 h-3.5" />}
            label="Anthropic Server Tools"
          />
          <NavItem
            active={activeSection === "client-tools"}
            onClick={() => setActiveSection("client-tools")}
            icon={<Wrench className="w-3.5 h-3.5" />}
            label="Anthropic Client Tools"
          />
          <NavItem
            active={activeSection === "versions"}
            onClick={() => setActiveSection("versions")}
            icon={<FileCode className="w-3.5 h-3.5" />}
            label="Tool Version History"
          />
          <NavItem
            active={activeSection === "compatibility"}
            onClick={() => setActiveSection("compatibility")}
            icon={<Shield className="w-3.5 h-3.5" />}
            label="Compatibility Engine"
          />
          <NavItem
            active={activeSection === "features"}
            onClick={() => setActiveSection("features")}
            icon={<Brain className="w-3.5 h-3.5" />}
            label="Advanced API Features"
          />
          <NavItem
            active={activeSection === "examples"}
            onClick={() => setActiveSection("examples")}
            icon={<Code2 className="w-3.5 h-3.5" />}
            label="API Code Examples"
          />
          <NavItem
            active={activeSection === "errors"}
            onClick={() => setActiveSection("errors")}
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            label="Errors & Diagnostics"
          />
          <NavItem
            active={activeSection === "references"}
            onClick={() => setActiveSection("references")}
            icon={<ExternalLink className="w-3.5 h-3.5" />}
            label="Official References"
          />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 max-w-5xl mx-auto">
        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between pb-4 border-b border-[var(--border)]">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-nova-500"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Chat</span>
          </Link>
          <span className="font-semibold text-xs">Anthropic Models & Tools Docs</span>
        </div>

        {/* 1. OVERVIEW SECTION */}
        {(activeSection === "overview" || searchQuery) && (
          <section id="overview" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-nova-500/10 text-nova-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                  Anthropic Claude Models & Tools Reference
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Verified Technical Specifications & Architecture Guide (Updated October 2026)
                </p>
              </div>
            </div>

            <p className="text-xs md:text-sm text-[var(--text-muted)] leading-relaxed">
              This documentation system provides an authoritative, dynamically maintainable technical reference for official Anthropic Claude models and server/client tools. It outlines the exact API specifications, input/output schemas, beta headers, and compatibility rules required to run production agent systems.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase font-semibold">
                  Active Models
                </span>
                <span className="text-2xl font-bold text-[var(--foreground)]">
                  {CLAUDE_MODEL_CATALOGUE.length}
                </span>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Sonnet, Opus, Haiku & Fable
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase font-semibold">
                  Server Tools
                </span>
                <span className="text-2xl font-bold text-nova-500">
                  {ANTHROPIC_SERVER_TOOLS.length}
                </span>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Cloud-managed search, fetch, sandbox
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase font-semibold">
                  Client Tools
                </span>
                <span className="text-2xl font-bold text-blue-500">
                  {ANTHROPIC_CLIENT_TOOLS.length}
                </span>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Memory, Bash, Text Editor, Computer Use
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 2. CLAUDE MODELS SECTION */}
        {(activeSection === "models" || searchQuery) && (
          <section id="models" className="space-y-4 pt-6 border-t border-[var(--border)]">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-nova-500" />
              <span>Complete Claude Model Catalogue</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredModels.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{m.name}</h3>
                        {m.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-nova-500/10 text-nova-500 font-medium">
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <code className="text-[11px] text-[var(--text-muted)] font-mono">
                        {m.id}
                      </code>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border)] font-medium capitalize">
                      {m.family}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {m.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[var(--border)]/50">
                    <div>
                      <span className="text-[var(--text-muted)] block">Context Window:</span>
                      <span className="font-semibold">
                        {m.contextWindow.toLocaleString()} tokens
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block">Max Output:</span>
                      <span className="font-semibold">
                        {m.maxOutputTokens.toLocaleString()} tokens
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block">Extended Thinking:</span>
                      <span className="font-semibold">
                        {m.supportsThinking ? "Yes (Hybrid)" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block">Pricing (In/Out per 1M):</span>
                      <span className="font-semibold">
                        ${m.inputCostPer1M} / ${m.outputCostPer1M}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. MODEL COMPARISON TABLE */}
        {(activeSection === "comparison" || searchQuery) && (
          <section id="comparison" className="space-y-4 pt-6 border-t border-[var(--border)]">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-nova-500" />
              <span>Model Comparison Matrix</span>
            </h2>
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border)]">
                  <tr>
                    <th className="p-3 font-semibold">Model Name</th>
                    <th className="p-3 font-semibold">Family</th>
                    <th className="p-3 font-semibold">Context</th>
                    <th className="p-3 font-semibold">Max Output</th>
                    <th className="p-3 font-semibold">Thinking</th>
                    <th className="p-3 font-semibold">Vision</th>
                    <th className="p-3 font-semibold">Computer Use</th>
                    <th className="p-3 font-semibold">Price (1M Tokens)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {CLAUDE_MODEL_CATALOGUE.map((m) => (
                    <tr key={m.id} className="hover:bg-[var(--surface-subtle)]/50 transition">
                      <td className="p-3 font-medium">
                        <div>{m.name}</div>
                        <code className="text-[10px] text-[var(--text-muted)] font-mono">
                          {m.id}
                        </code>
                      </td>
                      <td className="p-3 capitalize">{m.family}</td>
                      <td className="p-3">{m.contextWindow.toLocaleString()}</td>
                      <td className="p-3">{m.maxOutputTokens.toLocaleString()}</td>
                      <td className="p-3">
                        {m.supportsThinking ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-40" />
                        )}
                      </td>
                      <td className="p-3">
                        {m.supportsVision ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-40" />
                        )}
                      </td>
                      <td className="p-3">
                        {m.supportsComputerUse ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-40" />
                        )}
                      </td>
                      <td className="p-3 font-mono">
                        ${m.inputCostPer1M} / ${m.outputCostPer1M}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 4. SERVER TOOLS */}
        {(activeSection === "server-tools" || searchQuery) && (
          <section id="server-tools" className="space-y-4 pt-6 border-t border-[var(--border)]">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-nova-500" />
              <span>Anthropic Server Tools</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Managed and executed directly on Anthropic cloud infrastructure. Responses are returned with citations and encrypted state blocks.
            </p>
            <div className="space-y-4">
              {filteredServerTools.map((t) => (
                <div
                  key={t.name}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{t.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-nova-500/10 text-nova-500 font-mono">
                        {t.defaultVersion}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-muted)]">
                      {t.executionEnvironment}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {t.description}
                  </p>

                  <div className="text-[11px] bg-[var(--surface-subtle)] p-3 rounded-lg border border-[var(--border)] font-mono overflow-x-auto">
                    <span className="text-[var(--text-muted)] block mb-1 font-semibold">
                      Input Schema:
                    </span>
                    <pre>{JSON.stringify(t.inputSchema, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. CLIENT TOOLS */}
        {(activeSection === "client-tools" || searchQuery) && (
          <section id="client-tools" className="space-y-4 pt-6 border-t border-[var(--border)]">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Wrench className="w-4 h-4 text-nova-500" />
              <span>Anthropic Client Tools</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Defined through the Messages API tool-use interface, but executed by your application in a local or host sandbox.
            </p>
            <div className="space-y-4">
              {filteredClientTools.map((t) => (
                <div
                  key={t.name}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{t.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono">
                        {t.defaultVersion}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-muted)]">
                      {t.executionEnvironment}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {t.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]">
                      <span className="font-semibold block mb-1">What Claude Does:</span>
                      <p className="text-[var(--text-muted)] text-[11px]">{t.whatClaudeDoes}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]">
                      <span className="font-semibold block mb-1">What Your App Implements:</span>
                      <p className="text-[var(--text-muted)] text-[11px]">{t.whatAppImplements}</p>
                    </div>
                  </div>

                  <div className="text-[11px] bg-[var(--surface-subtle)] p-3 rounded-lg border border-[var(--border)] font-mono overflow-x-auto">
                    <span className="text-[var(--text-muted)] block mb-1 font-semibold">
                      Tool Schema:
                    </span>
                    <pre>{JSON.stringify(t.inputSchema, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. INTERACTIVE COMPATIBILITY ENGINE */}
        {(activeSection === "compatibility" || searchQuery) && (
          <section id="compatibility" className="space-y-4 pt-6 border-t border-[var(--border)]">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-nova-500" />
              <span>Interactive Model & Tool Compatibility Checker</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Validate whether a chosen model supports a specific tool and identify required beta headers.
            </p>

            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-xs block mb-1.5">Select Model:</label>
                  <select
                    value={testModel}
                    onChange={(e) => setTestModel(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-xs font-mono"
                  >
                    {CLAUDE_MODEL_CATALOGUE.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-xs block mb-1.5">Select Tool:</label>
                  <select
                    value={testTool}
                    onChange={(e) => setTestTool(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-xs font-mono"
                  >
                    <optgroup label="Server Tools">
                      {ANTHROPIC_SERVER_TOOLS.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name} ({t.defaultVersion})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Client Tools">
                      {ANTHROPIC_CLIENT_TOOLS.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name} ({t.defaultVersion})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Result Pill */}
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                  compatResult.isCompatible
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  {compatResult.isCompatible ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>
                    {compatResult.isCompatible
                      ? "Compatible combination! Ready for execution."
                      : compatResult.incompatibleReasons.join(" ")}
                  </span>
                </div>

                {compatResult.requiredBetaHeaders.length > 0 && (
                  <div className="text-[10px] font-mono px-2 py-1 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]">
                    Header: anthropic-beta: {compatResult.requiredBetaHeaders.join(", ")}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 7. API EXAMPLES */}
        {(activeSection === "examples" || searchQuery) && (
          <section id="examples" className="space-y-4 pt-6 border-t border-[var(--border)]">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Code2 className="w-4 h-4 text-nova-500" />
              <span>Production API Code Examples</span>
            </h2>

            <div className="space-y-4">
              <CodeSnippetCard
                title="Streaming with Extended Thinking (TypeScript)"
                language="typescript"
                code={`import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const stream = await client.messages.create({
  model: "claude-3-7-sonnet-20250219",
  max_tokens: 16000,
  thinking: {
    type: "enabled",
    budget_tokens: 2048,
  },
  messages: [{ role: "user", content: "Optimize this algorithm..." }],
  stream: true,
});

for await (const chunk of stream) {
  if (chunk.type === "content_block_delta" && chunk.delta.type === "thinking_delta") {
    process.stdout.write(chunk.delta.thinking);
  } else if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
    process.stdout.write(chunk.delta.text);
  }
}`}
                copied={copiedCode === "stream-thinking"}
                onCopy={() =>
                  copyToClipboard(
                    `import Anthropic from "@anthropic-ai/sdk";\n...`,
                    "stream-thinking"
                  )
                }
              />

              <CodeSnippetCard
                title="Invoking Server Tools with Beta Headers (cURL)"
                language="bash"
                code={`curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "anthropic-beta: web-search-2025-03-05,code-execution-2025-08-25" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-3-7-sonnet-20250219",
    "max_tokens": 8192,
    "tools": [
      { "type": "web_search_20250305", "name": "web_search" },
      { "type": "code_execution_20250825", "name": "code_execution" }
    ],
    "messages": [{ "role": "user", "content": "Analyze recent inflation figures in Python" }]
  }'`}
                copied={copiedCode === "server-tools-curl"}
                onCopy={() =>
                  copyToClipboard(
                    `curl https://api.anthropic.com/v1/messages ...`,
                    "server-tools-curl"
                  )
                }
              />
            </div>
          </section>
        )}

        {/* 8. OFFICIAL REFERENCES */}
        <section id="references" className="space-y-4 pt-6 border-t border-[var(--border)] pb-12">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-nova-500" />
            <span>Official Anthropic Documentation Sources</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <a
              href="https://platform.claude.com/docs/en/about-claude/models/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-nova-500/50 transition group flex items-center justify-between"
            >
              <span>Models Overview & Specifications</span>
              <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-nova-500" />
            </a>
            <a
              href="https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-nova-500/50 transition group flex items-center justify-between"
            >
              <span>Tool Use & Agent Guide</span>
              <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-nova-500" />
            </a>
            <a
              href="https://platform.claude.com/docs/en/api/messages"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-nova-500/50 transition group flex items-center justify-between"
            >
              <span>Messages API Reference</span>
              <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-nova-500" />
            </a>
            <a
              href="https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-reference"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-nova-500/50 transition group flex items-center justify-between"
            >
              <span>Tool Reference & Schemas</span>
              <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-nova-500" />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

function NavItem({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition text-left ${
        active
          ? "bg-[var(--surface)] text-nova-500 shadow-subtle border border-[var(--border)]"
          : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function CodeSnippetCard({
  title,
  language,
  code,
  copied,
  onCopy,
}: {
  title: string;
  language: string;
  code: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[#1e1e1e] text-white text-xs overflow-hidden shadow-subtle">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#252526] border-b border-neutral-800 text-neutral-400 font-mono text-[11px]">
        <span>{title}</span>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 hover:text-white transition"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
