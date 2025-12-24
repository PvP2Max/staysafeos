import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const api = await createApiClient();
    const result = await api.signUpForShift(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sign up for shift";
    console.error("[api/shifts/[id]/signup] POST Error:", error);

    // Return 400 for validation errors
    const isValidationError = message.includes("past") ||
                               message.includes("full") ||
                               message.includes("already");

    return NextResponse.json(
      { error: message },
      { status: isValidationError ? 400 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const api = await createApiClient();
    await api.cancelShiftSignup(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/shifts/[id]/signup] DELETE Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel signup" },
      { status: 500 }
    );
  }
}
