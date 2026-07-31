import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectSlack } from "@/lib/integrations/slack/service";
import { db } from "@/db";
import { workspaces, workspaceMembers } from "@/db/schema/workspaces";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const { searchParams } = new URL(req.url);
  let workspaceId = searchParams.get("workspace_id");

  // Auto-resolve workspace: find user's first workspace
  if (!workspaceId) {
    const [membership] = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId))
      .limit(1);

    if (membership) {
      workspaceId = membership.workspaceId;
    } else {
      // Create a default workspace if none exists
      const [ws] = await db
        .insert(workspaces)
        .values({
          name: "My Workspace",
          slug: `${userId.slice(0, 8)}-${Date.now()}`,
        })
        .returning();

      await db.insert(workspaceMembers).values({
        workspaceId: ws.id,
        userId,
        role: "owner",
        joinedAt: new Date(),
      });

      workspaceId = ws.id;
    }
  }

  try {
    const authUrl = await connectSlack(workspaceId);
    return NextResponse.redirect(authUrl);
  } catch {
    return NextResponse.json({ error: "Failed to initiate Slack connection" }, { status: 500 });
  }
}
