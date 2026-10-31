import {
  CalendarEvent,
  PersonalTask,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from "./assistant-types";
import { generateId } from "../utils";

// Initial tasks catalogue
let tasksStore: PersonalTask[] = [
  {
    id: "task-1",
    title: "Review Claude 3.7 dynamic hybrid reasoning documentation",
    description: "Inspect Anthropic release notes and verify thinking budget controls.",
    priority: "urgent",
    status: "pending",
    category: "learning",
    deadline: new Date(Date.now() + 3600000 * 5).toISOString(),
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTimeSlot: "09:30 - 10:30",
    estimatedDurationMins: 60,
    tags: ["AI", "Anthropic", "Docs"],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-2",
    title: "Execute security audit on Supabase RLS and token storage",
    description: "Verify tenant isolation policies and authenticate background job ownership.",
    priority: "high",
    status: "in_progress",
    category: "work",
    deadline: new Date(Date.now() + 3600000 * 8).toISOString(),
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTimeSlot: "11:00 - 12:30",
    estimatedDurationMins: 90,
    tags: ["Security", "Database", "RLS"],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-3",
    title: "Analyze quarterly semiconductor and tech market trends",
    description: "Extract benchmark charts for India Semiconductor Mission and global foundries.",
    priority: "medium",
    status: "pending",
    category: "research",
    deadline: new Date(Date.now() + 3600000 * 24).toISOString(),
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTimeSlot: "14:00 - 15:00",
    estimatedDurationMins: 60,
    tags: ["Research", "Markets"],
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-4",
    title: "Deploy Autonomous Multi-Agent Swarm 2.0 to production server",
    description: "Verify Next.js build and test 102 automated assertions with 0 failures.",
    priority: "high",
    status: "completed",
    category: "work",
    deadline: new Date(Date.now() - 3600000).toISOString(),
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTimeSlot: "16:00 - 17:00",
    estimatedDurationMins: 60,
    tags: ["DevOps", "Agents"],
    completedAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getTasks(filter?: { status?: TaskStatus; priority?: TaskPriority; category?: TaskCategory }): PersonalTask[] {
  let list = [...tasksStore];
  if (filter?.status) list = list.filter((t) => t.status === filter.status);
  if (filter?.priority) list = list.filter((t) => t.priority === filter.priority);
  if (filter?.category) list = list.filter((t) => t.category === filter.category);

  // Sort by priority weight and deadline
  const priorityWeight: Record<TaskPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
  return list.sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (diff !== 0) return diff;
    if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    return 0;
  });
}

export function createTask(data: Partial<PersonalTask> & { title: string }): PersonalTask {
  const now = new Date().toISOString();
  const newTask: PersonalTask = {
    id: `task-${generateId()}`,
    title: data.title.trim(),
    description: data.description || "",
    priority: data.priority || "medium",
    status: data.status || "pending",
    category: data.category || "work",
    deadline: data.deadline,
    scheduledDate: data.scheduledDate || now.split("T")[0],
    scheduledTimeSlot: data.scheduledTimeSlot,
    estimatedDurationMins: data.estimatedDurationMins || 45,
    tags: data.tags || [],
    createdAt: now,
    updatedAt: now,
  };
  tasksStore = [newTask, ...tasksStore];
  return newTask;
}

export function updateTask(id: string, updates: Partial<PersonalTask>): PersonalTask | null {
  const idx = tasksStore.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  if (updates.status === "completed" && tasksStore[idx].status !== "completed") {
    updates.completedAt = now;
  }

  tasksStore[idx] = {
    ...tasksStore[idx],
    ...updates,
    updatedAt: now,
  };
  return tasksStore[idx];
}

export function deleteTask(id: string): boolean {
  const initialLen = tasksStore.length;
  tasksStore = tasksStore.filter((t) => t.id !== id);
  return tasksStore.length < initialLen;
}

export function completeTask(id: string): PersonalTask | null {
  return updateTask(id, { status: "completed" });
}

export function rescheduleUnfinishedTasks(toTomorrow = false): { rescheduledCount: number; rescheduledTasks: PersonalTask[] } {
  const todayStr = new Date().toISOString().split("T")[0];
  const targetDate = new Date();
  if (toTomorrow) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  const targetDateStr = targetDate.toISOString().split("T")[0];

  const rescheduled: PersonalTask[] = [];

  tasksStore = tasksStore.map((t) => {
    if (t.status !== "completed" && (!t.scheduledDate || t.scheduledDate < todayStr || toTomorrow)) {
      const updated = {
        ...t,
        scheduledDate: targetDateStr,
        updatedAt: new Date().toISOString(),
      };
      rescheduled.push(updated);
      return updated;
    }
    return t;
  });

  return { rescheduledCount: rescheduled.length, rescheduledTasks: rescheduled };
}

// ==========================================
// DAILY SCHEDULE & CONFLICT RESOLVER
// ==========================================
export function generateDailySchedule(
  tasks: PersonalTask[],
  events: CalendarEvent[]
): {
  schedule: { timeSlot: string; itemType: "event" | "task"; title: string; priority?: TaskPriority; isConflict?: boolean }[];
  conflicts: string[];
} {
  const schedule: { timeSlot: string; itemType: "event" | "task"; title: string; priority?: TaskPriority; isConflict?: boolean }[] = [];
  const conflicts: string[] = [];

  // Add all scheduled calendar events
  events.forEach((ev) => {
    const start = new Date(ev.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const end = new Date(ev.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    schedule.push({
      timeSlot: `${start} - ${end}`,
      itemType: "event",
      title: ev.title,
    });
  });

  // Slot pending tasks into open work blocks
  const pending = tasks.filter((t) => t.status !== "completed");
  const defaultSlots = [
    "09:00 - 10:15",
    "10:30 - 11:45",
    "13:30 - 14:45",
    "15:00 - 16:15",
    "16:30 - 17:30",
  ];

  let slotIdx = 0;
  pending.forEach((task) => {
    if (slotIdx < defaultSlots.length) {
      const slot = task.scheduledTimeSlot || defaultSlots[slotIdx];
      // Check if slot overlaps with an event
      const hasConflict = events.some((ev) => {
        const evStart = new Date(ev.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return slot.includes(evStart);
      });

      if (hasConflict) {
        conflicts.push(`Task "${task.title}" overlaps with a calendar appointment.`);
      }

      schedule.push({
        timeSlot: slot,
        itemType: "task",
        title: task.title,
        priority: task.priority,
        isConflict: hasConflict,
      });
      slotIdx++;
    }
  });

  return { schedule, conflicts };
}

// ==========================================
// NATURAL LANGUAGE COMMAND PARSER
// ==========================================
export function parseNaturalLanguageTaskCommand(command: string): {
  intent: "plan_day" | "schedule_tomorrow" | "reschedule_unfinished" | "show_important" | "create_task" | "unknown";
  message: string;
  payload?: any;
} {
  const c = command.toLowerCase().trim();

  if (c.includes("plan my day") || c.includes("plan today") || c.includes("daily schedule")) {
    const todayTasks = getTasks().filter((t) => t.status !== "completed");
    return {
      intent: "plan_day",
      message: `Formulated your daily plan with ${todayTasks.length} pending priority activities organized by available focus blocks.`,
      payload: { tasks: todayTasks },
    };
  }

  if (c.includes("schedule for tomorrow") || c.includes("tomorrow's schedule") || c.includes("plan tomorrow")) {
    const { rescheduledTasks } = rescheduleUnfinishedTasks(true);
    return {
      intent: "schedule_tomorrow",
      message: `Created tomorrow's operational schedule with ${rescheduledTasks.length} priority activities queued.`,
      payload: { tasks: rescheduledTasks },
    };
  }

  if (c.includes("move my unfinished tasks to tomorrow") || c.includes("reschedule unfinished")) {
    const { rescheduledCount } = rescheduleUnfinishedTasks(true);
    return {
      intent: "reschedule_unfinished",
      message: `Successfully rescheduled ${rescheduledCount} unfinished tasks to tomorrow morning.`,
      payload: { count: rescheduledCount },
    };
  }

  if (c.includes("show my important tasks") || c.includes("important tasks") || c.includes("urgent tasks")) {
    const important = getTasks().filter((t) => (t.priority === "urgent" || t.priority === "high") && t.status !== "completed");
    return {
      intent: "show_important",
      message: `Found ${important.length} high-priority / urgent tasks requiring your immediate focus.`,
      payload: { tasks: important },
    };
  }

  if (c.startsWith("create task") || c.startsWith("add task") || c.startsWith("remind me to")) {
    const title = command.replace(/^(create task|add task|remind me to)[:\s]*/i, "").trim();
    if (title) {
      const isUrgent = c.includes("urgent") || c.includes("asap");
      const isHigh = c.includes("high priority") || c.includes("important");
      const priority: TaskPriority = isUrgent ? "urgent" : isHigh ? "high" : "medium";
      const created = createTask({ title, priority });
      return {
        intent: "create_task",
        message: `Task created: "${created.title}" [Priority: ${priority.toUpperCase()}]. Added to your daily planner.`,
        payload: { task: created },
      };
    }
  }

  return {
    intent: "unknown",
    message: `Received command: "${command}". Ask me to "Plan my day", "Move unfinished tasks to tomorrow", or "Show my important tasks".`,
  };
}
