"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Trash2,
  Edit2,
  Pin,
  Archive,
  Check,
  X,
  Settings,
  Sun,
  Moon,
  FolderInput,
  CornerDownRight,
  Bookmark,
  LogOut,
  Share2,
} from "lucide-react";
import { Conversation, Project } from "@/types";
import { NovaOrb } from "../common/NovaOrb";
import { ShareModal } from "../chat/ShareModal";
import { store } from "@/lib/storage/store";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onNewChatInProject?: (projectId: string) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  projects: Project[];
  activeProjectId?: string;
  onSelectProject?: (id?: string) => void;
  onCreateProject?: (name: string) => void;
  onRenameProject?: (id: string, name: string) => void;
  onDeleteProject?: (id: string) => void;
  onMoveConversationToProject?: (conversationId: string, projectId?: string) => void;
  onUpdateConversation: (id: string, updates: Partial<Conversation>) => void;
  onDeleteConversation: (id: string) => void;
  theme: "light" | "dark" | "system";
  onToggleTheme: () => void;
  onLogout?: () => void;
  userName?: string;
  userEmail?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onNewChatInProject,
  onOpenSearch,
  onOpenSettings,
  projects = [],
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onMoveConversationToProject,
  onUpdateConversation,
  onDeleteConversation,
  theme,
  onToggleTheme,
  onLogout,
  userName = "Saleh",
  userEmail,
}) => {
  // State for project folder expansion (default: open all existing projects)
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // Inline Project creation state
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // Project renaming state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [projectMenuOpenId, setProjectMenuOpenId] = useState<string | null>(null);

  // Chat options & move menu state
  const [chatMenuOpenId, setChatMenuOpenId] = useState<string | null>(null);
  const [moveSubmenuChatId, setMoveSubmenuChatId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editChatTitle, setEditChatTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sharingConv, setSharingConv] = useState<Conversation | null>(null);

  // Toggle expand/collapse for a project folder
  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: prev[projectId] === undefined ? false : !prev[projectId],
    }));
  };

  const isProjectExpanded = (projectId: string) => {
    // Defaults to expanded (true) if undefined
    return expandedProjects[projectId] !== false;
  };

  // Handle Project Creation
  const handleConfirmCreateProject = () => {
    if (newProjectName.trim() && onCreateProject) {
      onCreateProject(newProjectName.trim());
      setNewProjectName("");
      setIsCreatingProject(false);
    }
  };

  // Handle Project Renaming
  const startRenameProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditProjectName(project.name);
    setProjectMenuOpenId(null);
  };

  const saveRenameProject = (projectId: string) => {
    if (editProjectName.trim() && onRenameProject) {
      onRenameProject(projectId, editProjectName.trim());
    }
    setEditingProjectId(null);
  };

  // Handle Chat Renaming
  const startRenameChat = (conv: Conversation) => {
    setEditingChatId(conv.id);
    setEditChatTitle(conv.title);
    setChatMenuOpenId(null);
    setMoveSubmenuChatId(null);
  };

  const saveRenameChat = (convId: string) => {
    if (editChatTitle.trim()) {
      onUpdateConversation(convId, { title: editChatTitle.trim() });
    }
    setEditingChatId(null);
  };

  // Handle Moving Chat
  const handleMoveChat = (conversationId: string, targetProjectId?: string) => {
    if (onMoveConversationToProject) {
      onMoveConversationToProject(conversationId, targetProjectId);
    } else {
      onUpdateConversation(conversationId, { projectId: targetProjectId });
    }
    setChatMenuOpenId(null);
    setMoveSubmenuChatId(null);
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (c.isArchived) return false;
    if (searchQuery.trim()) {
      return c.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Group conversations into projects and unassigned recent chats
  const projectChatMap: Record<string, Conversation[]> = {};
  const unassignedChats: Conversation[] = [];

  // Initialize map for all projects
  for (const proj of projects) {
    projectChatMap[proj.id] = [];
  }

  for (const conv of filteredConversations) {
    if (conv.projectId && projectChatMap[conv.projectId]) {
      projectChatMap[conv.projectId].push(conv);
    } else {
      unassignedChats.push(conv);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-3.5 top-3.5 z-30 p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--foreground)] shadow-xs hover:shadow transition flex items-center justify-center group"
        title="Open Sidebar"
      >
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>
    );
  }

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={onToggle}
        className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm"
      />

      <aside className="w-[260px] h-full shrink-0 border-r border-[var(--border)] bg-[var(--sidebar-bg)] flex flex-col justify-between select-none relative z-30 transition-all font-sans">
        {/* Brand Header */}
        <div className="flex items-center justify-between p-3.5 pb-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-2.5">
            <NovaOrb size="sm" />
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-[var(--foreground)]">
                BOT BRO
              </span>
              <span className="text-[10px] text-nova-500 font-mono -mt-0.5">
                AI Companion
              </span>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Main Navigation & Folders Container */}
        <div className="flex flex-col p-3 pb-0 flex-1 min-h-0 overflow-hidden">
          {/* 1. Search conversations */}
          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:border-zinc-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--foreground)]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 2. Prominent New Chat Button */}
          <button
            onClick={onNewChat}
            className="w-full px-3 py-2.5 rounded-xl bg-[#202020] hover:bg-black text-white text-xs font-semibold flex items-center justify-between shadow-xs transition mb-3 group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
              ⌘N
            </span>
          </button>

          {/* Scrollable Container for Projects & Recent Chats */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1">
            {/* 3. PROJECTS SECTION */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1.5 py-1 text-[11px] font-semibold text-[#888888] tracking-wider uppercase">
                <div className="flex items-center gap-1.5">
                  <span>Projects</span>
                  {projects.length > 0 && (
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      ({projects.length})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsCreatingProject(true)}
                  className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5 transition"
                  title="Create Project Folder"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Inline Create Project Form */}
              {isCreatingProject && (
                <div className="p-2 mb-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-1.5 text-xs animate-fadeIn">
                  <Folder className="w-3.5 h-3.5 text-nova-500 shrink-0" />
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirmCreateProject();
                      if (e.key === "Escape") {
                        setIsCreatingProject(false);
                        setNewProjectName("");
                      }
                    }}
                    placeholder="Project name..."
                    autoFocus
                    className="flex-1 bg-transparent text-xs text-[var(--foreground)] focus:outline-none min-w-0"
                  />
                  <button
                    onClick={handleConfirmCreateProject}
                    disabled={!newProjectName.trim()}
                    className="p-1 text-emerald-500 hover:text-emerald-600 disabled:opacity-30"
                    title="Confirm Create"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingProject(false);
                      setNewProjectName("");
                    }}
                    className="p-1 text-[var(--text-muted)] hover:text-rose-500"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Project Folders List */}
              {projects.length === 0 && !isCreatingProject ? (
                <button
                  onClick={() => setIsCreatingProject(true)}
                  className="w-full text-left px-2 py-1.5 rounded-lg border border-dashed border-[var(--border)] hover:border-zinc-400 text-[11px] text-[var(--text-muted)] hover:text-[var(--foreground)] flex items-center gap-2 transition"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Create your first project folder</span>
                </button>
              ) : (
                projects.map((project) => {
                  const expanded = isProjectExpanded(project.id);
                  const projectChats = projectChatMap[project.id] || [];
                  const isEditing = editingProjectId === project.id;

                  return (
                    <div key={project.id} className="space-y-0.5">
                      {/* Project Folder Header Row */}
                      <div className="relative group/proj flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-xs text-[var(--foreground)] transition cursor-pointer">
                        {isEditing ? (
                          <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                            <Folder className="w-3.5 h-3.5 text-nova-500 shrink-0" />
                            <input
                              type="text"
                              value={editProjectName}
                              onChange={(e) => setEditProjectName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveRenameProject(project.id);
                                if (e.key === "Escape") setEditingProjectId(null);
                              }}
                              autoFocus
                              className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded px-1.5 py-0.5 text-xs text-[var(--foreground)] focus:outline-none min-w-0"
                            />
                            <button
                              onClick={() => saveRenameProject(project.id)}
                              className="p-1 text-emerald-500"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingProjectId(null)}
                              className="p-1 text-rose-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Left: Expand Chevron + Folder Icon + Name */}
                            <div
                              onClick={() => toggleProject(project.id)}
                              className="flex items-center gap-1.5 flex-1 min-w-0 truncate"
                            >
                              <button
                                type="button"
                                className="p-0.5 text-[var(--text-muted)] hover:text-[var(--foreground)]"
                              >
                                {expanded ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                              </button>
                              {expanded ? (
                                <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              ) : (
                                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              )}
                              <span className="font-medium truncate" title={project.name}>
                                {project.name}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] font-mono ml-0.5">
                                ({projectChats.length})
                              </span>
                            </div>

                            {/* Right Action Buttons on Hover */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover/proj:opacity-100 transition shrink-0">
                              {/* Create chat in this project */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onNewChatInProject) {
                                    onNewChatInProject(project.id);
                                  } else {
                                    onNewChat();
                                  }
                                }}
                                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-black/10 dark:hover:bg-white/10"
                                title="New chat in this project"
                              >
                                <Plus className="w-3 h-3" />
                              </button>

                              {/* Project menu trigger */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectMenuOpenId(
                                    projectMenuOpenId === project.id ? null : project.id
                                  );
                                  setChatMenuOpenId(null);
                                }}
                                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-black/10 dark:hover:bg-white/10"
                                title="Project options"
                              >
                                <MoreHorizontal className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Project Context Dropdown Menu */}
                            {projectMenuOpenId === project.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-1 top-8 w-36 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-dropdown z-50 p-1 flex flex-col text-xs animate-fadeIn"
                              >
                                <button
                                  onClick={() => {
                                    if (onNewChatInProject) onNewChatInProject(project.id);
                                    setProjectMenuOpenId(null);
                                  }}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[var(--surface-subtle)] text-[var(--foreground)] text-left"
                                >
                                  <Plus className="w-3 h-3 text-emerald-500" />
                                  <span>New Chat Here</span>
                                </button>
                                <button
                                  onClick={() => startRenameProject(project)}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[var(--surface-subtle)] text-[var(--foreground)] text-left"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Rename</span>
                                </button>
                                <div className="my-1 border-t border-[var(--border)]" />
                                <button
                                  onClick={() => {
                                    if (onDeleteProject) onDeleteProject(project.id);
                                    setProjectMenuOpenId(null);
                                  }}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 text-left"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete Project</span>
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Chats Inside Project Folder (When Expanded) */}
                      {expanded && (
                        <div className="pl-4 space-y-0.5 border-l border-[var(--border)] ml-3 my-0.5">
                          {projectChats.length === 0 ? (
                            <button
                              onClick={() => {
                                if (onNewChatInProject) onNewChatInProject(project.id);
                              }}
                              className="w-full text-left py-1 px-2 text-[11px] text-[var(--text-muted)] hover:text-[var(--foreground)] italic flex items-center gap-1.5"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Start a chat here</span>
                            </button>
                          ) : (
                            projectChats.map((conv) =>
                              renderChatRow(conv, project.id)
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* 4. RECENT CHATS SECTION */}
            <div className="space-y-1 pt-2 border-t border-[var(--border)]/60">
              <div className="px-1.5 py-1 text-[11px] font-semibold text-[#888888] tracking-wider uppercase">
                Recent Chats
              </div>

              {unassignedChats.length === 0 ? (
                <div className="px-2 py-3 text-center text-xs text-[var(--text-muted)] italic">
                  {searchQuery ? "No matching chats" : "No recent chats"}
                </div>
              ) : (
                unassignedChats.map((conv) => renderChatRow(conv, undefined))
              )}
            </div>
          </div>
        </div>

        {/* 5. Bottom User Profile & Settings Bar */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center justify-between gap-2">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2.5 text-left p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition flex-1 min-w-0"
            title="Account & Settings"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-[var(--foreground)] truncate">
                {userName}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                Enterprise 24/7 Active
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5 transition"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5 transition"
              title="Settings & Admin Console"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Share Modal Triggered from Sidebar Chat Context Menu */}
      {sharingConv && (
        <ShareModal
          isOpen={Boolean(sharingConv)}
          onClose={() => setSharingConv(null)}
          conversation={sharingConv}
          messages={store.getMessagesByConversation(sharingConv.id)}
        />
      )}
    </>
  );

  // Helper function to render a chat row (used for both project chats and recent chats)
  function renderChatRow(conv: Conversation, currentProjectId?: string) {
    const isActive = conv.id === activeConversationId;
    const isEditing = editingChatId === conv.id;

    return (
      <div
        key={conv.id}
        className={`relative group/chat rounded-lg text-xs flex items-center justify-between transition ${
          isActive
            ? "bg-[#EFEFEF] dark:bg-[#282828] text-[var(--foreground)] font-medium"
            : "text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5 font-normal"
        }`}
      >
        {isEditing ? (
          <div className="flex items-center gap-1 w-full px-2 py-1">
            <input
              type="text"
              value={editChatTitle}
              onChange={(e) => setEditChatTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRenameChat(conv.id);
                if (e.key === "Escape") setEditingChatId(null);
              }}
              autoFocus
              className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded px-1.5 py-0.5 text-xs text-[var(--foreground)] focus:outline-none min-w-0"
            />
            <button
              onClick={() => saveRenameChat(conv.id)}
              className="p-1 text-emerald-500"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => setEditingChatId(null)}
              className="p-1 text-rose-500"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => onSelectConversation(conv.id)}
              className="flex-1 text-left px-2.5 py-1.5 truncate"
              title={conv.title}
            >
              {conv.title}
            </button>

            {/* Chat Options Trigger */}
            <div className="pr-1 opacity-0 group-hover/chat:opacity-100 transition shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setChatMenuOpenId(chatMenuOpenId === conv.id ? null : conv.id);
                  setProjectMenuOpenId(null);
                  setMoveSubmenuChatId(null);
                }}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-black/10 dark:hover:bg-white/10"
                title="Chat options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Chat Context Dropdown Menu */}
            {chatMenuOpenId === conv.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-1 top-7 w-44 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-dropdown z-50 p-1 flex flex-col text-xs animate-fadeIn"
              >
                {/* Move to Project submenu toggle */}
                <button
                  onClick={() =>
                    setMoveSubmenuChatId(
                      moveSubmenuChatId === conv.id ? null : conv.id
                    )
                  }
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[var(--surface-subtle)] text-[var(--foreground)] text-left"
                >
                  <div className="flex items-center gap-2">
                    <FolderInput className="w-3 h-3 text-amber-500" />
                    <span>Move to Project</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
                </button>

                {/* Submenu for target projects */}
                {moveSubmenuChatId === conv.id && (
                  <div className="my-1 pl-2 pr-1 py-1 rounded-lg bg-[var(--surface-subtle)]/70 border border-[var(--border)] space-y-1">
                    {/* Option to remove from project if currently in one */}
                    {currentProjectId && (
                      <button
                        onClick={() => handleMoveChat(conv.id, undefined)}
                        className="w-full text-left px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-[11px] text-nova-500 font-medium flex items-center gap-1.5"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        <span>Remove from Project</span>
                      </button>
                    )}

                    {projects.length === 0 ? (
                      <div className="text-[10px] text-[var(--text-muted)] px-2 py-1 italic">
                        No projects available
                      </div>
                    ) : (
                      projects.map((p) => {
                        const isCurrent = p.id === currentProjectId;
                        return (
                          <button
                            key={p.id}
                            disabled={isCurrent}
                            onClick={() => handleMoveChat(conv.id, p.id)}
                            className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between truncate ${
                              isCurrent
                                ? "opacity-40 cursor-default"
                                : "hover:bg-black/5 dark:hover:bg-white/5 text-[var(--foreground)]"
                            }`}
                          >
                            <span className="truncate">{p.name}</span>
                            {isCurrent && (
                              <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {/* If already in project, also expose quick "Remove from Project" */}
                {currentProjectId && moveSubmenuChatId !== conv.id && (
                  <button
                    onClick={() => handleMoveChat(conv.id, undefined)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[var(--surface-subtle)] text-[var(--foreground)] text-left"
                  >
                    <CornerDownRight className="w-3 h-3 text-[var(--text-muted)]" />
                    <span>Remove from Project</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setSharingConv(conv);
                    setChatMenuOpenId(null);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[var(--surface-subtle)] text-[var(--foreground)] text-left"
                >
                  <Share2 className="w-3 h-3 text-indigo-500" />
                  <span>Share</span>
                </button>

                <button
                  onClick={() => startRenameChat(conv)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[var(--surface-subtle)] text-[var(--foreground)] text-left"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Rename</span>
                </button>

                <button
                  onClick={() => {
                    onUpdateConversation(conv.id, { isPinned: !conv.isPinned });
                    setChatMenuOpenId(null);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[var(--surface-subtle)] text-[var(--foreground)] text-left"
                >
                  <Pin className="w-3 h-3" />
                  <span>{conv.isPinned ? "Unpin" : "Pin"}</span>
                </button>

                <button
                  onClick={() => {
                    onUpdateConversation(conv.id, { isStarred: !conv.isStarred });
                    setChatMenuOpenId(null);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[var(--surface-subtle)] text-[var(--foreground)] text-left"
                >
                  <Bookmark className="w-3 h-3" />
                  <span>{conv.isStarred ? "Unsave" : "Save"}</span>
                </button>

                <button
                  onClick={() => {
                    onUpdateConversation(conv.id, { isArchived: true });
                    setChatMenuOpenId(null);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[var(--surface-subtle)] text-[var(--foreground)] text-left"
                >
                  <Archive className="w-3 h-3" />
                  <span>Archive</span>
                </button>

                <div className="my-1 border-t border-[var(--border)]" />

                <button
                  onClick={() => {
                    onDeleteConversation(conv.id);
                    setChatMenuOpenId(null);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 text-left"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
};
