import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { integrations } from "@/db/schema/integrations";
import { emails } from "@/db/schema/emails";
import { workspaceMembers } from "@/db/schema/workspaces";
import { decryptToken } from "@/lib/security/token-vault";
import { fetchRecentEmails } from "@/lib/integrations/gmail/client";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/integrations/gmail/sync
 * Manually sync recent emails from Gmail. Poll this endpoint to keep emails fresh.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [membership] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);
  if (!membership) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const [integration] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.workspaceId, membership.workspaceId),
        eq(integrations.provider, "gmail"),
        eq(integrations.status, "active")
      )
    )
    .limit(1);

  if (!integration?.credentials) {
    return NextResponse.json({ error: "No active Gmail integration" }, { status: 400 });
  }

  try {
    const decrypted = decryptToken(
      integration.credentials as { encrypted: string; iv: string; tag: string }
    );
    const tokens = JSON.parse(decrypted);

    const recent = await fetchRecentEmails(tokens, 20);
    let newCount = 0;

    for (const email of recent) {
      const [exists] = await db
        .select({ id: emails.id })
        .from(emails)
        .where(eq(emails.gmailId, email.gmailId))
        .limit(1);

      if (!exists) {
        // fetchRecentEmails already returns full ParsedEmail — no need to re-fetch
        const [saved] = await db
          .insert(emails)
          .values({
            workspaceId: membership.workspaceId,
            gmailId: email.gmailId,
            threadId: email.threadId,
            fromAddress: email.fromAddress,
            fromName: email.fromName,
            toAddresses: email.toAddresses,
            ccAddresses: email.ccAddresses,
            subject: email.subject,
            bodyText: email.bodyText,
            bodyHtml: email.bodyHtml,
            snippet: email.snippet,
            direction: "inbound" as const,
            sentAt: email.sentAt,
            receivedAt: new Date(),
          } as never)
          .onConflictDoNothing({ target: emails.gmailId })
          .returning({ id: emails.id });

        newCount++;

        // Trigger AI pipeline for new emails
        if (saved) {
          triggerPipeline(saved.id);
        }
      }
    }

    return NextResponse.json({ synced: newCount, total: recent.length });
  } catch (error) {
    console.error("Gmail sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

function triggerPipeline(emailId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  fetch(`${baseUrl}/api/ai/extract-entities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailId }),
  }).catch(() => {});
}
