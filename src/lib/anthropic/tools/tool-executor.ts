import { executeCodeInSandbox } from "@/lib/code-sandbox";
import { fetchWebPageContent, performWebSearch } from "@/lib/web-search";
import { store } from "@/lib/storage/store";

export interface ToolExecutionContext {
  userId?: string;
  conversationId?: string;
  timeoutMs?: number;
}

export interface ExecutedToolResult {
  toolUseId: string;
  name: string;
  output: any;
  isError: boolean;
  durationMs: number;
}

export async function executeToolCall(
  name: string,
  toolUseId: string,
  input: Record<string, any>,
  context?: ToolExecutionContext
): Promise<ExecutedToolResult> {
  const startTime = Date.now();
  let output: any;
  let isError = false;

  try {
    switch (name) {
      // 1. Web Search
      case "web_search": {
        const query = input.query || input.search_query || "";
        const searchRes = await performWebSearch(query);
        output = {
          query,
          results: searchRes.results,
          citations: searchRes.citations,
        };
        break;
      }

      // 2. Web Fetch
      case "web_fetch": {
        const url = input.url || "";
        output = await fetchWebPageContent(url);
        break;
      }

      // 3. Code Execution Sandbox
      case "code_execution":
      case "execute_code": {
        const language = input.language || "python";
        const code = input.code || "";
        output = await executeCodeInSandbox(language, code, context?.timeoutMs || 15000);
        if (!output.success) isError = true;
        break;
      }

      // 4. Memory Tool (Client Tool)
      case "memory": {
        const action = input.action;
        const key = input.key;
        const value = input.value || "";

        if (action === "create" || action === "update") {
          store.addMemory(`${key}: ${value}`);
          output = { success: true, message: `Stored memory: ${key}` };
        } else if (action === "delete") {
          const memories = store.getMemories().filter((m) => !m.content.startsWith(`${key}:`));
          store.saveMemories(memories);
          output = { success: true, message: `Deleted memory for key: ${key}` };
        } else {
          const found = store.getMemories().filter((m) => m.content.toLowerCase().includes(key.toLowerCase()));
          output = { success: true, memories: found };
        }
        break;
      }

      // 5. Text Editor Tool (Client Tool)
      case "text_editor": {
        output = {
          success: true,
          command: input.command,
          message: `Text editor command ${input.command} on ${input.path} acknowledged.`,
        };
        break;
      }

      // 6. Bash Tool (Client Tool)
      case "bash": {
        // Execute bash/command in isolated sandbox runner
        output = await executeCodeInSandbox("javascript", `console.log("Simulated command output: ${input.command}");`);
        break;
      }

      // 7. Artifact creation
      case "create_artifact": {
        output = {
          success: true,
          identifier: input.identifier,
          title: input.title,
        };
        break;
      }

      // 8. Live Weather
      case "live_weather": {
        const { fetchLiveWeather } = await import("@/lib/realtime/weather");
        output = await fetchLiveWeather(input.city || "Bengaluru");
        break;
      }

      // 9. Live Finance & Bullion
      case "live_finance": {
        const { fetchLiveFinanceSnapshot } = await import("@/lib/realtime/finance");
        output = await fetchLiveFinanceSnapshot();
        break;
      }

      // 10. Live News & Briefings
      case "live_news": {
        const { fetchCategorizedNews } = await import("@/lib/realtime/news");
        output = await fetchCategorizedNews(input.category || "breaking", input.limit || 5);
        break;
      }

      // 11. Fact Verification
      case "verify_fact": {
        const { verifyFactualClaim } = await import("@/lib/realtime/fact-verifier");
        output = await verifyFactualClaim(input.claim || "");
        break;
      }

      // 12. Personal Tasks
      case "manage_tasks": {
        const { getTasks, createTask, rescheduleUnfinishedTasks } = await import("@/lib/personal-assistant/task-planner");
        if (input.action === "create") {
          output = createTask({ title: input.title, priority: input.priority });
        } else if (input.action === "reschedule_unfinished") {
          output = rescheduleUnfinishedTasks(true);
        } else {
          output = getTasks();
        }
        break;
      }

      // 13. Reminders
      case "manage_reminders": {
        const { getReminders, createReminder } = await import("@/lib/personal-assistant/reminder-engine");
        if (input.action === "create") {
          output = createReminder({
            title: input.title,
            triggerTime: input.triggerTime || input.dueTime || new Date().toISOString(),
            recurrence: input.recurrence,
          });
        } else {
          output = getReminders();
        }
        break;
      }

      // 14. Calendar
      case "manage_calendar": {
        const { getCalendarEvents, findAvailableTimeSlots } = await import("@/lib/personal-assistant/calendar-service");
        output = {
          events: getCalendarEvents(),
          availableSlots: findAvailableTimeSlots(),
        };
        break;
      }

      // 15. Email Assistant
      case "manage_email": {
        const { getEmailMessages, extractAndCreateTasksFromEmail, generateEmailReplyDraft } = await import("@/lib/personal-assistant/email-service");
        if (input.action === "extract_tasks") {
          output = extractAndCreateTasksFromEmail(input.emailId || "email-1");
        } else if (input.action === "draft_reply") {
          output = { draft: generateEmailReplyDraft(input.emailId || "email-1"), requiresApproval: true };
        } else {
          output = getEmailMessages();
        }
        break;
      }

      default: {
        output = { error: `Tool "${name}" is not implemented.` };
        isError = true;
      }
    }
  } catch (err: any) {
    output = { error: err?.message || "Execution exception occurred." };
    isError = true;
  }

  return {
    toolUseId,
    name,
    output,
    isError,
    durationMs: Date.now() - startTime,
  };
}

export async function executeParallelTools(
  toolCalls: { id: string; name: string; input: Record<string, any> }[],
  context?: ToolExecutionContext
): Promise<ExecutedToolResult[]> {
  return Promise.all(
    toolCalls.map((tc) => executeToolCall(tc.name, tc.id, tc.input, context))
  );
}
