import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCalendarAuthUrl } from "@/lib/integrations/calendar/auth";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));

  const authUrl = getCalendarAuthUrl();
  return NextResponse.redirect(authUrl);
}
