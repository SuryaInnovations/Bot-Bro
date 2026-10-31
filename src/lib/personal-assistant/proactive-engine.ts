import { ProactiveInsight } from "./assistant-types";
import { getTasks } from "./task-planner";
import { getCalendarEvents } from "./calendar-service";
import { getEmails } from "./email-service";
import { getMonitoredTopics } from "./topic-monitor";
import { generateId } from "../utils";

let dismissedInsightIds: Set<string> = new Set();

export function generateProactiveInsights(): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];
  const now = new Date().getTime();

  // 1. Check Imminent Task Deadlines (< 6 hours away)
  const pendingTasks = getTasks({ status: "pending" });
  pendingTasks.forEach((task) => {
    if (task.deadline) {
      const deadlineMs = new Date(task.deadline).getTime();
      const diffHours = (deadlineMs - now) / 3600000;
      if (diffHours > 0 && diffHours <= 6) {
        insights.push({
          id: `ins-deadline-${task.id}`,
          type: "deadline_warning",
          title: `Approaching Deadline: ${task.title}`,
          message: `This task is due in ${Math.round(diffHours * 10) / 10} hours. Focus block scheduled for immediate completion.`,
          severity: "warning",
          actionLabel: "View Task",
          actionPayload: { taskId: task.id },
          isDismissed: dismissedInsightIds.has(`ins-deadline-${task.id}`),
          createdAt: new Date().toISOString(),
        });
      }
    }
  });

  // 2. Check Calendar Schedule Conflicts
  const events = getCalendarEvents();
  events.forEach((ev) => {
    if (ev.conflictDetectedWith) {
      insights.push({
        id: `ins-conflict-${ev.id}`,
        type: "schedule_conflict",
        title: `Calendar Conflict Detected`,
        message: `Event "${ev.title}" overlaps with "${ev.conflictDetectedWith}". Consider rescheduling to an open slot.`,
        severity: "action_required",
        actionLabel: "Resolve Conflict",
        actionPayload: { eventId: ev.id },
        isDismissed: dismissedInsightIds.has(`ins-conflict-${ev.id}`),
        createdAt: new Date().toISOString(),
      });
    }
  });

  // 3. Check Unfinished Tasks Needing Rescheduling
  const todayStr = new Date().toISOString().split("T")[0];
  const overdueTasks = pendingTasks.filter((t) => t.scheduledDate && t.scheduledDate < todayStr);
  if (overdueTasks.length > 0) {
    insights.push({
      id: "ins-overdue-reschedule",
      type: "unfinished_task_reschedule",
      title: `${overdueTasks.length} Unfinished Tasks From Previous Days`,
      message: `You have ${overdueTasks.length} pending items that were not completed yesterday. Would you like me to move them to today's schedule?`,
      severity: "info",
      actionLabel: "Reschedule to Today",
      actionPayload: { count: overdueTasks.length },
      isDismissed: dismissedInsightIds.has("ins-overdue-reschedule"),
      createdAt: new Date().toISOString(),
    });
  }

  // 4. Check Unread Important Emails with Action Items
  const emails = getEmails();
  const unreadWithTasks = emails.filter((e) => !e.isRead && e.extractedTasks && e.extractedTasks.length > 0);
  if (unreadWithTasks.length > 0) {
    const topEmail = unreadWithTasks[0];
    insights.push({
      id: `ins-email-${topEmail.id}`,
      type: "project_followup",
      title: `Action Items in Unread Email: ${topEmail.subject}`,
      message: `Email from ${topEmail.from} contains ${topEmail.extractedTasks?.length} extracted tasks awaiting your review.`,
      severity: "info",
      actionLabel: "Extract Tasks",
      actionPayload: { emailId: topEmail.id },
      isDismissed: dismissedInsightIds.has(`ins-email-${topEmail.id}`),
      createdAt: new Date().toISOString(),
    });
  }

  // 5. Monitored Topic Alerts
  const topics = getMonitoredTopics();
  topics.forEach((top) => {
    if (top.newDevelopmentsCount > 0 && top.activeAlerts.length > 0) {
      insights.push({
        id: `ins-topic-${top.id}`,
        type: "topic_alert",
        title: `Intelligence Alert: ${top.topic}`,
        message: top.activeAlerts[0],
        severity: "info",
        actionLabel: "View Citations",
        actionPayload: { topicId: top.id },
        isDismissed: dismissedInsightIds.has(`ins-topic-${top.id}`),
        createdAt: new Date().toISOString(),
      });
    }
  });

  return insights.filter((i) => !i.isDismissed);
}

export function dismissProactiveInsight(id: string): void {
  dismissedInsightIds.add(id);
}
