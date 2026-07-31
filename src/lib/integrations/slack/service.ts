import { auth } from "@clerk/nextjs/server";
import { getSlackAuthUrl, exchangeSlackCode } from "./auth";
import { fetchRecentMessages } from "./client";
import { encryptToken } from "@/lib/security/token-vault";
import { db } from "@/db";
import { integrations } from "@/db/schema/integrations";
import { conversations, messages } from "@/db/schema/conversations";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";

const PKCE_COOKIE = "slack_pkce_verifier";

/**
 * Start Slack OAuth flow with PKCE.
 * Stores code_verifier in an httpOnly cookie for the callback.
 */
export async function connectSlack(workspaceId: string): Promise<string> {
  await auth();
  // Encode workspaceId + timestamp in state for the callback
  const state = Buffer.from(JSON.stringify({ workspaceId })).toString("base64");

  const { url, codeVerifier } = getSlackAuthUrl(state);

  // Store PKCE verifier in a short-lived cookie for the callback
  const cookieStore = await cookies();
  cookieStore.set(PKCE_COOKIE, codeVerifier, {
    httpOnly: true,
    secure: false, // localhost
    sameSite: "lax",
    path: "/api/integrations/slack/callback",
    maxAge: 600, // 10 minutes
  });

  return url;
}

/**
 * Handle Slack OAuth callback: verify PKCE, exchange code, store tokens, sync.
 */
export async function handleSlackCallback(
  workspaceId: string,
  code: string
): Promise<{ success: boolean; messagesSynced: number }> {
  await auth();

  // Retrieve PKCE verifier from cookie
  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get(PKCE_COOKIE)?.value;
  if (!codeVerifier) {
    throw new Error("Missing PKCE code verifier. Please restart the Slack connection.");
  }

  // Clear the cookie immediately
  cookieStore.delete(PKCE_COOKIE);

  // 1. Exchange code for token (with PKCE verifier)
  const tokens = await exchangeSlackCode(code, codeVerifier);

  // 2. Encrypt and store
  const encrypted = encryptToken(
    JSON.stringify({
      accessToken: tokens.accessToken,
      teamId: tokens.teamId,
      teamName: tokens.teamName,
      botUserId: tokens.botUserId,
      updatedAt: new Date().toISOString(),
    })
  );

  const [existing] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.workspaceId, workspaceId),
        eq(integrations.provider, "slack")
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(integrations)
      .set({
        credentials: encrypted as never,
        status: "active" as const,
        updatedAt: new Date(),
      } as never)
      .where(eq(integrations.id, existing.id));
  } else {
    await db.insert(integrations).values({
      workspaceId,
      provider: "slack" as const,
      status: "active" as const,
      credentials: encrypted as never,
    } as never);
  }

  // 3. Sync recent messages
  let messagesSynced = 0;
  try {
    const slackMessages = await fetchRecentMessages(tokens.accessToken, 20);

    for (const msg of slackMessages) {
      // Upsert conversation (one per Slack channel)
      const [conv] = await db
        .insert(conversations)
        .values({
          workspaceId,
          channel: "slack" as const,
          externalId: msg.channelId,
          subject: `#${msg.channelName}`,
        })
        .onConflictDoUpdate({
          target: conversations.externalId,
          set: { subject: `#${msg.channelName}` },
        })
        .returning();

      if (!conv) continue;

      // Insert message
      await db
        .insert(messages)
        .values({
          conversationId: conv.id,
          direction: "inbound",
          senderEmail: msg.userName,
          body: msg.text,
          sentAt: msg.sentAt,
        } as never)
        .onConflictDoNothing();
      messagesSynced++;
    }
  } catch (error) {
    console.error("Slack message sync error:", error);
  }

  return { success: true, messagesSynced };
}
