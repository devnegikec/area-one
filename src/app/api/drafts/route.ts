import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { drafts, recommendations, customers } from "@/db/schema";
import { generateDraft } from "@/lib/drafting/generator";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/drafts
 * Generate a draft from a recommendation or directly for a customer.
 * Body: { recommendationId, customerId, type }
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { recommendationId, customerId: cid, type: draftType } = body;

  let customerId = cid;

  // If triggered from a recommendation, get the customer and type
  if (recommendationId) {
    const [rec] = await db
      .select({ customerId: recommendations.customerId, type: recommendations.type, workspaceId: recommendations.workspaceId, title: recommendations.title })
      .from(recommendations)
      .where(eq(recommendations.id, recommendationId))
      .limit(1);

    if (!rec) return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    customerId = rec.customerId;
  }

  if (!customerId || !draftType) {
    return NextResponse.json({ error: "Missing customerId or type" }, { status: 400 });
  }

  // Get workspace from customer
  const [customer] = await db
    .select({ workspaceId: customers.workspaceId })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  try {
    const draft = await generateDraft(customerId, customer.workspaceId, draftType);

    const [saved] = await db
      .insert(drafts)
      .values({
        workspaceId: customer.workspaceId,
        customerId,
        recommendationId: recommendationId || null,
        type: draftType,
        subject: draft.subject,
        body: draft.body,
      })
      .returning();

    return NextResponse.json({ draft: saved });
  } catch (error) {
    console.error("Draft generation failed:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

/**
 * PUT /api/drafts
 * Update a draft (user edits).
 * Body: { id, subject, body }
 */
export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, subject, editDistance } = body;

  await db
    .update(drafts)
    .set({
      ...(body.body && { body: body.body }),
      ...(subject && { subject }),
      ...(editDistance !== undefined && { editDistance }),
      updatedAt: new Date(),
    })
    .where(eq(drafts.id, id));

  return NextResponse.json({ success: true });
}
