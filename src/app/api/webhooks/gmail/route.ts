import { NextResponse } from "next/server";
import { db } from "@/db";
import { integrations } from "@/db/schema/integrations";
import { emails } from "@/db/schema/emails";
import { decryptToken } from "@/lib/security/token-vault";
import { fetchEmailById } from "@/lib/integrations/gmail/client";
import { eq, and } from "drizzle-orm";

/**
 * Receive Gmail push notifications when new emails arrive.
 * Google POSTs to this endpoint when a user's inbox changes.
 */
export async function POST(req: Request) {
  try {
    // Parse body but we process all active integrations for now
    // In production, match by emailAddress from push notification
    await req.json();

    // Find integration by email address match
    // For now, process all active Gmail integrations
    // In production, use emailAddress to find the right workspace

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
        // Decrypt tokens
        if (!integration.credentials) continue;
        const decrypted = decryptToken(integration.credentials as { encrypted: string; iv: string; tag: string });
        const tokens = JSON.parse(decrypted);

        // Fetch latest messages since last check
        const gmail = await getLatestMessageIds(tokens);
        for (const messageId of gmail) {
          // Check if already stored
          const [existing] = await db
            .select({ id: emails.id })
            .from(emails)
            .where(eq(emails.gmailId, messageId))
            .limit(1);

          if (existing) continue;

          // Fetch full email
          const email = await fetchEmailById(tokens, messageId);
          if (!email) continue;

          // Store in DB
          await db.insert(emails).values({
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
          } as never).onConflictDoNothing({ target: emails.gmailId });
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

async function getLatestMessageIds(tokens: {
  accessToken: string;
  refreshToken: string | null;
  expiryDate: number | null;
}): Promise<string[]> {
  // This fetches the latest 5 messages — in production, use history.list() with historyId
  const { fetchRecentEmails } = await import("@/lib/integrations/gmail/client");
  const recent = await fetchRecentEmails(tokens, 5);
  return recent.map((e) => e.gmailId);
}
