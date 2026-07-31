import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { integrations } from "@/db/schema/integrations";
import { workspaceMembers } from "@/db/schema/workspaces";
import { eq, and, inArray } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Auto-resolve: get the user's first workspace
  const [membership] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);

  if (!membership) {
    return NextResponse.json({ gmail: false, slack: false, calendar: false });
  }

  // Fetch active integrations for Gmail, Slack, and Calendar
  const activeIntegrations = await db
    .select({
      provider: integrations.provider,
      status: integrations.status,
    })
    .from(integrations)
    .where(
      and(
        eq(integrations.workspaceId, membership.workspaceId),
        inArray(integrations.provider, ["gmail", "slack", "google_calendar"]),
        eq(integrations.status, "active")
      )
    );

  const connected = {
    gmail: activeIntegrations.some((i) => i.provider === "gmail"),
    slack: activeIntegrations.some((i) => i.provider === "slack"),
    calendar: activeIntegrations.some((i) => i.provider === "google_calendar"),
  };

  return NextResponse.json(connected);
}
