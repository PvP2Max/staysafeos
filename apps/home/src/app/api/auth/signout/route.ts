import { signOut } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await signOut(logtoConfig);
    // This won't be reached as signOut redirects
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
  } catch {
    // If signOut fails, redirect to home anyway
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
  }
}
