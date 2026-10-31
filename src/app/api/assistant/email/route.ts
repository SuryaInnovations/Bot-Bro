import { NextRequest, NextResponse } from "next/server";
import {
  getEmails,
  extractAndCreateTasksFromEmail,
  generateEmailReplyDraft,
  authorizeAndSendEmailReply,
} from "@/lib/personal-assistant/email-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const emails = getEmails();
    return NextResponse.json({ emails });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch emails" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, emailId } = body;

    if (!emailId) {
      return NextResponse.json({ error: "emailId required" }, { status: 400 });
    }

    if (action === "extract_tasks") {
      const createdTasks = extractAndCreateTasksFromEmail(emailId);
      return NextResponse.json({ createdTasks, count: createdTasks.length });
    }

    if (action === "draft_reply") {
      const draft = generateEmailReplyDraft(emailId);
      return NextResponse.json({ draft });
    }

    if (action === "authorize_send") {
      const sendResult = authorizeAndSendEmailReply(emailId);
      return NextResponse.json(sendResult);
    }

    return NextResponse.json({ error: "Action not recognized" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to process email action" }, { status: 500 });
  }
}
