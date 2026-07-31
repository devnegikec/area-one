import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { workspaceMembers } from "@/db/schema/workspaces";
import { generateWeeklyDigest } from "@/lib/reporting/weekly-digest";
import { db } from "@/db";
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

  try {
    const digest = await generateWeeklyDigest(membership.workspaceId);
    return NextResponse.json(digest);
  } catch (error) {
    console.error("Weekly digest failed:", error);
    return NextResponse.json({ error: "Digest generation failed" }, { status: 500 });
  }
}
