import { AssistantBackgroundJob } from "./assistant-types";
import { checkDueReminders } from "./reminder-engine";
import { generateDailyBriefing } from "../realtime/daily-briefing";
import { runTopicMonitoringCrawl, getMonitoredTopics } from "./topic-monitor";
import { generateId } from "../utils";

let backgroundJobsStore: AssistantBackgroundJob[] = [
  {
    id: "job-morning-briefing",
    name: "Automated Morning Intelligence Briefing Dispatcher",
    type: "scheduled_briefing",
    scheduleCronOrInterval: "Daily at 08:00 IST",
    nextRunAt: new Date(Date.now() + 3600000 * 14).toISOString(),
    lastRunAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    lastStatus: "success",
    retryCount: 0,
    maxRetries: 3,
    isRecurring: true,
    enabled: true,
    details: { briefingType: "morning", city: "Bengaluru" },
  },
  {
    id: "job-evening-briefing",
    name: "Automated Evening Market Wrap & Task Summary",
    type: "scheduled_briefing",
    scheduleCronOrInterval: "Daily at 19:00 IST",
    nextRunAt: new Date(Date.now() + 3600000 * 2).toISOString(),
    lastRunAt: new Date(Date.now() - 3600000 * 22).toISOString(),
    lastStatus: "success",
    retryCount: 0,
    maxRetries: 3,
    isRecurring: true,
    enabled: true,
    details: { briefingType: "evening", city: "Bengaluru" },
  },
  {
    id: "job-reminder-dispatcher",
    name: "Continuous Persistent Reminder & Deadline Dispatcher",
    type: "reminder_dispatcher",
    scheduleCronOrInterval: "Every 60 seconds",
    nextRunAt: new Date(Date.now() + 60000).toISOString(),
    lastRunAt: new Date().toISOString(),
    lastStatus: "success",
    retryCount: 0,
    maxRetries: 5,
    isRecurring: true,
    enabled: true,
  },
  {
    id: "job-topic-crawler",
    name: "Multi-Source Research Topic Monitor & News Crawler",
    type: "topic_crawler",
    scheduleCronOrInterval: "Every 4 hours",
    nextRunAt: new Date(Date.now() + 3600000 * 2).toISOString(),
    lastRunAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastStatus: "success",
    retryCount: 0,
    maxRetries: 3,
    isRecurring: true,
    enabled: true,
  },
];

export function getBackgroundJobs(): AssistantBackgroundJob[] {
  return [...backgroundJobsStore];
}

export function updateBackgroundJob(
  id: string,
  updates: Partial<AssistantBackgroundJob>
): AssistantBackgroundJob | null {
  const idx = backgroundJobsStore.findIndex((j) => j.id === id);
  if (idx === -1) return null;

  backgroundJobsStore[idx] = {
    ...backgroundJobsStore[idx],
    ...updates,
  };
  return backgroundJobsStore[idx];
}

export function cancelBackgroundJob(id: string): boolean {
  const job = backgroundJobsStore.find((j) => j.id === id);
  if (!job) return false;
  job.enabled = false;
  job.lastStatus = "idle";
  return true;
}

// Trigger real execution of a background job
export async function triggerBackgroundJobExecution(jobId: string): Promise<{
  success: boolean;
  message: string;
  resultPayload?: any;
}> {
  const job = backgroundJobsStore.find((j) => j.id === jobId);
  if (!job) return { success: false, message: `Job ${jobId} not found.` };

  job.lastStatus = "running";
  job.lastRunAt = new Date().toISOString();

  try {
    let resultPayload: any = null;

    if (job.type === "scheduled_briefing") {
      const type = job.details?.briefingType || "morning";
      const city = job.details?.city || "Bengaluru";
      const briefing = await generateDailyBriefing(city, type);
      resultPayload = { title: briefing.title, summaryLength: briefing.executiveSummary.length };
    } else if (job.type === "reminder_dispatcher") {
      const due = checkDueReminders();
      resultPayload = { dueRemindersCount: due.length };
    } else if (job.type === "topic_crawler") {
      const topics = getMonitoredTopics();
      if (topics.length > 0) {
        await runTopicMonitoringCrawl(topics[0].id);
      }
      resultPayload = { monitoredTopicsScanned: topics.length };
    }

    job.lastStatus = "success";
    job.retryCount = 0;
    job.nextRunAt = new Date(Date.now() + 3600000 * 4).toISOString();

    return {
      success: true,
      message: `Background Job "${job.name}" executed successfully.`,
      resultPayload,
    };
  } catch (err: any) {
    job.lastStatus = "failed";
    job.retryCount++;
    return {
      success: false,
      message: `Job execution failed: ${err?.message || "Execution timeout"}. Retries recorded: ${job.retryCount}/${job.maxRetries}`,
    };
  }
}
