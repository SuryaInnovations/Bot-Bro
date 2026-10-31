"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Bell,
  Sparkles,
  Play,
  Volume2,
  VolumeX,
  Mail,
  Send,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  UserCheck,
  Mic,
  MicOff,
  Sliders,
  DollarSign,
  Cpu,
  Trash2,
  CalendarCheck,
  CheckSquare,
  Globe,
  Radio,
  FileText,
} from "lucide-react";
import {
  PersonalTask,
  PersonalReminder,
  CalendarEvent,
  EmailMessage,
  MonitoredTopic,
  ProactiveInsight,
  AssistantBackgroundJob,
  TaskPriority,
  PersonalAssistantSettings,
} from "@/lib/personal-assistant/assistant-types";

export const PersonalAssistantWorkspace: React.FC = () => {
  // Navigation Sub-Tabs
  const [activeTab, setActiveTab] = useState<
    "overview" | "planner" | "reminders" | "calendar" | "email" | "topics" | "jobs" | "settings"
  >("overview");

  // State Data
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [reminders, setReminders] = useState<PersonalReminder[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [topics, setTopics] = useState<MonitoredTopic[]>([]);
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [jobs, setJobs] = useState<AssistantBackgroundJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Command & Voice State
  const [commandInput, setCommandInput] = useState("");
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);
  const [commandResponse, setCommandResponse] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Task Creation Form Modal
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("medium");
  const [newTaskCategory, setNewTaskCategory] = useState<any>("work");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");

  // Reminder Creation Modal
  const [showNewReminderModal, setShowNewReminderModal] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("");
  const [newReminderRecurrence, setNewReminderRecurrence] = useState<any>("none");

  // Calendar Event Creation Modal
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStart, setNewEventStart] = useState("");
  const [newEventEnd, setNewEventEnd] = useState("");

  // Email Action Feedback
  const [emailStatusMsg, setEmailStatusMsg] = useState("");

  // Assistant Settings State
  const [settings, setSettings] = useState<PersonalAssistantSettings>({
    assistantName: "Nova Assistant",
    preferredLanguage: "English (US)",
    timezone: "Asia/Kolkata",
    morningBriefingTime: "08:00",
    eveningBriefingTime: "19:00",
    briefingCategories: ["AI & Technology", "Markets", "Indian Policy", "Weather"],
    reminderSound: true,
    enableProactiveSuggestions: true,
    enableBrowserNotifications: true,
    connectedIntegrations: {
      googleCalendar: true,
      gmail: true,
    },
    voiceSpeed: 1.0,
    voiceGender: "neutral",
    memoryEnabled: true,
  });

  const loadAllAssistantData = async () => {
    setIsLoading(true);
    try {
      const [tRes, rRes, cRes, eRes, pRes, jRes] = await Promise.all([
        fetch("/api/assistant/tasks"),
        fetch("/api/assistant/reminders"),
        fetch("/api/assistant/calendar"),
        fetch("/api/assistant/email"),
        fetch("/api/assistant/proactive"),
        fetch("/api/assistant/jobs"),
      ]);

      if (tRes.ok) setTasks((await tRes.json()).tasks || []);
      if (rRes.ok) setReminders((await rRes.json()).reminders || []);
      if (cRes.ok) setEvents((await cRes.json()).events || []);
      if (eRes.ok) setEmails((await eRes.json()).emails || []);
      if (pRes.ok) setInsights((await pRes.json()).insights || []);
      if (jRes.ok) setJobs((await jRes.json()).jobs || []);
    } catch (e) {
      console.warn("Assistant data fetch exception:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllAssistantData();
  }, []);

  // Natural Language Command Submission
  const handleExecuteCommand = async (e?: React.FormEvent, directCommand?: string) => {
    if (e) e.preventDefault();
    const cmd = (directCommand || commandInput).trim();
    if (!cmd) return;

    setIsExecutingCommand(true);
    setCommandResponse(null);

    try {
      const res = await fetch("/api/assistant/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd, executeSwarm: true }),
      });
      const data = await res.json();
      setCommandResponse(data.message || "Command executed.");
      setCommandInput("");
      loadAllAssistantData(); // refresh tasks & reminders
    } catch (err: any) {
      setCommandResponse(`Execution error: ${err?.message || "Failed"}`);
    } finally {
      setIsExecutingCommand(false);
    }
  };

  // Web Speech API: Voice Command Listener
  const handleToggleVoiceCommand = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser speech recognition is not supported in this browser. Please type your command.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setCommandInput(transcript);
          handleExecuteCommand(undefined, transcript);
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Audio Speech Synthesis for Daily Briefing
  const handleSpeakBriefing = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const pendingCount = tasks.filter((t) => t.status !== "completed").length;
    const completedCount = tasks.filter((t) => t.status === "completed").length;
    const summary = `Good day! You have ${pendingCount} pending priority tasks and ${completedCount} completed items. Next on your schedule is ${events[0]?.title || "Focus block"}. All background intelligence feeds are verified.`;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Task Actions
  const handleCompleteTask = async (id: string) => {
    try {
      await fetch("/api/assistant/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", id }),
      });
      loadAllAssistantData();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await fetch(`/api/assistant/tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      loadAllAssistantData();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await fetch("/api/assistant/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          priority: newTaskPriority,
          category: newTaskCategory,
          deadline: newTaskDeadline ? new Date(newTaskDeadline).toISOString() : undefined,
        }),
      });
      setShowNewTaskModal(false);
      setNewTaskTitle("");
      loadAllAssistantData();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleRescheduleUnfinished = async (toTomorrow = true) => {
    try {
      const res = await fetch("/api/assistant/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule_unfinished", toTomorrow }),
      });
      const data = await res.json();
      setCommandResponse(`Rescheduled ${data.rescheduledCount} unfinished tasks to ${toTomorrow ? "tomorrow" : "today"}.`);
      loadAllAssistantData();
    } catch (e) {
      console.warn(e);
    }
  };

  // Reminder Actions
  const handleCompleteReminder = async (id: string) => {
    try {
      await fetch("/api/assistant/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", id }),
      });
      loadAllAssistantData();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSnoozeReminder = async (id: string) => {
    try {
      await fetch("/api/assistant/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "snooze", id, minutes: 15 }),
      });
      loadAllAssistantData();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleCreateReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim() || !newReminderTime) return;

    try {
      await fetch("/api/assistant/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newReminderTitle.trim(),
          triggerTime: new Date(newReminderTime).toISOString(),
          recurrence: newReminderRecurrence,
        }),
      });
      setShowNewReminderModal(false);
      setNewReminderTitle("");
      loadAllAssistantData();
    } catch (e) {
      console.warn(e);
    }
  };

  // Email Actions
  const handleExtractTasksFromEmail = async (emailId: string) => {
    try {
      const res = await fetch("/api/assistant/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract_tasks", emailId }),
      });
      const data = await res.json();
      setEmailStatusMsg(`Extracted ${data.count} tasks from email into your daily planner.`);
      setTimeout(() => setEmailStatusMsg(""), 4000);
      loadAllAssistantData();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAuthorizeSendEmail = async (emailId: string) => {
    try {
      const res = await fetch("/api/assistant/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "authorize_send", emailId }),
      });
      const data = await res.json();
      setEmailStatusMsg(data.message || "Email authorized and dispatched.");
      setTimeout(() => setEmailStatusMsg(""), 4000);
      loadAllAssistantData();
    } catch (e) {
      console.warn(e);
    }
  };

  // Background Job Trigger
  const handleTriggerJob = async (jobId: string) => {
    try {
      const res = await fetch("/api/assistant/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger", jobId }),
      });
      const data = await res.json();
      setCommandResponse(data.message || "Job triggered.");
      loadAllAssistantData();
    } catch (e) {
      console.warn(e);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* 1. TOP HEADER & PERSONALIZED GREETING */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-purple-500" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Personal Assistant Mode 2.0
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold uppercase tracking-wider">
              {settings.assistantName}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 flex flex-wrap items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span>Timezone: {settings.timezone}</span>
            <span>•</span>
            <span>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Zero-Trust Autonomous Execution Active
            </span>
          </p>
        </div>

        {/* Quick Action Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={handleSpeakBriefing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition shadow-sm"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isSpeaking ? "Stop Briefing" : "Daily Audio Briefing"}</span>
          </button>

          <button
            onClick={loadAllAssistantData}
            disabled={isLoading}
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] transition text-[var(--foreground)]"
            title="Refresh All Assistant Feeds"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-purple-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. NATURAL LANGUAGE COMMAND & VOICE BAR */}
      <form
        onSubmit={handleExecuteCommand}
        className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder='Ask: "Plan my day", "Remind me at 7 PM to study", "Move unfinished tasks to tomorrow", or give any task...'
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-purple-500"
          />
        </div>

        <button
          type="button"
          onClick={handleToggleVoiceCommand}
          className={`p-2 rounded-xl border transition ${
            isListening
              ? "bg-rose-500 text-white border-rose-500 animate-pulse"
              : "bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
          }`}
          title={isListening ? "Listening (Click to stop)" : "Voice Command (Dictate instruction)"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button
          type="submit"
          disabled={isExecutingCommand || !commandInput.trim()}
          className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
        >
          {isExecutingCommand ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>Execute</span>
        </button>
      </form>

      {/* Command Feedback Response */}
      {commandResponse && (
        <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-800 dark:text-purple-300 animate-fadeIn flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
            <span>{commandResponse}</span>
          </div>
          <button onClick={() => setCommandResponse(null)} className="text-[10px] underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 3. PROACTIVE INSIGHTS & CONFLICT ALERTS */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.slice(0, 2).map((ins) => (
            <div
              key={ins.id}
              className={`p-3.5 rounded-2xl border text-xs flex items-start justify-between gap-3 animate-fadeIn ${
                ins.severity === "action_required"
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
                  : ins.severity === "warning"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                  : "bg-purple-500/10 border-purple-500/30 text-purple-800 dark:text-purple-300"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">{ins.title}</span>
                  <p className="text-[11px] opacity-90 leading-relaxed mt-0.5">{ins.message}</p>
                </div>
              </div>

              {ins.actionLabel && (
                <button
                  onClick={() => {
                    if (ins.type === "unfinished_task_reschedule") handleRescheduleUnfinished(false);
                    else if (ins.type === "schedule_conflict") setActiveTab("calendar");
                    else if (ins.type === "project_followup") setActiveTab("email");
                  }}
                  className="px-3 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-semibold text-[10px] hover:bg-[var(--surface-subtle)] transition shrink-0"
                >
                  {ins.actionLabel} →
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 4. WORKSPACE NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-[var(--border)]">
        {[
          { id: "overview", label: "Dashboard Overview", icon: Compass },
          { id: "planner", label: `Daily Planner (${pendingTasks.length})`, icon: CheckSquare },
          { id: "reminders", label: `Smart Reminders (${reminders.length})`, icon: Bell },
          { id: "calendar", label: "Calendar & Conflicts", icon: CalendarCheck },
          { id: "email", label: "Email Assistant", icon: Mail },
          { id: "topics", label: "Research Monitor", icon: Radio },
          { id: "jobs", label: "Background Queue", icon: Cpu },
          { id: "settings", label: "Assistant Settings", icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: OVERVIEW DASHBOARD */}
      {/* ======================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Live Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                Pending Tasks
              </span>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {pendingTasks.length}
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                {tasks.filter((t) => t.priority === "urgent" || t.priority === "high").length} high priority
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                Completed Today
              </span>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {completedTasks.length}
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">Activity completion tracked</p>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                Today's Appointments
              </span>
              <div className="text-3xl font-bold">{events.length}</div>
              <p className="text-[11px] text-[var(--text-muted)]">
                {events.filter((e) => e.conflictDetectedWith).length > 0 ? "⚠️ Conflict detected" : "All slots cleared"}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                Active Background Jobs
              </span>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{jobs.length}</div>
              <p className="text-[11px] text-[var(--text-muted)]">Persistent schedule running</p>
            </div>
          </div>

          {/* Today's Schedule Timeline & Focus Blocks */}
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-purple-500" />
                <span>Today's Chronological Schedule & Focus Blocks</span>
              </h3>
              <button
                onClick={() => handleExecuteCommand(undefined, "Plan my day")}
                className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
              >
                Auto-Optimize Day →
              </button>
            </div>

            <div className="space-y-3">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                    ev.conflictDetectedWith
                      ? "border-rose-500/40 bg-rose-500/5"
                      : "border-[var(--border)] bg-[var(--surface-subtle)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400 font-semibold w-24">
                      {new Date(ev.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                      {new Date(ev.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div>
                      <span className="font-semibold block">{ev.title}</span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {ev.location || "Focus Activity"}
                      </span>
                    </div>
                  </div>

                  {ev.conflictDetectedWith && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 font-bold">
                      Conflict with: {ev.conflictDetectedWith}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: INTELLIGENT DAILY PLANNER */}
      {/* ======================================================== */}
      {activeTab === "planner" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-sm">Intelligent Task Planner</h3>
              <p className="text-xs text-[var(--text-muted)]">
                Prioritize, schedule, and track tasks across work, personal, and research objectives.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRescheduleUnfinished(true)}
                className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
              >
                Move Unfinished to Tomorrow
              </button>

              <button
                onClick={() => setShowNewTaskModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Task</span>
              </button>
            </div>
          </div>

          {/* Task Cards List */}
          <div className="space-y-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition flex items-center justify-between gap-4 ${
                  task.status === "completed"
                    ? "border-emerald-500/20 bg-emerald-500/5 opacity-75"
                    : "border-[var(--border)] bg-[var(--surface)] shadow-subtle hover:border-purple-500/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition mt-0.5 ${
                      task.status === "completed"
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-[var(--border)] hover:border-purple-500"
                    }`}
                  >
                    {task.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-medium ${
                          task.status === "completed" ? "line-through text-[var(--text-muted)]" : "text-[var(--foreground)]"
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Priority Badge */}
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          task.priority === "urgent"
                            ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            : task.priority === "high"
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                        }`}
                      >
                        {task.priority}
                      </span>

                      {/* Category Badge */}
                      <span className="text-[9px] px-2 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-muted)]">
                        {task.category}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-[var(--text-muted)]">{task.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] pt-0.5">
                      {task.deadline && (
                        <span>Deadline: {new Date(task.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                      <span>Estimated: {task.estimatedDurationMins}m</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 transition"
                  title="Delete Task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: SMART REMINDERS */}
      {/* ======================================================== */}
      {activeTab === "reminders" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Smart Reminders Engine</h3>
              <p className="text-xs text-[var(--text-muted)]">
                One-time, recurring, and deadline notifications with persistent scheduling across browser closures.
              </p>
            </div>

            <button
              onClick={() => setShowNewReminderModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Reminder</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">{rem.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border)] font-mono uppercase">
                    {rem.recurrence}
                  </span>
                </div>

                {rem.description && (
                  <p className="text-[11px] text-[var(--text-muted)]">{rem.description}</p>
                )}

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border)]/40">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-500" />
                    <span>{new Date(rem.triggerTime).toLocaleString()}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSnoozeReminder(rem.id)}
                      className="px-2 py-0.5 rounded border border-[var(--border)] text-[10px] hover:bg-[var(--surface-subtle)] transition"
                    >
                      Snooze 15m
                    </button>
                    <button
                      onClick={() => handleCompleteReminder(rem.id)}
                      className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-semibold hover:bg-emerald-600 transition"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 4: CALENDAR & CONFLICTS */}
      {/* ======================================================== */}
      {activeTab === "calendar" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Calendar Assistant & Schedule Conflicts</h3>
              <p className="text-xs text-[var(--text-muted)]">
                Google Calendar OAuth synchronization with automatic overlap detection and available slot optimization.
              </p>
            </div>

            <button
              onClick={() => setShowNewEventModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Event</span>
            </button>
          </div>

          <div className="space-y-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  ev.conflictDetectedWith
                    ? "border-rose-500/40 bg-rose-500/5"
                    : "border-[var(--border)] bg-[var(--surface)] shadow-subtle"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs">{ev.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-muted)]">
                      {ev.source === "google_calendar" ? "Google Calendar" : "Local Workspace"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">{ev.description}</p>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                    {new Date(ev.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {new Date(ev.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {ev.conflictDetectedWith && (
                  <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 text-[11px] font-semibold">
                    ⚠️ Conflict: Overlaps with "{ev.conflictDetectedWith}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 5: EMAIL ASSISTANT */}
      {/* ======================================================== */}
      {activeTab === "email" && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="font-bold text-sm">Email Assistant & Task Extractor</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Secure Gmail OAuth integration. AI automatically extracts action items into your daily planner and drafts replies with human authorization gates.
            </p>
          </div>

          {emailStatusMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-fadeIn">
              {emailStatusMsg}
            </div>
          )}

          <div className="space-y-4">
            {emails.map((em) => (
              <div
                key={em.id}
                className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold block">{em.subject}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      From: {em.from} • {new Date(em.date).toLocaleDateString()}
                    </span>
                  </div>
                  {em.isImportant && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold uppercase">
                      Important
                    </span>
                  )}
                </div>

                <p className="text-xs text-[var(--foreground)] leading-relaxed bg-[var(--surface-subtle)] p-3 rounded-xl border border-[var(--border)] whitespace-pre-line font-mono text-[11px]">
                  {em.body}
                </p>

                {/* Extracted Tasks */}
                {em.extractedTasks && em.extractedTasks.length > 0 && (
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1.5">
                    <span className="text-[11px] font-bold text-purple-600 block">
                      Detected Action Items:
                    </span>
                    {em.extractedTasks.map((t, idx) => (
                      <div key={idx} className="text-xs flex items-center justify-between">
                        <span>• {t.title}</span>
                        <span className="text-[10px] text-purple-600 font-mono uppercase font-bold">
                          [{t.priority}]
                        </span>
                      </div>
                    ))}
                    <button
                      onClick={() => handleExtractTasksFromEmail(em.id)}
                      className="mt-2 text-[10px] px-3 py-1 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
                    >
                      Extract & Add to Planner →
                    </button>
                  </div>
                )}

                {/* Drafted AI Reply with Human Authorization Gate */}
                {em.draftedReply && (
                  <div className="p-3.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-2">
                    <span className="text-[11px] font-bold text-[var(--foreground)] block">
                      AI Drafted Reply (Awaiting Your Approval):
                    </span>
                    <p className="text-xs text-[var(--text-muted)] italic leading-relaxed whitespace-pre-line">
                      "{em.draftedReply}"
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <span className="text-[10px] text-amber-600 font-medium">
                        🛡️ Safety Policy: Emails are never sent without explicit authorization.
                      </span>
                      <button
                        onClick={() => handleAuthorizeSendEmail(em.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Authorize & Send</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 6: RESEARCH TOPIC MONITORING */}
      {/* ======================================================== */}
      {activeTab === "topics" && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="font-bold text-sm">Research & Topic Monitoring Swarm</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Scheduled web crawler tracking breakthroughs, government policy gazettes, and industry updates with direct citations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((top) => (
              <div
                key={top.id}
                className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-600 dark:text-purple-400">
                    {top.topic}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border)] font-mono uppercase">
                    Every {top.intervalHours}h
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {top.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="text-[9px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-mono"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>

                {top.latestHeadline && (
                  <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-1">
                    <span className="text-[10px] text-[var(--text-muted)] font-semibold block">
                      Latest Detected Update:
                    </span>
                    <p className="text-xs font-medium text-[var(--foreground)]">{top.latestHeadline}</p>
                  </div>
                )}

                {top.citations && top.citations.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border)]/40 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span>Source: {top.citations[0].title}</span>
                    <a
                      href={top.citations[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-500 hover:underline flex items-center gap-0.5"
                    >
                      <span>Citations</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 7: BACKGROUND JOBS QUEUE */}
      {/* ======================================================== */}
      {activeTab === "jobs" && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="font-bold text-sm">Background Execution Engine & Scheduled Jobs</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Persistent task queue executing daily intelligence briefings, topic monitoring, and reminder dispatchers across browser closures.
            </p>
          </div>

          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{job.name}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        job.lastStatus === "success"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-purple-500/10 text-purple-600"
                      }`}
                    >
                      {job.lastStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Schedule: {job.scheduleCronOrInterval} • Next run: {new Date(job.nextRunAt).toLocaleTimeString()}
                  </p>
                </div>

                <button
                  onClick={() => handleTriggerJob(job.id)}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--surface)] transition text-xs font-semibold"
                >
                  Trigger Run Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 8: ASSISTANT SETTINGS */}
      {/* ======================================================== */}
      {activeTab === "settings" && (
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-subtle space-y-5 text-xs animate-fadeIn">
          <h3 className="font-bold text-sm">Personal Assistant Preferences & Security</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1">Assistant Display Name</label>
              <input
                type="text"
                value={settings.assistantName}
                onChange={(e) => setSettings({ ...settings, assistantName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground)]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Primary Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground)]"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST • UTC+5:30)</option>
                <option value="America/New_York">America/New_York (EST • UTC-5)</option>
                <option value="Europe/London">Europe/London (GMT • UTC+0)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST • UTC+9)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST • UTC+4)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border)] space-y-3">
            <span className="font-semibold block">Connected Integrations & OAuth:</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Google Calendar (Authorized)</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Gmail Assistant (Authorized • Human Send Gate Active)</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW TASK */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreateTaskSubmit}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Add New Daily Task</span>
              <button type="button" onClick={() => setShowNewTaskModal(false)}>
                ✕
              </button>
            </div>

            <div>
              <label className="font-semibold block mb-1">Task Title</label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. Prepare system presentation deck..."
                className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Category</label>
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]"
                >
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="learning">Learning</option>
                  <option value="research">Research</option>
                  <option value="finance">Finance</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--border)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-semibold"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: NEW REMINDER */}
      {showNewReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreateReminderSubmit}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Schedule Smart Reminder</span>
              <button type="button" onClick={() => setShowNewReminderModal(false)}>
                ✕
              </button>
            </div>

            <div>
              <label className="font-semibold block mb-1">Reminder Title</label>
              <input
                type="text"
                value={newReminderTitle}
                onChange={(e) => setNewReminderTitle(e.target.value)}
                placeholder="e.g. Study Anthropic Claude 3.7 dynamic reasoning..."
                className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]"
                required
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Trigger Date & Time</label>
              <input
                type="datetime-local"
                value={newReminderTime}
                onChange={(e) => setNewReminderTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]"
                required
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Recurrence</label>
              <select
                value={newReminderRecurrence}
                onChange={(e) => setNewReminderRecurrence(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]"
              >
                <option value="none">One-Time Only</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewReminderModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--border)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-semibold"
              >
                Save Reminder
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
