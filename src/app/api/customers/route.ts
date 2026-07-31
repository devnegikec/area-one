import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { customers, contacts, emails } from "@/db/schema";
import { workspaceMembers } from "@/db/schema/workspaces";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * GET /api/customers?workspace_id=...
 * Returns all customers for a workspace with contact count and last activity.
 */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let workspaceId = searchParams.get("workspace_id");

  // Auto-resolve workspace if not provided
  if (!workspaceId) {
    const [membership] = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId))
      .limit(1);
    if (!membership) {
      return NextResponse.json({ customers: [] });
    }
    workspaceId = membership.workspaceId;
  }

  const result = await db
    .select({
      id: customers.id,
      name: customers.name,
      domain: customers.domain,
      aiIndustry: customers.aiIndustry,
      aiEngagementScore: customers.aiEngagementScore,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
      emailCount: sql<number>`count(distinct ${emails.id})`.mapWith(Number),
      contactCount: sql<number>`count(distinct ${contacts.id})`.mapWith(Number),
    })
    .from(customers)
    .leftJoin(contacts, eq(contacts.customerId, customers.id))
    .leftJoin(emails, eq(emails.customerId, customers.id))
    .where(eq(customers.workspaceId, workspaceId))
    .groupBy(customers.id)
    .orderBy(desc(customers.updatedAt))
    .limit(50);

  return NextResponse.json({ customers: result });
}
