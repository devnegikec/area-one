import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { integrations } from "@/db/schema/integrations";
import { workspaceMembers } from "@/db/schema/workspaces";
import { exchangeCalendarCode } from "@/lib/integrations/calendar/auth";
import { encryptToken } from "@/lib/security/token-vault";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/sign-in", req.url));

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  // Auto-resolve workspace
  const [membership] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);

  if (!membership) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  try {
    const tokens = await exchangeCalendarCode(code);

    const encrypted = encryptToken(
      JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiryDate: tokens.expiryDate,
        updatedAt: new Date().toISOString(),
      })
    );

    // Upsert integration
    const [existing] = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.workspaceId, membership.workspaceId),
          eq(integrations.provider, "google_calendar")
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(integrations)
        .set({ credentials: encrypted, status: "active", updatedAt: new Date() })
        .where(eq(integrations.id, existing.id));
    } else {
      await db.insert(integrations).values({
        workspaceId: membership.workspaceId,
        provider: "google_calendar",
        status: "active",
        credentials: encrypted,
      });
    }

    // Redirect to settings
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL("/dashboard/settings?calendar_connected=true", baseUrl));
  } catch (error) {
    console.error("Calendar callback error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL("/dashboard/settings?error=calendar_failed", baseUrl));
  }
}
