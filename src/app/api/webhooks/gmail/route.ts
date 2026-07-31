import { NextResponse } from "next/server";
import { db } from "@/db";
import { integrations } from "@/db/schema/integrations";
import { emails } from "@/db/schema/emails";
import { decryptToken } from "@/lib/security/token-vault";
import { fetchEmailById } from "@/lib/integrations/gmail/client";
import { eq, and } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════
// Gmail Push Notification Webhook
// Google POSTs when a user's inbox changes.
// ═══════════════════════════════════════════════════════════════

export async function POST(req: Request) {
  try {
    await req.json();

    const gmailIntegrations = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.provider, "gmail"),
          eq(integrations.status, "active")
        )
      );

    for (const integration of gmailIntegrations) {
      try {
        if (!integration.credentials) continue;
        const decrypted = decryptToken(integration.credentials as { encrypted: string; iv: string; tag: string });
        const tokens = JSON.parse(decrypted);

        const gmail = await getLatestMessageIds(tokens);
        for (const messageId of gmail) {
          // Check if already stored
          const [existing] = await db
            .select({ id: emails.id })
            .from(emails)
            .where(eq(emails.gmailId, messageId))
            .limit(1);

          if (existing) continue;

          const email = await fetchEmailById(tokens, messageId);
          if (!email) continue;

          // Store in DB
          const [saved] = await db
            .insert(emails)
            .values({
              workspaceId: integration.workspaceId,
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
              attachments: email.attachments as unknown as typeof emails.$inferInsert.attachments,
              direction: "inbound" as const,
              sentAt: email.sentAt,
              receivedAt: new Date(),
            } as never)
            .onConflictDoNothing({ target: emails.gmailId })
            .returning({ id: emails.id });

          // Trigger entity extraction (fire-and-forget, non-blocking)
          if (saved) {
            triggerEntityExtraction(saved.id).catch((err) =>
              console.error(`Entity extraction failed for email ${saved.id}:`, err)
            );
          }
        }
      } catch (error) {
        console.error(`Failed to process Gmail push for workspace ${integration.workspaceId}:`, error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gmail webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

async function getLatestMessageIds(tokens: {
  accessToken: string;
  refreshToken: string | null;
  expiryDate: number | null;
}): Promise<string[]> {
  const { fetchRecentEmails } = await import("@/lib/integrations/gmail/client");
  const recent = await fetchRecentEmails(tokens, 5);
  return recent.map((e) => e.gmailId);
}

/**
 * Fire-and-forget call to the entity extraction pipeline.
 * Extracts company, contacts, and topics from the email.
 */
async function triggerEntityExtraction(emailId: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await fetch(`${baseUrl}/api/ai/extract-entities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailId }),
  });
}
