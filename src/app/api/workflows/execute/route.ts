import { NextRequest, NextResponse } from "next/server";
import { executeWorkflowStepByStep, PRESET_WORKFLOWS, VisualWorkflow } from "@/lib/workflows/workflow-engine";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ workflows: PRESET_WORKFLOWS });
}

export async function POST(req: NextRequest) {
  try {
    const { workflow, humanApprovedNodeIds = [] } = await req.json();
    const wfToRun: VisualWorkflow = workflow || PRESET_WORKFLOWS[0];

    const result = await executeWorkflowStepByStep(wfToRun, humanApprovedNodeIds);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
