import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { drafts, emails, customers } from "@/db/schema";
import { workspaceMembers } from "@/db/schema/workspaces";
import { sendGmailEmail } from "@/lib/integrations/gmail/sender";
import { logAudit } from "@/lib/security/audit-log";
import { eq } from "drizzle-orm";

/**
 * POST /api/drafts/send
 * Send a draft email via Gmail.
 * Body: { draftId, toAddress }
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { draftId, toAddress } = body as { draftId: string; toAddress: string };

  if (!draftId || !toAddress) {
    return NextResponse.json({ error: "Missing draftId or toAddress" }, { status: 400 });
  }

  // Get the draft with customer context
  const [draft] = await db.select().from(drafts).where(eq(drafts.id, draftId)).limit(1);
  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  // Get customer for the recipient address (could be a contact)
  const [customer] = await db
    .select({ domain: customers.domain })
    .from(customers)
    .where(eq(customers.id, draft.customerId))
    .limit(1);

  try {
    const result = await sendGmailEmail({
      workspaceId: draft.workspaceId,
      to: toAddress,
      subject: draft.subject,
      body: draft.body,
    });

    if (!result.sent) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Mark draft as sent
    await db
      .update(drafts)
      .set({ status: "sent", updatedAt: new Date() })
      .where(eq(drafts.id, draftId));

    // Audit log
    logAudit({
      workspaceId: draft.workspaceId,
      userId: userId ?? "unknown",
      action: "email.sent",
      resource: `draft:${draftId}`,
      details: { to: toAddress, subject: draft.subject },
    }).catch(() => {});

    return NextResponse.json({ sent: true, messageId: result.messageId });
  } catch (error) {
    console.error("Email send failed:", error);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
