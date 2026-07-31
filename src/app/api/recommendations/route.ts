import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { recommendations as recs, customers } from "@/db/schema";
import { workspaceMembers } from "@/db/schema/workspaces";
import { generateRecommendations } from "@/lib/recommendations/engine";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/recommendations — list pending recommendations
 * POST /api/recommendations — generate new recommendations for a customer
 */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [membership] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);
  if (!membership) return NextResponse.json({ recommendations: [] });

  const result = await db
    .select({
      id: recs.id,
      type: recs.type,
      title: recs.title,
      reasoning: recs.reasoning,
      urgency: recs.urgency,
      confidence: recs.confidence,
      status: recs.status,
      customerId: recs.customerId,
      customerName: customers.name,
      createdAt: recs.createdAt,
    })
    .from(recs)
    .leftJoin(customers, eq(customers.id, recs.customerId))
    .where(
      and(
        eq(recs.workspaceId, membership.workspaceId),
        eq(recs.status, "pending")
      )
    )
    .orderBy(desc(recs.confidence))
    .limit(20);

  return NextResponse.json({ recommendations: result });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const customerId = body.customerId as string;
  if (!customerId) return NextResponse.json({ error: "Missing customerId" }, { status: 400 });

  const [membership] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);
  if (!membership) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  try {
    const generated = await generateRecommendations(customerId, membership.workspaceId);
    const stored: string[] = [];

    for (const rec of generated) {
      const [saved] = await db
        .insert(recs)
        .values({
          workspaceId: membership.workspaceId,
          customerId,
          type: rec.type,
          title: rec.title,
          reasoning: rec.reasoning,
          urgency: rec.urgency,
          confidence: rec.confidence,
        })
        .returning({ id: recs.id });
      stored.push(saved.id);
    }

    return NextResponse.json({ generated: generated.length, stored });
  } catch (error) {
    console.error("Recommendation generation failed:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

/**
 * PATCH /api/recommendations — update recommendation status
 */
export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status } = body as { id: string; status: string };

  await db.update(recs).set({ status, updatedAt: new Date() }).where(eq(recs.id, id));
  return NextResponse.json({ success: true });
}
