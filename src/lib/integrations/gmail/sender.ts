import { decryptToken } from "@/lib/security/token-vault";
import { db } from "@/db";
import { integrations } from "@/db/schema/integrations";
import { eq, and } from "drizzle-orm";

/**
 * Send an email via Gmail API using the workspace's Gmail integration.
 */
export async function sendGmailEmail(params: {
  workspaceId: string;
  to: string;
  subject: string;
  body: string;
  cc?: string[];
}): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  // Get active Gmail integration for this workspace
  const [integration] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.workspaceId, params.workspaceId),
        eq(integrations.provider, "gmail"),
        eq(integrations.status, "active")
      )
    )
    .limit(1);

  if (!integration?.credentials) {
    return { sent: false, error: "No active Gmail integration found" };
  }

  // Decrypt tokens
  const decrypted = decryptToken(
    integration.credentials as { encrypted: string; iv: string; tag: string }
  );
  const tokens = JSON.parse(decrypted);

  // Build MIME message
  const to = params.to;
  const cc = params.cc?.join(", ") || "";
  const subject = params.subject;
  const body = params.body;

  const email = [
    `From: me`,
    `To: ${to}`,
    cc ? `Cc: ${cc}` : "",
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    body,
  ]
    .filter(Boolean)
    .join("\r\n");

  const encodedEmail = Buffer.from(email).toString("base64url");

  try {
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedEmail }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { sent: false, error: err.error?.message || `Gmail API error: ${res.status}` };
    }

    const data = await res.json();
    return { sent: true, messageId: data.id };
  } catch (error) {
    return { sent: false, error: String(error) };
  }
}
