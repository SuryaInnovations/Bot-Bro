import { Citation } from "@/types";

export type TaskPriority = "urgent" | "high" | "medium" | "low";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type TaskCategory =
  | "work"
  | "personal"
  | "learning"
  | "health"
  | "finance"
  | "errands"
  | "research";

export interface PersonalTask {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  deadline?: string; // ISO string or YYYY-MM-DD
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTimeSlot?: string; // e.g. "09:00 - 10:30"
  estimatedDurationMins: number;
  tags: string[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReminderRecurrence = "none" | "daily" | "weekly" | "monthly" | "custom";

export interface PersonalReminder {
  id: string;
  title: string;
  description?: string;
  triggerTime: string; // ISO timestamp
  recurrence: ReminderRecurrence;
  recurrenceDays?: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[];
  category: "work" | "personal" | "health" | "deadline" | "followup";
  isCompleted: boolean;
  isSnoozed: boolean;
  snoozedUntil?: string;
  priority: TaskPriority;
  persistentJobId?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  isAllDay: boolean;
  location?: string;
  recurrence?: ReminderRecurrence;
  attendees?: string[];
  hasReminder: boolean;
  reminderMinutesBefore?: number;
  source: "local" | "google_calendar" | "external";
  requiresApprovalForModification: boolean;
  conflictDetectedWith?: string; // Title of overlapping event
}

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  isRead: boolean;
  isImportant: boolean;
  category: "work" | "updates" | "personal" | "finance";
  extractedTasks?: { title: string; deadline?: string; priority: TaskPriority }[];
  draftedReply?: string;
  requiresApprovalToSend: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
}

export interface MonitoredTopic {
  id: string;
  topic: string;
  keywords: string[];
  category: "ai" | "tech" | "companies" | "products" | "research" | "government" | "business";
  intervalHours: number;
  lastCheckedAt: string;
  newDevelopmentsCount: number;
  activeAlerts: string[];
  latestHeadline?: string;
  citations: Citation[];
  enabled: boolean;
}

export type ProactiveInsightType =
  | "deadline_warning"
  | "unfinished_task_reschedule"
  | "schedule_conflict"
  | "topic_alert"
  | "daily_briefing_ready"
  | "project_followup";

export interface ProactiveInsight {
  id: string;
  type: ProactiveInsightType;
  title: string;
  message: string;
  severity: "info" | "warning" | "action_required";
  actionLabel?: string;
  actionPayload?: any;
  isDismissed: boolean;
  createdAt: string;
}

export interface PersonalNotification {
  id: string;
  title: string;
  message: string;
  type: "reminder" | "task_complete" | "research_alert" | "workflow_complete" | "agent_complete" | "system";
  isRead: boolean;
  actionUrl?: string;
  timestamp: string;
}

export interface AssistantBackgroundJob {
  id: string;
  name: string;
  type:
    | "scheduled_briefing"
    | "topic_crawler"
    | "reminder_dispatcher"
    | "daily_cleanup"
    | "workflow_runner";
  scheduleCronOrInterval: string; // e.g. "08:00 daily", "every 60s"
  nextRunAt: string;
  lastRunAt?: string;
  lastStatus: "success" | "failed" | "running" | "idle";
  retryCount: number;
  maxRetries: number;
  isRecurring: boolean;
  enabled: boolean;
  details?: Record<string, any>;
}

export interface PersonalAssistantSettings {
  assistantName: string;
  preferredLanguage: string;
  timezone: string;
  morningBriefingTime: string; // "08:00"
  eveningBriefingTime: string; // "19:00"
  briefingCategories: string[];
  reminderSound: boolean;
  enableProactiveSuggestions: boolean;
  enableBrowserNotifications: boolean;
  connectedIntegrations: {
    googleCalendar: boolean;
    gmail: boolean;
  };
  voiceSpeed: number;
  voiceGender: "neutral" | "female" | "male";
  memoryEnabled: boolean;
  personalInstructions?: string;
}
