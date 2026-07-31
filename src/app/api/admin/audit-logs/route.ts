import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema/audit-logs";
import { workspaceMembers } from "@/db/schema/workspaces";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [membership] = await db
    .select({ workspaceId: workspaceMembers.workspaceId, role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);
  if (!membership) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
  const offset = Number(searchParams.get("offset")) || 0;

  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.workspaceId, membership.workspaceId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ logs });
}
