import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { workspaceMembers } from "@/db/schema/workspaces";
import { getAutonomyRules, updateAutonomyRules } from "@/lib/agents/autonomy-rules";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [membership] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);
  if (!membership) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const rules = await getAutonomyRules(membership.workspaceId);
  return NextResponse.json(rules);
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [membership] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);
  if (!membership) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const rules = await req.json();
  await updateAutonomyRules(membership.workspaceId, rules);
  return NextResponse.json({ success: true });
}
