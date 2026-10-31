import { NextResponse } from "next/server";
import { SUPPORTED_CONVERSIONS } from "@/lib/conversion/conversion-manager";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    success: true,
    formats: SUPPORTED_CONVERSIONS,
  });
}
