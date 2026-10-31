import { NextRequest, NextResponse } from "next/server";

export interface UserFeedbackRecord {
  id: string;
  category: "bug" | "feature_request" | "general_feedback" | "performance";
  rating: number; // 1 to 5
  message: string;
  userEmail?: string;
  submittedAt: string;
}

const feedbackStore: UserFeedbackRecord[] = [
  {
    id: "fb-1",
    category: "general_feedback",
    rating: 5,
    message: "The single-chat interface is clean and the instant gold/weather citations are incredibly fast.",
    userEmail: "beta_tester@nova.ai",
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "fb-2",
    category: "feature_request",
    rating: 4,
    message: "Would love automated PDF exports of daily morning briefings.",
    userEmail: "architect@enterprise.io",
    submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    feedback: feedbackStore,
    total: feedbackStore.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category = "general_feedback", rating = 5, message, userEmail } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Feedback message is required" },
        { status: 400 }
      );
    }

    const newRecord: UserFeedbackRecord = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category,
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      message: message.trim(),
      userEmail: userEmail ? userEmail.trim() : undefined,
      submittedAt: new Date().toISOString(),
    };

    feedbackStore.unshift(newRecord);

    return NextResponse.json({
      success: true,
      feedback: newRecord,
      message: "Thank you for contributing to the NOVA AI Public Beta!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
