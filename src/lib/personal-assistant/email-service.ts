import { EmailMessage, PersonalTask, TaskPriority } from "./assistant-types";
import { createTask } from "./task-planner";
import { generateId } from "../utils";

let emailStore: EmailMessage[] = [
  {
    id: "email-1",
    from: "elena.vance@research-institute.org",
    to: "me@nova.ai",
    subject: "Urgent: Final Review of Hybrid Dynamic Reasoning Paper",
    snippet: "Please review section 4 on thinking budget controls before Thursday 5 PM...",
    body: `Hi team,

I have completed the first draft analyzing Anthropic's Claude 3.7 dynamic hybrid reasoning architecture and its implications for enterprise tool execution. 

Could you please review Section 4 regarding token expenditure bounds and multi-agent coordination before Thursday 5 PM? We also need to prepare a 3-page summary dossier for the executive committee.

Best regards,
Dr. Elena Vance
Lead Research Strategist`,
    date: new Date(Date.now() - 3600000 * 3).toISOString(),
    isRead: false,
    isImportant: true,
    category: "work",
    extractedTasks: [
      {
        title: "Review Section 4 of Hybrid Dynamic Reasoning Paper",
        deadline: new Date(Date.now() + 3600000 * 24).toISOString(),
        priority: "high",
      },
      {
        title: "Prepare 3-page summary dossier for executive committee",
        deadline: new Date(Date.now() + 3600000 * 48).toISOString(),
        priority: "medium",
      },
    ],
    draftedReply: `Hi Dr. Vance,

Thank you for sharing the draft. I am reviewing Section 4 on token expenditure bounds and will have feedback to you ahead of Thursday's 5 PM deadline. I am also having our autonomous research agents synthesize the 3-page executive summary dossier.

Best regards,
Nova Assistant`,
    requiresApprovalToSend: true,
    approvalStatus: "pending",
  },
  {
    id: "email-2",
    from: "compliance@cloud-security.io",
    to: "me@nova.ai",
    subject: "Security Audit Passed: Zero-Trust VM Sandbox Isolation",
    snippet: "All 102 automated boundary test cases executed successfully with 0 policy breaches...",
    body: `Hello,

The automated vulnerability audit on the Node.js VM sandbox execution environment and prompt injection defenses has concluded. 

All memory limits, command restrictions, and token rate limiters passed validation. No action is required at this time.

Security Operations Team`,
    date: new Date(Date.now() - 3600000 * 8).toISOString(),
    isRead: true,
    isImportant: false,
    category: "updates",
    extractedTasks: [],
    requiresApprovalToSend: false,
    approvalStatus: "approved",
  },
];

export function getEmails(): EmailMessage[] {
  return [...emailStore].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export const getEmailMessages = getEmails;

// Extract tasks from email and add them directly into the Daily Planner
export function extractAndCreateTasksFromEmail(emailId: string): PersonalTask[] {
  const email = emailStore.find((e) => e.id === emailId);
  if (!email || !email.extractedTasks || email.extractedTasks.length === 0) return [];

  const createdTasks: PersonalTask[] = [];
  email.extractedTasks.forEach((item) => {
    const task = createTask({
      title: item.title,
      description: `Extracted from email from ${email.from} (Subject: "${email.subject}")`,
      priority: item.priority,
      deadline: item.deadline,
      category: "work",
      tags: ["Email Extraction", "Action Item"],
    });
    createdTasks.push(task);
  });

  return createdTasks;
}

// Generate context-aware AI reply draft
export function generateEmailReplyDraft(emailId: string): string {
  const email = emailStore.find((e) => e.id === emailId);
  if (!email) return "";

  const draft = `Hi ${email.from.split("@")[0].replace(".", " ")},\n\nThank you for reaching out regarding "${email.subject}". I have received your message and organized the action items into my daily schedule.\n\nI will follow up with complete details shortly.\n\nBest regards,\nPersonal AI Assistant`;

  email.draftedReply = draft;
  email.requiresApprovalToSend = true;
  email.approvalStatus = "pending";
  return draft;
}

// Authorize & Send Email (Guarded by User Confirmation Checkpoint)
export function authorizeAndSendEmailReply(emailId: string): {
  success: boolean;
  message: string;
} {
  const email = emailStore.find((e) => e.id === emailId);
  if (!email) return { success: false, message: "Email not found" };

  if (!email.draftedReply) {
    return { success: false, message: "No reply draft available to send." };
  }

  email.approvalStatus = "approved";
  email.requiresApprovalToSend = false;

  return {
    success: true,
    message: `Email reply authorized and dispatched to ${email.from}. Action logged in audit record.`,
  };
}
