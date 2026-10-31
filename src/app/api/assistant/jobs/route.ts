import { NextRequest, NextResponse } from "next/server";
import {
  getBackgroundJobs,
  triggerBackgroundJobExecution,
  cancelBackgroundJob,
} from "@/lib/personal-assistant/background-job-engine";

export const runtime = "nodejs";

export async function GET() {
  try {
    const jobs = getBackgroundJobs();
    return NextResponse.json({ jobs });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch background jobs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "jobId required" }, { status: 400 });
    }

    if (action === "trigger") {
      const result = await triggerBackgroundJobExecution(jobId);
      return NextResponse.json(result);
    }

    if (action === "cancel") {
      const success = cancelBackgroundJob(jobId);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: "Action not recognized" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to execute job action" }, { status: 500 });
  }
}
