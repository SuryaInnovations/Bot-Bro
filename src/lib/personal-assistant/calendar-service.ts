import { CalendarEvent } from "./assistant-types";
import { generateId } from "../utils";

const today = new Date();
const todayStr = today.toISOString().split("T")[0];

let calendarEventsStore: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "Executive Architecture & Roadmap Review",
    description: "Align with engineering team on Claude 3.7 Sonnet dynamic reasoning and multi-agent deployment.",
    startTime: `${todayStr}T10:00:00.000Z`,
    endTime: `${todayStr}T11:00:00.000Z`,
    isAllDay: false,
    location: "Google Meet / Virtual Conference Room Alpha",
    attendees: ["engineering@nova.ai", "architect@nova.ai"],
    hasReminder: true,
    reminderMinutesBefore: 15,
    source: "google_calendar",
    requiresApprovalForModification: true,
  },
  {
    id: "evt-2",
    title: "Client Technical Demonstration & Deliverable Walkthrough",
    description: "Present live interactive website artifacts and verified research dossiers.",
    startTime: `${todayStr}T14:30:00.000Z`,
    endTime: `${todayStr}T15:30:00.000Z`,
    isAllDay: false,
    location: "Executive Briefing Center",
    attendees: ["stakeholder@enterprise.com"],
    hasReminder: true,
    reminderMinutesBefore: 10,
    source: "google_calendar",
    requiresApprovalForModification: true,
  },
  {
    id: "evt-3",
    title: "Focus Time: Deep Code Sandbox & System Optimization",
    description: "Refactor rate-limiting structures and test 100+ automated test cases.",
    startTime: `${todayStr}T16:00:00.000Z`,
    endTime: `${todayStr}T17:30:00.000Z`,
    isAllDay: false,
    hasReminder: false,
    source: "local",
    requiresApprovalForModification: false,
  },
];

export function getCalendarEvents(): CalendarEvent[] {
  // Sort and run conflict detector
  const sorted = [...calendarEventsStore].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Check for conflicts
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i];
    cur.conflictDetectedWith = undefined;
    for (let j = 0; j < sorted.length; j++) {
      if (i === j) continue;
      const other = sorted[j];
      const curStart = new Date(cur.startTime).getTime();
      const curEnd = new Date(cur.endTime).getTime();
      const otherStart = new Date(other.startTime).getTime();
      const otherEnd = new Date(other.endTime).getTime();

      // Check overlap
      if (curStart < otherEnd && curEnd > otherStart) {
        cur.conflictDetectedWith = other.title;
        break;
      }
    }
  }

  return sorted;
}

export function createCalendarEvent(data: {
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  attendees?: string[];
  reminderMinutesBefore?: number;
  source?: "local" | "google_calendar";
}): { event: CalendarEvent; conflictWarning?: string } {
  const newEvt: CalendarEvent = {
    id: `evt-${generateId()}`,
    title: data.title.trim(),
    description: data.description || "",
    startTime: data.startTime,
    endTime: data.endTime,
    isAllDay: false,
    location: data.location,
    attendees: data.attendees || [],
    hasReminder: (data.reminderMinutesBefore ?? 15) > 0,
    reminderMinutesBefore: data.reminderMinutesBefore || 15,
    source: data.source || "local",
    requiresApprovalForModification: true,
  };

  calendarEventsStore = [...calendarEventsStore, newEvt];
  const all = getCalendarEvents();
  const created = all.find((e) => e.id === newEvt.id) || newEvt;

  let conflictWarning: string | undefined;
  if (created.conflictDetectedWith) {
    conflictWarning = `Schedule Conflict Warning: This event overlaps with "${created.conflictDetectedWith}".`;
  }

  return { event: created, conflictWarning };
}

export function deleteCalendarEvent(id: string): boolean {
  const initial = calendarEventsStore.length;
  calendarEventsStore = calendarEventsStore.filter((e) => e.id !== id);
  return calendarEventsStore.length < initial;
}

// Available time slot finder across a given day
export function findAvailableTimeSlots(
  dateStr = todayStr,
  durationMinutes = 60
): { start: string; end: string; slotLabel: string }[] {
  const dayEvents = calendarEventsStore.filter(
    (e) => e.startTime.startsWith(dateStr) || e.endTime.startsWith(dateStr)
  );

  const workDayStartHour = 9; // 09:00 AM
  const workDayEndHour = 18; // 18:00 PM
  const openSlots: { start: string; end: string; slotLabel: string }[] = [];

  for (let hour = workDayStartHour; hour < workDayEndHour; hour++) {
    const slotStart = new Date(`${dateStr}T${String(hour).padStart(2, "0")}:00:00.000Z`);
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

    const hasConflict = dayEvents.some((ev) => {
      const evStart = new Date(ev.startTime).getTime();
      const evEnd = new Date(ev.endTime).getTime();
      return slotStart.getTime() < evEnd && slotEnd.getTime() > evStart;
    });

    if (!hasConflict) {
      const sStr = slotStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const eStr = slotEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      openSlots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        slotLabel: `${sStr} - ${eStr}`,
      });
    }
  }

  return openSlots;
}
