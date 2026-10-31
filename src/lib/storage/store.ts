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
import { generateId } from "../utils";

const STORAGE_KEYS = {
  CONVERSATIONS: "nova_conversations",
  MESSAGES: "nova_messages",
  ARTIFACTS: "nova_artifacts",
  PROJECTS: "nova_projects",
  MEMORIES: "nova_memories",
  PREFERENCES: "nova_preferences",
  USAGE: "nova_usage",
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  userName: "Saleh",
  defaultModel: "gemini-flash-lite-latest",
  responseStyle: "normal",
  enableThinking: true,
  thinkingBudget: 2048,
  enableWebSearch: true,
  enableCodeExecution: true,
  streamResponses: true,
  fontSize: "md",
};

// Initial welcome conversation for first-time launch
export const INITIAL_CONVERSATION: Conversation = {
  id: "welcome-chat",
  title: "New Chat",
  model: "gemini-flash-lite-latest",
  responseStyle: "normal",
  isPinned: false,
  isStarred: false,
  isArchived: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const INITIAL_MESSAGES: Message[] = [];

class StorageManager {
  private isClient = typeof window !== "undefined";

  // --- PREFERENCES ---
  getPreferences(): UserPreferences {
    if (!this.isClient) return DEFAULT_PREFERENCES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
    if (!this.isClient) return DEFAULT_PREFERENCES;
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
    return updated;
  }

  // --- CONVERSATIONS ---
  getConversations(userId?: string): Conversation[] {
    if (!this.isClient) return [INITIAL_CONVERSATION];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (!data) {
        this.saveConversations([INITIAL_CONVERSATION]);
        return [INITIAL_CONVERSATION];
      }
      const all: Conversation[] = JSON.parse(data);
      if (userId) {
        return all.filter((c) => !c.userId || c.userId === userId);
      }
      return all;
    } catch {
      return [INITIAL_CONVERSATION];
    }
  }

  saveConversations(conversations: Conversation[]): void {
    if (!this.isClient) return;
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  }

  getConversation(id: string): Conversation | undefined {
    return this.getConversations().find((c) => c.id === id);
  }

  createConversation(options?: Partial<Conversation>): Conversation {
    const prefs = this.getPreferences();
    const newConv: Conversation = {
      id: generateId(),
      title: options?.title || "New Chat",
      model: options?.model || prefs.defaultModel,
      projectId: options?.projectId,
      systemPrompt: options?.systemPrompt,
      responseStyle: options?.responseStyle || prefs.responseStyle,
      isPinned: false,
      isStarred: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...options,
    };
    const conversations = [newConv, ...this.getConversations()];
    this.saveConversations(conversations);
    return newConv;
  }

  updateConversation(id: string, updates: Partial<Conversation>): Conversation | null {
    const conversations = this.getConversations();
    const index = conversations.findIndex((c) => c.id === id);
    if (index === -1) return null;

    conversations[index] = {
      ...conversations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveConversations(conversations);
    return conversations[index];
  }

  deleteConversation(id: string): void {
    const conversations = this.getConversations().filter((c) => c.id !== id);
    this.saveConversations(conversations);
    // Also remove associated messages
    const messages = this.getMessages().filter((m) => m.conversationId !== id);
    this.saveMessages(messages);
  }

  // Helper to remove any legacy welcome message
  private sanitizeMessages(messages: Message[]): Message[] {
    return (messages || []).filter(
      (m) =>
        m.id !== "welcome-msg-1" &&
        !m.content?.includes("Here are some of the things you can do with NOVA AI")
    );
  }

  // --- MESSAGES ---
  getMessages(): Message[] {
    if (!this.isClient) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!data) {
        return [];
      }
      const parsed: Message[] = JSON.parse(data);
      const sanitized = this.sanitizeMessages(parsed);
      if (sanitized.length !== parsed.length) {
        // Automatically prune legacy welcome message from localStorage
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(sanitized));
      }
      return sanitized;
    } catch {
      return [];
    }
  }

  saveMessages(messages: Message[]): void {
    if (!this.isClient) return;
    const sanitized = this.sanitizeMessages(messages);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(sanitized));
  }

  getMessagesByConversation(conversationId: string): Message[] {
    return this.getMessages().filter((m) => m.conversationId === conversationId);
  }

  addMessage(msg: Omit<Message, "id" | "createdAt"> & { id?: string }): Message {
    const newMessage: Message = {
      id: msg.id || generateId(),
      createdAt: new Date().toISOString(),
      ...msg,
    };
    const cleanExisting = this.sanitizeMessages(this.getMessages());
    const messages = [...cleanExisting, newMessage];
    this.saveMessages(messages);

    // Update conversation's updatedAt timestamp
    this.updateConversation(msg.conversationId, {});
    return newMessage;
  }

  updateMessage(id: string, updates: Partial<Message>): Message | null {
    const messages = this.getMessages();
    const index = messages.findIndex((m) => m.id === id);
    if (index === -1) return null;

    messages[index] = { ...messages[index], ...updates };
    this.saveMessages(messages);
    return messages[index];
  }

  deleteMessage(id: string): void {
    const messages = this.getMessages().filter((m) => m.id !== id);
    this.saveMessages(messages);
  }

  // --- ARTIFACTS ---
  getArtifacts(): Artifact[] {
    if (!this.isClient) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ARTIFACTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveArtifacts(artifacts: Artifact[]): void {
    if (!this.isClient) return;
    localStorage.setItem(STORAGE_KEYS.ARTIFACTS, JSON.stringify(artifacts));
  }

  getArtifact(id: string): Artifact | undefined {
    return this.getArtifacts().find((a) => a.id === id);
  }

  saveArtifact(artifact: Omit<Artifact, "createdAt" | "updatedAt">): Artifact {
    const artifacts = this.getArtifacts();
    const existingIndex = artifacts.findIndex((a) => a.id === artifact.id);

    const now = new Date().toISOString();
    let saved: Artifact;

    if (existingIndex >= 0) {
      const existing = artifacts[existingIndex];
      const newVersion = (existing.version || 1) + 1;
      const versions = existing.versions || [
        { version: existing.version || 1, content: existing.content, createdAt: existing.createdAt },
      ];
      versions.push({ version: newVersion, content: artifact.content, createdAt: now });

      saved = {
        ...existing,
        ...artifact,
        version: newVersion,
        versions,
        updatedAt: now,
      };
      artifacts[existingIndex] = saved;
    } else {
      saved = {
        ...artifact,
        version: 1,
        versions: [{ version: 1, content: artifact.content, createdAt: now }],
        createdAt: now,
        updatedAt: now,
      };
      artifacts.unshift(saved);
    }

    this.saveArtifacts(artifacts);
    return saved;
  }

  // --- PROJECTS ---
  getProjects(userId?: string): Project[] {
    if (!this.isClient) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const all: Project[] = data ? JSON.parse(data) : [];
      if (userId) {
        return all.filter((p) => !p.userId || p.userId === userId);
      }
      return all;
    } catch {
      return [];
    }
  }

  saveProjects(projects: Project[]): void {
    if (!this.isClient) return;
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  createProject(
    proj: Omit<Project, "id" | "createdAt" | "updatedAt" | "knowledgeFiles"> & {
      knowledgeFiles?: Attachment[];
    }
  ): Project {
    const newProj: Project = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      knowledgeFiles: [],
      ...proj,
    };
    const projects = [newProj, ...this.getProjects()];
    this.saveProjects(projects);
    return newProj;
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const projects = this.getProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return null;
    projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveProjects(projects);
    return projects[index];
  }

  deleteProject(id: string): void {
    const projects = this.getProjects().filter((p) => p.id !== id);
    this.saveProjects(projects);
    // Unassign conversations from this project so they return to Recent Chats without losing any messages
    const conversations = this.getConversations().map((c) => {
      if (c.projectId === id) {
        const copy = { ...c };
        delete copy.projectId;
        return copy;
      }
      return c;
    });
    this.saveConversations(conversations);
  }

  moveConversationToProject(conversationId: string, projectId?: string): Conversation | null {
    const conversations = this.getConversations();
    const index = conversations.findIndex((c) => c.id === conversationId);
    if (index === -1) return null;
    if (projectId) {
      conversations[index] = { ...conversations[index], projectId, updatedAt: new Date().toISOString() };
    } else {
      const copy = { ...conversations[index], updatedAt: new Date().toISOString() };
      delete copy.projectId;
      conversations[index] = copy;
    }
    this.saveConversations(conversations);
    return conversations[index];
  }

  // --- MEMORIES ---
  getMemories(): UserMemory[] {
    if (!this.isClient) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMORIES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveMemories(memories: UserMemory[]): void {
    if (!this.isClient) return;
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
  }

  addMemory(content: string, category: UserMemory["category"] = "preference", projectId?: string): UserMemory {
    const newMem: UserMemory = {
      id: generateId(),
      content,
      category,
      projectId,
      createdAt: new Date().toISOString(),
    };
    const memories = [newMem, ...this.getMemories()];
    this.saveMemories(memories);
    return newMem;
  }

  deleteMemory(id: string): void {
    const memories = this.getMemories().filter((m) => m.id !== id);
    this.saveMemories(memories);
  }

  // --- USAGE ---
  getUsageRecords(): UsageRecord[] {
    if (!this.isClient) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USAGE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  recordUsage(record: Omit<UsageRecord, "id" | "date">): void {
    if (!this.isClient) return;
    const current = this.getUsageRecords();
    const newRecord: UsageRecord = {
      id: generateId(),
      date: new Date().toISOString().split("T")[0],
      ...record,
    };
    current.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(current.slice(0, 100)));
  }

  // --- EXPORT & IMPORT ---
  exportAllData(): string {
    return JSON.stringify(
      {
        version: "1.0",
        exportDate: new Date().toISOString(),
        preferences: this.getPreferences(),
        conversations: this.getConversations(),
        messages: this.getMessages(),
        artifacts: this.getArtifacts(),
        projects: this.getProjects(),
        memories: this.getMemories(),
        usage: this.getUsageRecords(),
      },
      null,
      2
    );
  }

  importData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.conversations) this.saveConversations(parsed.conversations);
      if (parsed.messages) this.saveMessages(parsed.messages);
      if (parsed.artifacts) this.saveArtifacts(parsed.artifacts);
      if (parsed.projects) this.saveProjects(parsed.projects);
      if (parsed.memories) this.saveMemories(parsed.memories);
      if (parsed.preferences) this.savePreferences(parsed.preferences);
      return true;
    } catch {
      return false;
    }
  }

  clearAllData(): void {
    if (!this.isClient) return;
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
}

export const store = new StorageManager();
