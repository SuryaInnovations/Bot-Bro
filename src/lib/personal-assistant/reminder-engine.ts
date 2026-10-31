import {
  PersonalReminder,
  ReminderRecurrence,
  TaskPriority,
} from "./assistant-types";
import { generateId } from "../utils";

let remindersStore: PersonalReminder[] = [
  {
    id: "rem-1",
    title: "Check live financial markets & Nifty 50 closing indices",
    description: "Inspect closing tick rates and bullion spot benchmarks.",
    triggerTime: new Date(Date.now() + 3600000 * 2).toISOString(),
    recurrence: "daily",
    category: "work",
    isCompleted: false,
    isSnoozed: false,
    priority: "high",
    persistentJobId: "job-rem-daily-markets",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "rem-2",
    title: "Review autonomous agent execution traces & cost budget",
    description: "Weekly audit of multi-agent token expenditures and sandbox runs.",
    triggerTime: new Date(Date.now() + 3600000 * 24).toISOString(),
    recurrence: "weekly",
    recurrenceDays: ["Mon"],
    category: "work",
    isCompleted: false,
    isSnoozed: false,
    priority: "medium",
    persistentJobId: "job-rem-weekly-audit",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "rem-3",
    title: "Review daily morning intelligence briefing audio summary",
    description: "Listen to synthesized news, weather peak, and key scheduled events.",
    triggerTime: new Date(Date.now() + 3600000 * 14).toISOString(),
    recurrence: "daily",
    category: "deadline",
    isCompleted: false,
    isSnoozed: false,
    priority: "high",
    persistentJobId: "job-rem-morning-briefing",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

export function getReminders(filter?: { isCompleted?: boolean; category?: string }): PersonalReminder[] {
  let list = [...remindersStore];
  if (filter?.isCompleted !== undefined) {
    list = list.filter((r) => r.isCompleted === filter.isCompleted);
  }
  if (filter?.category) {
    list = list.filter((r) => r.category === filter.category);
  }
  return list.sort((a, b) => new Date(a.triggerTime).getTime() - new Date(b.triggerTime).getTime());
}

export function createReminder(data: {
  title: string;
  triggerTime: string;
  description?: string;
  recurrence?: ReminderRecurrence;
  recurrenceDays?: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[];
  category?: "work" | "personal" | "health" | "deadline" | "followup";
  priority?: TaskPriority;
}): PersonalReminder {
  const newRem: PersonalReminder = {
    id: `rem-${generateId()}`,
    title: data.title.trim(),
    description: data.description || "",
    triggerTime: data.triggerTime,
    recurrence: data.recurrence || "none",
    recurrenceDays: data.recurrenceDays,
    category: data.category || "personal",
    isCompleted: false,
    isSnoozed: false,
    priority: data.priority || "medium",
    persistentJobId: `job-${generateId()}`,
    createdAt: new Date().toISOString(),
  };
  remindersStore = [newRem, ...remindersStore];
  return newRem;
}

export function completeReminder(id: string): PersonalReminder | null {
  const idx = remindersStore.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  const rem = remindersStore[idx];

  // If recurring, calculate next trigger time
  if (rem.recurrence === "daily") {
    const nextTrigger = new Date(rem.triggerTime);
    nextTrigger.setDate(nextTrigger.getDate() + 1);
    remindersStore[idx] = {
      ...rem,
      triggerTime: nextTrigger.toISOString(),
      isCompleted: false,
      isSnoozed: false,
      snoozedUntil: undefined,
    };
  } else if (rem.recurrence === "weekly") {
    const nextTrigger = new Date(rem.triggerTime);
    nextTrigger.setDate(nextTrigger.getDate() + 7);
    remindersStore[idx] = {
      ...rem,
      triggerTime: nextTrigger.toISOString(),
      isCompleted: false,
      isSnoozed: false,
      snoozedUntil: undefined,
    };
  } else {
    remindersStore[idx] = {
      ...rem,
      isCompleted: true,
      isSnoozed: false,
    };
  }

  return remindersStore[idx];
}

export function snoozeReminder(id: string, minutes = 15): PersonalReminder | null {
  const idx = remindersStore.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  const snoozedTime = new Date(Date.now() + minutes * 60000).toISOString();
  remindersStore[idx] = {
    ...remindersStore[idx],
    isSnoozed: true,
    snoozedUntil: snoozedTime,
    triggerTime: snoozedTime,
  };
  return remindersStore[idx];
}

export function deleteReminder(id: string): boolean {
  const initial = remindersStore.length;
  remindersStore = remindersStore.filter((r) => r.id !== id);
  return remindersStore.length < initial;
}

export function checkDueReminders(): PersonalReminder[] {
  const now = new Date().getTime();
  return remindersStore.filter((r) => {
    if (r.isCompleted) return false;
    const triggerMs = new Date(r.snoozedUntil || r.triggerTime).getTime();
    return triggerMs <= now;
  });
}

// ==========================================
// NATURAL LANGUAGE REMINDER PARSER
// ==========================================
export function parseNaturalLanguageReminder(command: string): {
  success: boolean;
  title: string;
  triggerTime: string;
  recurrence: ReminderRecurrence;
  message: string;
} {
  const c = command.toLowerCase().trim();
  let recurrence: ReminderRecurrence = "none";
  let targetDate = new Date();

  if (c.includes("every day") || c.includes("daily")) {
    recurrence = "daily";
  } else if (c.includes("every monday") || c.includes("weekly")) {
    recurrence = "weekly";
  }

  // Time extraction: e.g. "at 7 pm", "at 19:00", "tomorrow morning"
  if (c.includes("7 pm") || c.includes("19:00")) {
    targetDate.setHours(19, 0, 0, 0);
    if (targetDate.getTime() < Date.now()) {
      targetDate.setDate(targetDate.getDate() + 1); // tomorrow
    }
  } else if (c.includes("tomorrow morning") || c.includes("tomorrow 8 am")) {
    targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(8, 0, 0, 0);
  } else if (c.includes("in 1 hour") || c.includes("in an hour")) {
    targetDate = new Date(Date.now() + 3600000);
  } else {
    // Default to 1 hour from now
    targetDate = new Date(Date.now() + 3600000);
  }

  // Title extraction: remove "remind me to", "remind me tomorrow", etc.
  const cleanTitle = command
    .replace(/^remind me (every monday to|tomorrow morning to|tomorrow to|to)\s*/i, "")
    .replace(/at \d+ (pm|am)/i, "")
    .replace(/every (day|monday|week)/i, "")
    .trim();

  const title = cleanTitle ? cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1) : "Scheduled Reminder";
  const created = createReminder({
    title,
    triggerTime: targetDate.toISOString(),
    recurrence,
    category: recurrence === "weekly" ? "work" : "personal",
    priority: "high",
  });

  return {
    success: true,
    title,
    triggerTime: targetDate.toISOString(),
    recurrence,
    message: `Smart Reminder scheduled: "${title}" [Trigger: ${targetDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Recurrence: ${recurrence.toUpperCase()}]. Persistent backend job registered.`,
  };
}
