import { getAuthUrl, exchangeCode } from "@/lib/integrations/gmail/auth";
import { fetchRecentEmails } from "@/lib/integrations/gmail/client";
import { encryptToken } from "@/lib/security/token-vault";
import { db } from "@/db";
import { integrations } from "@/db/schema/integrations";
import { emails } from "@/db/schema/emails";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

/**
 * Start Gmail OAuth flow. Returns the Google authorization URL.
 */
export async function connectGmail(workspaceId: string): Promise<string> {
  await auth(); // Verify user is authenticated
  // Encode workspace ID in the OAuth state parameter so we can retrieve it in the callback
  const state = Buffer.from(JSON.stringify({ workspaceId })).toString("base64");
  return getAuthUrl(state);
}

/**
 * Handle OAuth callback: exchange code, store tokens, sync emails.
 */
export async function handleGmailCallback(
  workspaceId: string,
  code: string
): Promise<{ success: boolean; emailsSynced: number }> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // 1. Exchange code for tokens
  const tokens = await exchangeCode(code);

  // 2. Encrypt and store tokens
  const encrypted = encryptToken(
    JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiryDate: tokens.expiryDate,
      updatedAt: new Date().toISOString(),
    })
  );

  // Upsert integration
  const [existing] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.workspaceId, workspaceId),
        eq(integrations.provider, "gmail")
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(integrations)
      .set({
        credentials: encrypted as unknown as typeof integrations.$inferInsert.credentials,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, existing.id));
  } else {
    await db.insert(integrations).values({
      workspaceId,
      provider: "gmail" as const,
      status: "active" as const,
      credentials: encrypted as unknown as typeof integrations.$inferInsert.credentials,
    } as never);
  }

  // 3. Initial email sync (last 7 days' emails)
  let emailsSynced = 0;
  try {
    const recentEmails = await fetchRecentEmails({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiryDate: tokens.expiryDate,
    }, 50); // Start with 50 for initial sync

    for (const email of recentEmails) {
      const [saved] = await db
        .insert(emails)
        .values({
          workspaceId,
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
      emailsSynced++;

      // Trigger entity extraction for this email (fire-and-forget)
      if (saved) {
        triggerEntityExtraction(saved.id).catch((err) =>
          console.error(`Entity extraction failed for email ${saved.id}:`, err)
        );
      }
    }
  } catch (error) {
    console.error("Initial email sync error:", error);
    // Don't fail the whole flow — tokens are stored, sync can retry
  }

  return { success: true, emailsSynced };
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
