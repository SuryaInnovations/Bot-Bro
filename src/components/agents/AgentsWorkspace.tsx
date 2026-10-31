"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Shield,
  Layers,
  ArrowRight,
  UserCheck,
  Sparkles,
  RefreshCw,
  Plus,
  XCircle,
  Copy,
  Download,
  Code2,
  FileText,
  Search,
  MessageSquare,
  DollarSign,
  Cpu,
  History,
  Sliders,
  ExternalLink,
} from "lucide-react";
import {
  AgentConfig,
  AgentMessage,
  AgentRole,
  AgentSessionPlan,
  AgentTaskStep,
  AgentToolName,
} from "@/lib/agents/agent-types";
import {
  AGENT_TEAM_TEMPLATES,
  DEFAULT_AGENT_ROSTER,
} from "@/lib/agents/agent-templates";

export const AgentsWorkspace: React.FC = () => {
  // Preset Templates & Selected Mission
  const [selectedTemplateId, setSelectedTemplateId] = useState("company-intelligence-squad");
  const [goal, setGoal] = useState(
    "Research Anthropic: business model, Claude 3.7 dynamic hybrid reasoning capabilities, institutional partnerships, and competitive landscape against OpenAI."
  );

  // Active Session & Execution States
  const [session, setSession] = useState<AgentSessionPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // View Tabs for Mission Inspection
  const [inspectTab, setInspectTab] = useState<"steps" | "messages" | "blackboard" | "deliverable">("steps");

  // Custom Agent Creation Modal State
  const [showCustomAgentModal, setShowCustomAgentModal] = useState(false);
  const [customAgentsList, setCustomAgentsList] = useState<AgentConfig[]>([]);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentRole, setNewAgentRole] = useState<AgentRole>("analyst");
  const [newAgentPrompt, setNewAgentPrompt] = useState("");
  const [newAgentTools, setNewAgentTools] = useState<AgentToolName[]>(["data_analysis"]);
  const [newAgentRequiresApproval, setNewAgentRequiresApproval] = useState(false);

  // Execution History
  const [historySessions, setHistorySessions] = useState<AgentSessionPlan[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nova_agent_history");
      if (saved) {
        setHistorySessions(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveSessionToHistory = (s: AgentSessionPlan) => {
    try {
      const updated = [s, ...historySessions.filter((h) => h.sessionId !== s.sessionId)].slice(0, 10);
      setHistorySessions(updated);
      localStorage.setItem("nova_agent_history", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const currentTemplate =
    AGENT_TEAM_TEMPLATES.find((t) => t.id === selectedTemplateId) || AGENT_TEAM_TEMPLATES[0];

  // Quick Mission Starters
  const handleSelectQuickMission = (templateId: string, recommendedGoal: string) => {
    setSelectedTemplateId(templateId);
    setGoal(recommendedGoal);
  };

  // 1. Start Session & Run Autonomously
  const handleDeployTeam = async (runAutonomously = true) => {
    if (!goal.trim()) return;

    setIsProcessing(true);
    try {
      const activeTeam = customAgentsList.length > 0 ? customAgentsList : undefined;
      const createRes = await fetch("/api/agents/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          goal: goal.trim(),
          templateId: selectedTemplateId,
          customAgents: activeTeam,
        }),
      });

      const createData = await createRes.json();
      const newSession: AgentSessionPlan = createData.session;
      if (!newSession) return;
      setSession(newSession);

      if (runAutonomously) {
        // Run until completed or paused for approval
        const runRes = await fetch("/api/agents/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "run_all", session: newSession }),
        });
        const runData = await runRes.json();
        const updated = runData.session;
        if (updated) {
          setSession({ ...updated });
          saveSessionToHistory(updated);
          if (updated.status === "paused_approval") {
            setShowApprovalModal(true);
          }
        }
      } else {
        // Execute just first step
        const stepRes = await fetch("/api/agents/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "step", session: newSession, approved: false }),
        });
        const stepData = await stepRes.json();
        const updated = stepData.session;
        if (updated) {
          setSession({ ...updated });
          saveSessionToHistory(updated);
          if (updated.status === "paused_approval") {
            setShowApprovalModal(true);
          }
        }
      }
    } catch (e) {
      console.warn("Deploy error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Continue Step or Pipeline
  const handleContinueNextStep = async (approved = false) => {
    if (!session) return;
    setIsProcessing(true);
    setShowApprovalModal(false);

    try {
      const res = await fetch("/api/agents/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "step", session, approved }),
      });
      const data = await res.json();
      const updated: AgentSessionPlan = data.session;
      if (updated) {
        setSession({ ...updated });
        saveSessionToHistory(updated);
        if (updated.status === "paused_approval") {
          setShowApprovalModal(true);
        }
      }
    } catch (e) {
      console.warn("Step error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Cancel Running Task
  const handleCancelTask = async () => {
    if (!session) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/agents/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", session }),
      });
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
        saveSessionToHistory(data.session);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Create Custom Agent
  const handleCreateCustomAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;

    const customAgent: AgentConfig = {
      id: `custom-agent-${Date.now()}`,
      name: newAgentName.trim(),
      role: newAgentRole,
      title: `Custom ${newAgentRole.toUpperCase()} Specialist`,
      avatarColor:
        newAgentRole === "coder"
          ? "#7C3AED"
          : newAgentRole === "researcher"
          ? "#2563EB"
          : newAgentRole === "verifier"
          ? "#DC2626"
          : newAgentRole === "analyst"
          ? "#059669"
          : "#CC5A36",
      systemPrompt: newAgentPrompt.trim() || `Specialized autonomous agent for ${newAgentRole} tasks.`,
      preferredModel: "claude-3-7-sonnet-20250219",
      allowedTools: newAgentTools,
      permissions: {
        allowNetwork: newAgentTools.includes("web_search"),
        allowCodeExecution: newAgentTools.includes("code_execution"),
        allowFileSystem: false,
        requireApprovalForTools: newAgentRequiresApproval,
        maxExecutionTimeoutSec: 30,
      },
      maxIterations: 4,
      temperature: 0.2,
      requiresHumanApproval: newAgentRequiresApproval,
      isCustom: true,
    };

    setCustomAgentsList([...customAgentsList, customAgent]);
    setShowCustomAgentModal(false);
    setNewAgentName("");
    setNewAgentPrompt("");
  };

  // 5. Copy & Download Deliverable
  const handleCopyDeliverable = () => {
    if (!session?.finalResult) return;
    navigator.clipboard.writeText(session.finalResult);
  };

  const handleDownloadDeliverable = () => {
    if (!session?.finalResult) return;
    const blob = new Blob([session.finalResult], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nova-agent-deliverable-${session.sessionId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* 1. TOP HEADER & TELEMETRY */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple-500" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Autonomous Multi-Agent System 2.0
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold uppercase tracking-wider">
              Swarm Orchestration
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            7 specialized agent roles with dynamic task decomposition, inter-agent messaging, shared blackboard context, and zero-trust human checkpoints.
          </p>
        </div>

        {/* Telemetry Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {session && (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <Cpu className="w-3.5 h-3.5 text-purple-500" />
                <span>
                  Tokens:{" "}
                  <strong>
                    {(session.costEstimate.inputTokens + session.costEstimate.outputTokens).toLocaleString()}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  Cost: <strong>${session.costEstimate.estimatedCostUsd}</strong>
                </span>
              </div>
            </>
          )}

          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-subtle)] transition text-[var(--foreground)]"
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({historySessions.length})</span>
          </button>
        </div>
      </div>

      {/* 2. ADVANCED MISSION STARTERS (7 REQUESTED CAPABILITIES) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <span>Preset Autonomous Missions:</span>
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {AGENT_TEAM_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => handleSelectQuickMission(tmpl.id, tmpl.recommendedGoal)}
              className={`px-3 py-2 rounded-xl text-left border transition whitespace-nowrap ${
                selectedTemplateId === tmpl.id
                  ? "border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tmpl.name.split(" ")[0]} {tmpl.name.split(" ")[1]}
            </button>
          ))}
        </div>
      </div>

      {/* 3. GOAL INPUT & DEPLOY FORM */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-xs text-[var(--foreground)]">
            Define Autonomous Mission / Goal:
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">
            Team: <strong className="text-purple-500">{currentTemplate.name}</strong>
          </span>
        </div>

        <textarea
          rows={3}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Describe the autonomous objective (e.g. Research Anthropic, Build a website, Debug codebase, Compare models)..."
          className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-purple-500 leading-relaxed resize-none"
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Active Agents Badge List */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {currentTemplate.agents.map((ag) => (
              <span
                key={ag.id}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ag.avatarColor }} />
                <span>{ag.name.split(" ")[0]}</span>
                <span className="text-[9px] text-[var(--text-muted)] font-mono uppercase">
                  ({ag.role})
                </span>
              </span>
            ))}
            <button
              onClick={() => setShowCustomAgentModal(true)}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-dashed border-purple-500/50 text-purple-500 hover:bg-purple-500/10 transition"
            >
              <Plus className="w-3 h-3" />
              <span>Add Custom Agent</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {session && session.status === "running" && (
              <button
                type="button"
                onClick={handleCancelTask}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 transition text-xs font-semibold"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleDeployTeam(false)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--surface)] transition text-xs font-medium text-[var(--foreground)] disabled:opacity-50"
            >
              <span>Step-by-Step</span>
            </button>

            <button
              type="button"
              onClick={() => handleDeployTeam(true)}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition disabled:opacity-50 shadow-sm"
            >
              {isProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Deploy & Run Swarm</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. ACTIVE SESSION VIEW */}
      {session && (
        <div className="space-y-4 animate-fadeIn">
          {/* Status Header & Sub-Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-subtle">
            <div className="flex items-center gap-3">
              <span
                className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                  session.status === "completed"
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : session.status === "paused_approval"
                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                    : session.status === "cancelled"
                    ? "bg-zinc-500/10 text-zinc-600 border border-zinc-500/20"
                    : "bg-purple-500/10 text-purple-600 border border-purple-500/20 animate-pulseSubtle"
                }`}
              >
                ● {session.status.replace("_", " ")}
              </span>

              <span className="text-xs text-[var(--text-muted)]">
                Stage {Math.min(session.currentStepIndex + 1, session.steps.length)} of {session.steps.length}
              </span>
            </div>

            {/* View Sub-Tabs */}
            <div className="flex items-center gap-1 text-xs">
              {[
                { id: "steps", label: "Task DAG Steps", icon: Layers },
                { id: "messages", label: "Inter-Agent Feed", icon: MessageSquare },
                { id: "blackboard", label: "Shared Context", icon: Code2 },
                { id: "deliverable", label: "Final Deliverable", icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setInspectTab(tab.id as any)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                      inspectTab === tab.id
                        ? "bg-purple-600 text-white font-medium"
                        : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              {session.status !== "completed" && session.status !== "cancelled" && (
                <button
                  onClick={() => handleContinueNextStep()}
                  disabled={isProcessing}
                  className="ml-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition flex items-center gap-1 shadow-sm"
                >
                  <ArrowRight className="w-3 h-3" />
                  <span>Next Step</span>
                </button>
              )}
            </div>
          </div>

          {/* SUB-VIEW 1: TASK DAG STEPS */}
          {inspectTab === "steps" && (
            <div className="space-y-3">
              {session.steps.map((step, idx) => (
                <div
                  key={step.stepId}
                  className={`p-4 rounded-xl border transition ${
                    step.status === "completed"
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : step.status === "running"
                      ? "border-purple-500 bg-purple-500/5 shadow-subtle"
                      : step.status === "waiting_approval"
                      ? "border-amber-500 bg-amber-500/5 shadow-subtle"
                      : "border-[var(--border)] bg-[var(--surface)] opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-xs text-[var(--foreground)]">
                        {step.assignedAgentName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] font-mono uppercase">
                        {step.assignedRole}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                      {step.status === "completed" && (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed ({step.durationMs}ms)</span>
                        </span>
                      )}
                      {step.status === "running" && (
                        <span className="flex items-center gap-1 text-purple-600 font-semibold animate-pulseSubtle">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Executing Stage...</span>
                        </span>
                      )}
                      {step.status === "waiting_approval" && (
                        <span className="flex items-center gap-1 text-amber-600 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Human Checkpoint Required</span>
                        </span>
                      )}
                      {step.status === "pending" && (
                        <span className="text-[var(--text-muted)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Queued</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--foreground)] mb-2 font-medium">
                    {step.instruction}
                  </p>

                  {/* Tool Call Badges */}
                  {step.toolCalls && step.toolCalls.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10px] text-[var(--text-muted)]">Tools Used:</span>
                      {step.toolCalls.map((tc, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-mono"
                        >
                          {tc.tool}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Output Preview */}
                  {step.outputData && (
                    <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[11px] font-mono text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {typeof step.outputData === "object"
                        ? JSON.stringify(step.outputData, null, 2)
                        : String(step.outputData)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* SUB-VIEW 2: INTER-AGENT MESSAGING FEED */}
          {inspectTab === "messages" && (
            <div className="space-y-3 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-xs font-bold text-[var(--foreground)] block mb-1">
                Inter-Agent Communication & Handoff Stream
              </span>
              <div className="space-y-2.5">
                {session.messageLog.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {msg.fromAgentName}
                        </span>
                        <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                        <span className="text-[var(--text-muted)] font-medium">
                          {msg.toAgentName}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 font-mono uppercase">
                          {msg.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[var(--foreground)] leading-relaxed">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: SHARED CONTEXT & BLACKBOARD */}
          {inspectTab === "blackboard" && (
            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4 text-xs">
              <div>
                <span className="font-bold text-sm block mb-1 text-purple-500">
                  Shared Blackboard State:
                </span>
                <pre className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] font-mono text-[11px] overflow-x-auto text-[var(--text-muted)]">
                  {JSON.stringify(session.sharedContext.blackboard, null, 2)}
                </pre>
              </div>

              <div>
                <span className="font-bold text-xs block mb-1">
                  Gathered Evidence Facts ({session.sharedContext.gatheredFacts.length}):
                </span>
                <div className="space-y-1.5">
                  {session.sharedContext.gatheredFacts.map((fact, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] text-[11px]">
                      {fact}
                    </div>
                  ))}
                </div>
              </div>

              {session.sharedContext.generatedCodeFiles.length > 0 && (
                <div>
                  <span className="font-bold text-xs block mb-1">Generated Code Files:</span>
                  {session.sharedContext.generatedCodeFiles.map((f, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] font-mono text-[11px] whitespace-pre-wrap">
                      <div className="font-bold text-purple-500 mb-1">{f.path} ({f.language}):</div>
                      {f.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 4: FINAL DELIVERABLE */}
          {inspectTab === "deliverable" && (
            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-bold text-sm md:text-base text-emerald-800 dark:text-emerald-300">
                    Consolidated Multi-Agent Deliverable
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyDeliverable}
                    className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] transition text-[var(--foreground)]"
                    title="Copy to Clipboard"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleDownloadDeliverable}
                    className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] transition text-[var(--foreground)]"
                    title="Download Markdown"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {session.finalResult ? (
                <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] leading-relaxed whitespace-pre-line font-mono">
                  {session.finalResult}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)] italic">
                  Deliverable is assembling. Complete remaining stages to generate final consolidated report.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. HUMAN APPROVAL CHECKPOINT MODAL */}
      {showApprovalModal && session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-dropdown p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center gap-2 text-amber-500">
              <Shield className="w-5 h-5" />
              <h3 className="font-bold text-sm">Human Approval Checkpoint Triggered</h3>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Step {session.steps[session.currentStepIndex]?.stepNumber}:{" "}
              <strong>{session.steps[session.currentStepIndex]?.instruction}</strong>
            </p>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--foreground)] space-y-1">
              <span className="font-semibold text-amber-700 dark:text-amber-400 block">
                Security & Risk Disclosure:
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                {session.steps[session.currentStepIndex]?.approvalReason ||
                  "This agent step involves critical evidence verification, security auditing, or deliverable publication."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
              >
                Reject & Pause
              </button>
              <button
                onClick={() => handleContinueNextStep(true)}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 shadow-sm flex items-center gap-1.5 transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Authorize & Proceed</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CUSTOM AGENT CREATION MODAL */}
      {showCustomAgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreateCustomAgent}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-dropdown p-6 max-w-lg w-full space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-sm">Create Custom Autonomous Agent</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomAgentModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Agent Name & Title</label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g. FinSecure (Financial Fraud Investigator)"
                  className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground)]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Agent Role (from 7 Core Swarm Roles)</label>
                <select
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value as AgentRole)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground)]"
                >
                  <option value="planner">Planner (Task Decomposition)</option>
                  <option value="researcher">Researcher (Live Web & Evidence)</option>
                  <option value="coder">Coder (Sandbox Execution)</option>
                  <option value="analyst">Analyst (Data Tables & Metrics)</option>
                  <option value="critic">Critic (Adversarial Error Review)</option>
                  <option value="verifier">Verifier (Empirical Claims & Boundaries)</option>
                  <option value="synthesizer">Synthesizer (Executive Output)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">System Directives & Prompt</label>
                <textarea
                  rows={2}
                  value={newAgentPrompt}
                  onChange={(e) => setNewAgentPrompt(e.target.value)}
                  placeholder="Define the agent's objective, analytical tone, and security boundaries..."
                  className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground)] resize-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1.5">Permitted Tools</label>
                <div className="flex flex-wrap gap-1.5">
                  {(["web_search", "web_fetch", "code_execution", "fact_verifier", "data_analysis", "create_artifact"] as AgentToolName[]).map(
                    (t) => {
                      const active = newAgentTools.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            if (active) setNewAgentTools(newAgentTools.filter((tool) => tool !== t));
                            else setNewAgentTools([...newAgentTools, t]);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition ${
                            active
                              ? "bg-purple-600 text-white border-purple-600"
                              : "bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-muted)]"
                          }`}
                        >
                          {t}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reqApp"
                  checked={newAgentRequiresApproval}
                  onChange={(e) => setNewAgentRequiresApproval(e.target.checked)}
                  className="rounded text-purple-600"
                />
                <label htmlFor="reqApp" className="text-xs text-[var(--text-muted)]">
                  Require Human Approval Checkpoint before this agent executes high-impact actions
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomAgentModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition"
              >
                Save & Add to Swarm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 7. EXECUTION HISTORY DRAWER */}
      {showHistoryDrawer && (
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3 animate-fadeIn text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-500" />
              <span>Past Autonomous Swarm Sessions</span>
            </h3>
            <button
              onClick={() => setShowHistoryDrawer(false)}
              className="text-[var(--text-muted)] hover:text-[var(--foreground)]"
            >
              ✕
            </button>
          </div>

          {historySessions.length === 0 ? (
            <p className="text-[var(--text-muted)]">No past session history recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {historySessions.map((h) => (
                <div
                  key={h.sessionId}
                  onClick={() => {
                    setSession(h);
                    setShowHistoryDrawer(false);
                  }}
                  className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] hover:border-purple-500/40 cursor-pointer flex items-center justify-between transition"
                >
                  <div className="truncate mr-3">
                    <span className="font-semibold block truncate">{h.goal}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(h.createdAt).toLocaleString()} • {h.steps.length} steps • ${h.costEstimate.estimatedCostUsd}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      h.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-purple-500/10 text-purple-600"
                    }`}
                  >
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
