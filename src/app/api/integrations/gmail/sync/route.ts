import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { integrations } from "@/db/schema/integrations";
import { emails } from "@/db/schema/emails";
import { workspaceMembers } from "@/db/schema/workspaces";
import { decryptToken } from "@/lib/security/token-vault";
import { fetchRecentEmails } from "@/lib/integrations/gmail/client";
import { processEmail } from "@/lib/pipeline/process-email";
import { eq, and } from "drizzle-orm";

// Patterns that indicate a non-revenue email (newsletters, spam, notifications, etc.)
const IRRELEVANT_PATTERNS = [
  /^unsubscribe\b/i,
  /newsletter/i,
  /weekly digest/i,
  /monthly (recap|roundup|update)/i,
  /no.?reply/i,
  /noreply/i,
  /notification/i,
  /your (order|receipt|invoice|payment|subscription|booking)/i,
  /password reset/i,
  /verify your (email|account)/i,
  /security alert/i,
  /two.factor/i,
  /2fa/i,
  /^welcome (to|back)/i,
  /your account has been/i,
  /confirm your (email|subscription)/i,
  /^(thank you for|thanks for) (your|signing|registering)/i,
];

function isLikelyIrrelevant(subject: string | null, fromAddress: string): boolean {
  if (!subject && !fromAddress) return true;

  // Check common notification senders
  const notificationSenders = [
    "notifications@",
    "noreply@",
    "no-reply@",
    "bounces@",
    "mailer-daemon@",
    "postmaster@",
  ];
  if (notificationSenders.some((s) => fromAddress.toLowerCase().includes(s))) {
    return true;
  }

  // Check subject patterns
  if (subject) {
    for (const pattern of IRRELEVANT_PATTERNS) {
      if (pattern.test(subject)) return true;
    }
  }

  return false;
}

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

    interface PipeEntry {
      subject: string;
      status: "new" | "reprocessed" | "skipped" | "irrelevant" | "failed";
      company?: string;
      error?: string;
    }
    const pipelineEntries: PipeEntry[] = [];

    // --- Step 1: Re-process emails that were stored but never processed ---
    const unprocessed = await db
      .select({ id: emails.id, subject: emails.subject })
      .from(emails)
      .where(
        and(
          eq(emails.workspaceId, membership.workspaceId),
          eq(emails.customerId, null as unknown as string)
        )
      )
      .limit(10);

    for (const email of unprocessed) {
      try {
        const result = await processEmail(email.id);
        pipelineEntries.push({
          subject: email.subject?.slice(0, 50) || "(no subject)",
          status: result.error ? "failed" : "reprocessed",
          company: result.companyName || undefined,
          error: result.error || undefined,
        });
      } catch (err) {
        pipelineEntries.push({
          subject: email.subject?.slice(0, 50) || "(no subject)",
          status: "failed",
          error: String(err).slice(0, 150),
        });
      }
    }

    // --- Step 2: Sync new emails from Gmail ---
    let newCount = 0;

    for (const email of recent) {
      if (isLikelyIrrelevant(email.subject, email.fromAddress)) {
        pipelineEntries.push({
          subject: email.subject?.slice(0, 50) || "(no subject)",
          status: "irrelevant",
        });
        continue;
      }

      const [exists] = await db
        .select({ id: emails.id })
        .from(emails)
        .where(eq(emails.gmailId, email.gmailId))
        .limit(1);

      if (!exists) {
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

        if (saved) {
          newCount++;
          try {
            const result = await processEmail(saved.id);
            pipelineEntries.push({
              subject: email.subject?.slice(0, 50) || "(no subject)",
              status: result.error ? "failed" : "new",
              company: result.companyName || undefined,
              error: result.error || undefined,
            });
          } catch (err) {
            pipelineEntries.push({
              subject: email.subject?.slice(0, 50) || "(no subject)",
              status: "failed",
              error: String(err).slice(0, 150),
            });
          }
        }
      }
    }

    return NextResponse.json({
      synced: newCount,
      total: recent.length,
      pipeline: pipelineEntries,
    });
  } catch (error) {
    console.error("Gmail sync error:", error);
    return NextResponse.json({ error: "Sync failed", details: String(error) }, { status: 500 });
  }
}
