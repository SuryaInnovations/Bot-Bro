"use client";

import React, { useState } from "react";
import {
  GitFork,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  Sliders,
  Layers,
  ChevronRight,
  ShieldCheck,
  Bot,
  Terminal,
  Cpu,
  Zap,
} from "lucide-react";
import {
  PRESET_WORKFLOWS,
  VisualWorkflow,
  WorkflowExecutionLog,
  WorkflowNode,
  WorkflowNodeType,
} from "@/lib/workflows/workflow-types";

export const WorkflowBuilder: React.FC = () => {
  const [workflows, setWorkflows] = useState<VisualWorkflow[]>(PRESET_WORKFLOWS);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>(PRESET_WORKFLOWS[0].id);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<WorkflowExecutionLog[]>([]);
  const [overallStatus, setOverallStatus] = useState<"idle" | "running" | "paused_approval" | "completed" | "failed">("idle");
  const [approvedNodeIds, setApprovedNodeIds] = useState<string[]>([]);
  const [activeLogTab, setActiveLogTab] = useState<"visual" | "logs">("visual");

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId) || workflows[0];
  const selectedNode = activeWorkflow.nodes.find((n) => n.id === selectedNodeId);

  const handleRunWorkflow = async (overrideApproved: string[] = approvedNodeIds) => {
    setIsRunning(true);
    setOverallStatus("running");

    try {
      const res = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: activeWorkflow,
          humanApprovedNodeIds: overrideApproved,
        }),
      });

      const data = await res.json();
      if (data.logs) {
        setExecutionLogs(data.logs);
      }
      setOverallStatus(data.overallStatus || "completed");
    } catch (err: any) {
      setOverallStatus("failed");
    } finally {
      setIsRunning(false);
    }
  };

  const handleApproveCheckpoint = (nodeId: string) => {
    const updatedApproved = [...approvedNodeIds, nodeId];
    setApprovedNodeIds(updatedApproved);
    handleRunWorkflow(updatedApproved);
  };

  const getNodeStatus = (nodeId: string) => {
    const log = executionLogs.find((l) => l.nodeId === nodeId);
    return log?.status || "pending";
  };

  const getNodeBadgeColor = (type: WorkflowNodeType) => {
    switch (type) {
      case "trigger":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "tool":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "ai_model":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "approval":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "output":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)] overflow-hidden">
      {/* Top Header / Action Bar */}
      <div className="h-14 border-b border-[var(--border)] px-6 flex items-center justify-between bg-[var(--surface-subtle)]/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">{activeWorkflow.name}</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
                v{activeWorkflow.version}.0
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">{activeWorkflow.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Selector */}
          <select
            value={activeWorkflowId}
            onChange={(e) => {
              setActiveWorkflowId(e.target.value);
              setExecutionLogs([]);
              setOverallStatus("idle");
              setApprovedNodeIds([]);
            }}
            className="text-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-[var(--foreground)] focus:outline-none"
          >
            {workflows.map((wf) => (
              <option key={wf.id} value={wf.id}>
                {wf.name}
              </option>
            ))}
          </select>

          {/* View Tab */}
          <div className="flex items-center bg-[var(--surface)] rounded-lg p-0.5 border border-[var(--border)] text-xs">
            <button
              onClick={() => setActiveLogTab("visual")}
              className={`px-3 py-1 rounded-md transition ${
                activeLogTab === "visual"
                  ? "bg-rose-500 text-white font-medium shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Visual Canvas
            </button>
            <button
              onClick={() => setActiveLogTab("logs")}
              className={`px-3 py-1 rounded-md transition ${
                activeLogTab === "logs"
                  ? "bg-rose-500 text-white font-medium shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Logs ({executionLogs.length})
            </button>
          </div>

          {/* Run Action */}
          <button
            onClick={() => handleRunWorkflow()}
            disabled={isRunning}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition ${
              isRunning
                ? "bg-rose-400 text-white cursor-not-allowed"
                : "bg-rose-500 hover:bg-rose-600 text-white"
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Executing Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Simulate & Execute</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center: Canvas or Logs */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          {/* Status Alert Banner */}
          {overallStatus === "paused_approval" && (
            <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Human Authorization Required
                  </h4>
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-300/80">
                    Execution has reached a safety checkpoint. Review the synthesized payload and approve to continue.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const approvalNode = activeWorkflow.nodes.find((n) => n.type === "approval");
                  if (approvalNode) handleApproveCheckpoint(approvalNode.id);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm"
              >
                Approve & Resume
              </button>
            </div>
          )}

          {overallStatus === "completed" && (
            <div className="mb-6 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Pipeline executed successfully. All {activeWorkflow.nodes.length} nodes completed.
              </p>
            </div>
          )}

          {activeLogTab === "visual" ? (
            /* Visual DAG Nodes Pipeline */
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium pb-2 border-b border-[var(--border)]">
                <span>EXECUTION TOPOLOGY & GRAPH STAGES</span>
                <span className="text-[11px]">Click any node to inspect parameters</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeWorkflow.nodes.map((node, index) => {
                  const status = getNodeStatus(node.id);
                  const log = executionLogs.find((l) => l.nodeId === node.id);
                  const isSelected = selectedNodeId === node.id;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`relative p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? "border-rose-500 bg-[var(--surface)] ring-1 ring-rose-500/50"
                          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-muted)]/50"
                      }`}
                    >
                      {/* Node Header */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getNodeBadgeColor(
                              node.type
                            )}`}
                          >
                            {node.type}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            Stage #{index + 1}
                          </span>
                        </div>

                        <h3 className="text-xs font-semibold text-[var(--foreground)] mb-1">
                          {node.label}
                        </h3>

                        {/* Config Summary */}
                        <div className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--surface-subtle)] p-2 rounded-lg truncate">
                          {JSON.stringify(node.config)}
                        </div>
                      </div>

                      {/* Execution Status Footer */}
                      <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {status === "completed" && (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-[11px] font-medium text-emerald-500">
                                Completed ({log?.durationMs}ms)
                              </span>
                            </>
                          )}
                          {status === "paused_approval" && (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-[11px] font-medium text-amber-500">
                                Waiting Approval
                              </span>
                            </>
                          )}
                          {status === "failed" && (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                              <span className="text-[11px] font-medium text-rose-500">Failed</span>
                            </>
                          )}
                          {status === "pending" && (
                            <>
                              <div className="w-2 h-2 rounded-full bg-[var(--text-muted)]" />
                              <span className="text-[11px] text-[var(--text-muted)]">Ready</span>
                            </>
                          )}
                        </div>

                        {node.type === "approval" && status === "paused_approval" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveCheckpoint(node.id);
                            }}
                            className="px-2 py-1 rounded bg-amber-500 text-white text-[10px] font-semibold hover:bg-amber-600 transition"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Execution Logs View */
            <div className="flex flex-col gap-3 font-mono text-xs">
              {executionLogs.length === 0 ? (
                <div className="text-center py-16 text-[var(--text-muted)]">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No execution logs yet. Click "Simulate & Execute" to trigger this pipeline.</p>
                </div>
              ) : (
                executionLogs.map((log, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--foreground)]">{log.nodeLabel}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            log.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : log.status === "paused_approval"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-rose-500/10 text-rose-500"
                          }`}
                        >
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[var(--text-muted)]">
                        {log.durationMs}ms • {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <pre className="text-[11px] p-2 rounded bg-[var(--surface-subtle)] text-[var(--foreground)] overflow-x-auto">
                      {JSON.stringify(log.output, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Side Inspector Panel */}
        <div className="w-80 border-l border-[var(--border)] bg-[var(--surface-subtle)]/30 p-5 flex flex-col shrink-0 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
              Node Inspector
            </h3>
          </div>

          {selectedNode ? (
            <div className="flex flex-col gap-4 text-xs">
              <div>
                <label className="text-[11px] text-[var(--text-muted)]">Node ID</label>
                <p className="font-mono text-xs font-semibold text-[var(--foreground)]">
                  {selectedNode.id}
                </p>
              </div>

              <div>
                <label className="text-[11px] text-[var(--text-muted)]">Stage Label</label>
                <p className="font-semibold text-xs text-[var(--foreground)]">
                  {selectedNode.label}
                </p>
              </div>

              <div>
                <label className="text-[11px] text-[var(--text-muted)]">Type</label>
                <div className="mt-1">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getNodeBadgeColor(
                      selectedNode.type
                    )}`}
                  >
                    {selectedNode.type}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[var(--text-muted)] mb-1 block">
                  Configuration
                </label>
                <pre className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-mono text-[11px] text-[var(--foreground)] overflow-x-auto">
                  {JSON.stringify(selectedNode.config, null, 2)}
                </pre>
              </div>

              {/* Node execution output if available */}
              {(() => {
                const log = executionLogs.find((l) => l.nodeId === selectedNode.id);
                if (!log) return null;
                return (
                  <div>
                    <label className="text-[11px] text-[var(--text-muted)] mb-1 block">
                      Execution Output
                    </label>
                    <pre className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-mono text-[11px] text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                      {JSON.stringify(log.output, null, 2)}
                    </pre>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--text-muted)] text-xs">
              <Layers className="w-6 h-6 mx-auto mb-2 opacity-30" />
              <p>Select any workflow node to inspect its configurations and output payload.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
