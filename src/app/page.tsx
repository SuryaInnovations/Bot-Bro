"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Artifact,
  Attachment,
  Conversation,
  Message,
  Project,
  UserMemory,
  UserPreferences,
  UsageRecord,
} from "@/types";
import { store, DEFAULT_PREFERENCES } from "@/lib/storage/store";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { ArtifactPanel } from "@/components/artifacts/ArtifactPanel";
import { SearchModal } from "@/components/sidebar/SearchModal";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { OnboardingModal } from "@/components/common/OnboardingModal";
import { NovaOrb } from "@/components/common/NovaOrb";
import { generateId } from "@/lib/utils";
import { TopNav, ActivePlatformTab } from "@/components/navigation/TopNav";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { DailyIntelligenceDashboard } from "@/components/realtime/DailyIntelligenceDashboard";
import { AgentsWorkspace } from "@/components/agents/AgentsWorkspace";
import { DeepResearchWorkspace } from "@/components/research/DeepResearchWorkspace";
import { CodingWorkspace } from "@/components/coding/CodingWorkspace";
import { KnowledgeWorkspace } from "@/components/knowledge/KnowledgeWorkspace";
import { WorkflowBuilder } from "@/components/workflows/WorkflowBuilder";
import { MultimodalStudio } from "@/components/multimodal/MultimodalStudio";
import { PersonalAssistantWorkspace } from "@/components/assistant/PersonalAssistantWorkspace";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();

  // --- Authentication State ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- Persistent State from LocalStorage / Store ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);

  // --- UI Controls State ---
  const [activeTab, setActiveTab] = useState<ActivePlatformTab>("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isArtifactsOpen, setIsArtifactsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // --- Chat & Composer State ---
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_PREFERENCES.defaultModel);
  const [discoveredModels, setDiscoveredModels] = useState<any[]>([]);
  const [enableWebSearch, setEnableWebSearch] = useState(true);
  const [enableCodeExecution, setEnableCodeExecution] = useState(true);
  const [enableThinking, setEnableThinking] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load initial data on mount
  useEffect(() => {
    // 1. Verify Authentication Session with timeout and client-server synchronization
    let localUser: any = null;
    let isResolved = false;

    try {
      const stored = localStorage.getItem("nova_user_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.user) {
          localUser = parsed.user;
          setCurrentUser(parsed.user);
          setAuthChecking(false);
          isResolved = true;
        }
      }
    } catch {}

    // Check direct Supabase client session in browser as immediate validation
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        supabase.auth.getSession().then(({ data }) => {
          if (data?.session?.user && !isResolved) {
            const sbUser = data.session.user;
            const userObj = {
              id: sbUser.id,
              email: sbUser.email || "",
              fullName:
                sbUser.user_metadata?.full_name ||
                sbUser.user_metadata?.name ||
                sbUser.email?.split("@")[0] ||
                "User",
              avatarUrl: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || "",
              role: "user",
              emailVerified: Boolean(sbUser.email_confirmed_at || sbUser.confirmed_at),
            };
            localUser = userObj;
            setCurrentUser((prev: any) => prev || userObj);
            setAuthChecking(false);
            isResolved = true;
          }
        }).catch(() => {});
      }
    } catch {}

    // Safety timeout prevents infinite loading screen
    const authTimeout = setTimeout(() => {
      if (!isResolved) {
        setAuthChecking(false);
        setAuthError("Session authentication timed out. Please retry or sign in again.");
      }
    }, 8000);

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(authTimeout);
        if (data.authenticated && data.user) {
          isResolved = true;
          setCurrentUser(data.user);
          localStorage.setItem("nova_user_session", JSON.stringify(data));
          setAuthChecking(false);
          setAuthError(null);
          // Load conversations and projects for this user
          const userConvs = store.getConversations(data.user.id);
          setConversations(userConvs);
          const userProjects = store.getProjects(data.user.id);
          setProjects(userProjects);
        } else if (!localUser && !isResolved) {
          setAuthChecking(false);
          router.replace("/login");
        } else {
          setAuthChecking(false);
        }
      })
      .catch(() => {
        clearTimeout(authTimeout);
        if (!localUser && !isResolved) {
          setAuthChecking(false);
          router.replace("/login");
        } else {
          setAuthChecking(false);
        }
      });

    const loadedPrefs = store.getPreferences();
    setPreferences(loadedPrefs);
    setSelectedModel(loadedPrefs.defaultModel);
    setEnableWebSearch(loadedPrefs.enableWebSearch);
    setEnableCodeExecution(loadedPrefs.enableCodeExecution);
    setEnableThinking(loadedPrefs.enableThinking);

    // Apply theme
    applyTheme(loadedPrefs.theme);

    const loadedConversations = store.getConversations(localUser?.id);
    setConversations(loadedConversations);

    const initialId = loadedConversations[0]?.id || "welcome-chat";
    setActiveConversationId(initialId);
    const initialMsgs = store.getMessagesByConversation(initialId).filter(
      (m) => m.id !== "welcome-msg-1" && !m.content?.includes("Here are some of the things you can do with NOVA AI")
    );
    setMessages(initialMsgs);

    setArtifacts(store.getArtifacts());
    setProjects(store.getProjects(localUser?.id));
    setMemories(store.getMemories());
    setUsageRecords(store.getUsageRecords());

    // Dynamically discover models from Anthropic Models API
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        if (data.models && Array.isArray(data.models)) {
          setDiscoveredModels(data.models);
        }
      })
      .catch((err) => console.log("Models API discovery note:", err));

    try {
      if (!localStorage.getItem("nova_beta_onboarding")) {
        setIsOnboardingOpen(true);
      }
    } catch {}
  }, [router]);

  // Update messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      const convMessages = store.getMessagesByConversation(activeConversationId).filter(
        (m) => m.id !== "welcome-msg-1" && !m.content?.includes("Here are some of the things you can do with NOVA AI")
      );
      setMessages(convMessages);
      const conv = store.getConversation(activeConversationId);
      if (conv?.model) {
        setSelectedModel(conv.model);
      }
    }
  }, [activeConversationId]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+O: New Chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        handleNewChat();
      }
      // Ctrl+K: Search Chats
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const applyTheme = (theme: "light" | "dark" | "system") => {
    const isDark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = preferences.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    const updated = store.savePreferences({ theme: nextTheme });
    setPreferences(updated);
  };

  // --- CONVERSATION ACTIONS ---
  const handleNewChat = () => {
    const newConv = store.createConversation({
      model: selectedModel,
      projectId: activeProjectId,
    });
    setConversations(store.getConversations());
    setActiveConversationId(newConv.id);
    setMessages([]);
    setInput("");
    setAttachments([]);
    setIsArtifactsOpen(false);
  };

  const handleUpdateConversation = (updates: Partial<Conversation>) => {
    if (!activeConversationId) return;
    const updated = store.updateConversation(activeConversationId, updates);
    if (updated) {
      setConversations(store.getConversations());
    }
  };

  const handleDeleteConversation = (id: string) => {
    store.deleteConversation(id);
    const remaining = store.getConversations();
    setConversations(remaining);
    if (activeConversationId === id) {
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  // --- STREAMING MESSAGE SEND ---
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend !== undefined ? textToSend : input).trim();
    if ((!content && attachments.length === 0) || isStreaming) return;

    const currentConv = store.getConversation(activeConversationId);
    let convId = activeConversationId;

    // Filter out any lingering welcome message so it is NEVER present when the user asks something
    const cleanedExistingMessages = messages.filter(
      (m) => m.id !== "welcome-msg-1" && !m.content?.includes("Here are some of the things you can do with NOVA AI")
    );

    // If new conversation with default title, auto-generate title from first prompt
    if (
      (!currentConv || currentConv.title === "New Chat" || currentConv.title === "Welcome to NOVA AI") &&
      content
    ) {
      const autoTitle = content.slice(0, 35) + (content.length > 35 ? "..." : "");
      store.updateConversation(convId, { title: autoTitle });
      setConversations(store.getConversations());
    }

    // 1. Add User Message
    const userMsg: Message = {
      id: generateId(),
      conversationId: convId,
      role: "user",
      content,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      createdAt: new Date().toISOString(),
    };

    store.addMessage(userMsg);
    const updatedMessages = [...cleanedExistingMessages, userMsg];
    setMessages(updatedMessages);

    // Clear input & attachments
    setInput("");
    setAttachments([]);

    // 2. Prepare Placeholder Assistant Message
    const assistantMsgId = generateId();
    const assistantMsg: Message = {
      id: assistantMsgId,
      conversationId: convId,
      role: "assistant",
      content: "",
      thinking: "",
      toolExecutions: [],
      citations: [],
      createdAt: new Date().toISOString(),
    };

    setMessages([...updatedMessages, assistantMsg]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Find active project instructions if any
      const project = projects.find((p) => p.id === activeProjectId);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          model: selectedModel,
          style: preferences.responseStyle,
          enableThinking,
          thinkingBudget: preferences.thinkingBudget,
          enableWebSearch,
          enableCodeExecution,
          projectInstructions: project?.instructions,
          userMemories: memories.map((m) => m.content),
          customApiKey: preferences.customApiKey,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No readable stream response from server");

      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let accumulatedThinking = "";
      const currentToolExecutions: any[] = [];
      const currentCitations: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.replace("data: ", "").trim();
          if (!dataStr) continue;

          try {
            const event = JSON.parse(dataStr);

            if (event.type === "text_delta") {
              accumulatedContent += event.text;
            } else if (event.type === "thinking_delta") {
              accumulatedThinking += event.text;
            } else if (event.type === "tool_start") {
              currentToolExecutions.push({
                id: event.id,
                name: event.name,
                input: {},
                status: "running",
              });
            } else if (event.type === "tool_ready") {
              const tc = currentToolExecutions.find((t) => t.id === event.id);
              if (tc) tc.input = event.input;
            } else if (event.type === "tool_result") {
              const tc = currentToolExecutions.find((t) => t.id === event.id);
              if (tc) {
                tc.output = event.output;
                tc.status = event.isError ? "failed" : "completed";
              }
            } else if (event.type === "citation") {
              currentCitations.push(event.citation);
            } else if (event.type === "artifact") {
              const savedArt = store.saveArtifact(event.artifact);
              setArtifacts(store.getArtifacts());
              setActiveArtifact(savedArt);
              setIsArtifactsOpen(true);
            } else if (event.type === "usage_delta" && event.usage) {
              store.recordUsage({
                model: selectedModel,
                promptTokens: event.usage.input_tokens || 0,
                completionTokens: event.usage.output_tokens || 0,
                totalTokens: (event.usage.input_tokens || 0) + (event.usage.output_tokens || 0),
                estimatedCost: 0.005,
              });
              setUsageRecords(store.getUsageRecords());
            } else if (event.type === "error") {
              accumulatedContent += `\n\n**Error:** ${event.error}`;
            }

            // Real-time UI update
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: accumulatedContent,
                      thinking: accumulatedThinking,
                      toolExecutions: [...currentToolExecutions],
                      citations: [...currentCitations],
                    }
                  : m
              )
            );
          } catch {
            // Ignore incomplete SSE json chunk
          }
        }
      }

      // Persist final assistant response to store
      store.addMessage({
        id: assistantMsgId,
        conversationId: convId,
        role: "assistant",
        content: accumulatedContent,
        thinking: accumulatedThinking || undefined,
        toolExecutions: currentToolExecutions.length > 0 ? currentToolExecutions : undefined,
        citations: currentCitations.length > 0 ? currentCitations : undefined,
      });
    } catch (err: any) {
      if (err.name === "AbortError") {
        // User clicked stop
      } else {
        const errorText = `**Error:** ${err.message || "Failed to generate Claude response."}`;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: (m.content ? m.content + "\n\n" : "") + errorText }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRegenerate = () => {
    if (messages.length === 0 || isStreaming) return;
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content);
    }
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    store.updateMessage(messageId, { content: newContent });
    setMessages(store.getMessagesByConversation(activeConversationId));
    handleSendMessage(newContent);
  };

  const handleFeedback = (messageId: string, feedback: "positive" | "negative") => {
    store.updateMessage(messageId, { feedback });
    setMessages(store.getMessagesByConversation(activeConversationId));
  };

  const handleExportChat = () => {
    const currentConv = store.getConversation(activeConversationId);
    let md = `# ${currentConv?.title || "BOT BRO Chat"}\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

    messages.forEach((m) => {
      const role = m.role === "user" ? "### User" : "### BOT BRO";
      md += `${role}\n\n${m.content}\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(currentConv?.title || "chat").replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- Project Folder Handlers ---
  const handleCreateProject = (name: string) => {
    const newProj = store.createProject({ name, description: "", instructions: "" });
    setProjects(store.getProjects());
    return newProj;
  };

  const handleRenameProject = (id: string, name: string) => {
    store.updateProject(id, { name });
    setProjects(store.getProjects());
  };

  const handleDeleteProject = (id: string) => {
    store.deleteProject(id);
    setProjects(store.getProjects());
    setConversations(store.getConversations());
    if (activeProjectId === id) setActiveProjectId(undefined);
  };

  const handleMoveConversationToProject = (conversationId: string, projectId?: string) => {
    store.moveConversationToProject(conversationId, projectId);
    setConversations(store.getConversations());
  };

  const handleNewChatInProject = (projectId: string) => {
    const newConv = store.createConversation({ projectId });
    setConversations(store.getConversations());
    setActiveConversationId(newConv.id);
    setActiveProjectId(projectId);
    setActiveTab("chat");
    setMessages([]);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/session", { method: "POST" });
    } catch {}
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {}
    localStorage.removeItem("nova_user_session");
    router.replace("/login");
  };

  const currentConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0] || {
      id: "welcome-chat",
      title: "New Chat",
      model: selectedModel,
      responseStyle: "normal",
      isPinned: false,
      isStarred: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

  const cleanedMessages = messages.filter(
    (m) => m.id !== "welcome-msg-1" && !m.content?.includes("Here are some of the things you can do with NOVA AI")
  );
  const showWelcome = cleanedMessages.length === 0;

  if (authChecking && !currentUser) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#090A0F] text-zinc-100 select-none">
        <NovaOrb size="lg" />
        <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Authenticating BOT BRO session...</span>
        </div>
      </div>
    );
  }

  if (authError && !currentUser) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#090A0F] text-zinc-100 p-4 select-none">
        <NovaOrb size="lg" />
        <div className="mt-6 max-w-sm w-full bg-zinc-900/90 border border-red-500/30 rounded-2xl p-5 text-center shadow-2xl backdrop-blur-md">
          <div className="w-10 h-10 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-1">Session Notice</h3>
          <p className="text-xs text-zinc-400 mb-4">{authError}</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setAuthError(null);
                setAuthChecking(true);
                window.location.reload();
              }}
              className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* 1. CHAT SIDEBAR (Primary Navigation & History) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          setActiveConversationId(id);
          setActiveTab("chat");
        }}
        onNewChat={handleNewChat}
        onNewChatInProject={handleNewChatInProject}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => setActiveProjectId(id)}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onMoveConversationToProject={handleMoveConversationToProject}
        onUpdateConversation={(id, updates) => {
          store.updateConversation(id, updates);
          setConversations(store.getConversations());
        }}
        onDeleteConversation={handleDeleteConversation}
        theme={preferences.theme}
        onToggleTheme={handleToggleTheme}
        userName={currentUser?.fullName || preferences.userName || "Saleh"}
        userEmail={currentUser?.email}
        onLogout={handleLogout}
      />

      {/* 2. MAIN PLATFORM CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-[var(--background)]">
        {/* Top Header (Model Selector, Share, Archive, Report) */}
        <ChatHeader
          conversation={currentConversation}
          messages={cleanedMessages}
          onUpdateConversation={handleUpdateConversation}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleArtifacts={() => setIsArtifactsOpen(!isArtifactsOpen)}
          isArtifactsOpen={isArtifactsOpen}
          hasArtifacts={artifacts.length > 0}
          selectedModel={selectedModel}
          onSelectModel={(m) => {
            setSelectedModel(m);
            handleUpdateConversation({ model: m });
          }}
          onExport={handleExportChat}
          availableModels={discoveredModels}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Tab 1: Chat Experience */}
        {activeTab === "chat" && (
          <div className="flex-1 flex min-w-0 h-full overflow-hidden relative">
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
              {showWelcome ? (
                /* Center Welcome Screen */
                <WelcomeScreen
                  userName={preferences.userName || "Saleh"}
                  input={input}
                  setInput={setInput}
                  onSend={() => handleSendMessage()}
                  onStop={handleStopGeneration}
                  isStreaming={isStreaming}
                  selectedModel={selectedModel}
                  onSelectModel={setSelectedModel}
                  enableWebSearch={enableWebSearch}
                  setEnableWebSearch={setEnableWebSearch}
                  enableCodeExecution={enableCodeExecution}
                  setEnableCodeExecution={setEnableCodeExecution}
                  enableThinking={enableThinking}
                  setEnableThinking={setEnableThinking}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  onOpenDocs={() => setActiveTab("knowledge")}
                  onOpenCalendar={() => setActiveTab("daily_intel")}
                  onOpenApi={() => setIsSettingsOpen(true)}
                />
              ) : (
                /* Active Conversation Stream */
                <>
                  <MessageList
                    messages={cleanedMessages}
                    isStreaming={isStreaming}
                    onRegenerate={handleRegenerate}
                    onEditMessage={handleEditMessage}
                    onFeedback={handleFeedback}
                    onOpenArtifact={(art) => {
                      const fullArtifact: Artifact = {
                        id: art.id || `art-${Date.now()}`,
                        conversationId: activeConversationId,
                        messageId: "",
                        title: art.title || "Artifact",
                        type: (art.type as any) || "text/html",
                        language: art.language,
                        content: art.content || "",
                        version: 1,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      };
                      store.saveArtifact(fullArtifact);
                      setArtifacts(store.getArtifacts());
                      setActiveArtifact(fullArtifact);
                      setIsArtifactsOpen(true);
                    }}
                  />

                  {/* Docked Message Composer */}
                  <div className="p-3 shrink-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent pt-2">
                    <MessageComposer
                      input={input}
                      setInput={setInput}
                      onSend={() => handleSendMessage()}
                      onStop={handleStopGeneration}
                      isStreaming={isStreaming}
                      selectedModel={selectedModel}
                      onSelectModel={setSelectedModel}
                      enableWebSearch={enableWebSearch}
                      setEnableWebSearch={setEnableWebSearch}
                      enableCodeExecution={enableCodeExecution}
                      setEnableCodeExecution={setEnableCodeExecution}
                      enableThinking={enableThinking}
                      setEnableThinking={setEnableThinking}
                      attachments={attachments}
                      setAttachments={setAttachments}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Split-Screen Artifacts Workspace */}
            {isArtifactsOpen && (
              <ArtifactPanel
                artifact={activeArtifact || artifacts[0] || null}
                onClose={() => setIsArtifactsOpen(false)}
              />
            )}
          </div>
        )}

        {/* Tab 2: Daily Real-Time Intelligence Dashboard */}
        {activeTab === "daily_intel" && (
          <div className="flex-1 overflow-hidden">
            <DailyIntelligenceDashboard />
          </div>
        )}

        {/* Tab 3: Autonomous Multi-Agent Platform */}
        {activeTab === "agents" && (
          <div className="flex-1 overflow-hidden">
            <AgentsWorkspace />
          </div>
        )}

        {/* Tab 4: Deep Research Engine */}
        {activeTab === "research" && (
          <div className="flex-1 overflow-hidden">
            <DeepResearchWorkspace />
          </div>
        )}

        {/* Tab 5: Advanced Coding Workspace */}
        {activeTab === "coding" && (
          <div className="flex-1 overflow-hidden">
            <CodingWorkspace />
          </div>
        )}

        {/* Tab 6: Personal Knowledge & RAG Engine */}
        {activeTab === "knowledge" && (
          <div className="flex-1 overflow-hidden">
            <KnowledgeWorkspace />
          </div>
        )}

        {/* Tab 7: Visual Workflow Builder */}
        {activeTab === "workflows" && (
          <div className="flex-1 overflow-hidden">
            <WorkflowBuilder />
          </div>
        )}

        {/* Tab 8: Multimodal AI Studio */}
        {activeTab === "studio" && (
          <div className="flex-1 overflow-hidden">
            <MultimodalStudio />
          </div>
        )}

        {/* Tab 9: Personal Assistant Mode 2.0 */}
        {activeTab === "personal_assistant" && (
          <div className="flex-1 overflow-hidden">
            <PersonalAssistantWorkspace />
          </div>
        )}
      </main>

      {/* MODALS */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        conversations={conversations}
        messages={store.getMessages()}
        onSelectConversation={(id) => setActiveConversationId(id)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onSavePreferences={(updates) => {
          const updated = store.savePreferences(updates);
          setPreferences(updated);
          if (updates.theme) applyTheme(updates.theme);
        }}
        memories={memories}
        onAddMemory={(c) => {
          store.addMemory(c);
          setMemories(store.getMemories());
        }}
        onDeleteMemory={(id) => {
          store.deleteMemory(id);
          setMemories(store.getMemories());
        }}
        usageRecords={usageRecords}
        onExportData={() => {
          const data = store.exportAllData();
          const blob = new Blob([data], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `nova_ai_backup_${new Date().toISOString().split("T")[0]}.json`;
          link.click();
        }}
        onImportData={(json) => {
          store.importData(json);
          setConversations(store.getConversations());
          setMessages(store.getMessagesByConversation(activeConversationId));
          setArtifacts(store.getArtifacts());
          setProjects(store.getProjects());
          setMemories(store.getMemories());
          setPreferences(store.getPreferences());
        }}
        onClearAllData={() => {
          store.clearAllData();
          setConversations([]);
          setMessages([]);
          setArtifacts([]);
          setProjects([]);
          setMemories([]);
          handleNewChat();
        }}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => {
          setIsOnboardingOpen(false);
          try {
            localStorage.setItem("nova_beta_onboarding", "true");
          } catch {}
        }}
      />
    </div>
  );
}
