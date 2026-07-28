import { getGmailClient } from "./auth";
import type { AttachmentMeta } from "@/db/schema/emails";

export interface ParsedEmail {
  gmailId: string;
  threadId: string;
  fromAddress: string;
  fromName: string;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  bodyText: string;
  bodyHtml: string;
  snippet: string;
  attachments: AttachmentMeta[];
  sentAt: Date;
}

/**
 * Fetch the latest emails from Gmail (used for initial sync).
 */
export async function fetchRecentEmails(
  tokens: { accessToken: string; refreshToken: string | null; expiryDate: number | null },
  maxResults = 100
): Promise<ParsedEmail[]> {
  const gmail = getGmailClient(tokens);

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: "in:inbox",
  });

  const messages = response.data.messages || [];
  const emails: ParsedEmail[] = [];

  for (const msg of messages) {
    if (!msg.id) continue;
    const email = await fetchEmailById(tokens, msg.id);
    if (email) emails.push(email);
  }

  return emails;
}

/**
 * Fetch a single email by Gmail message ID.
 */
export async function fetchEmailById(
  tokens: { accessToken: string; refreshToken: string | null; expiryDate: number | null },
  messageId: string
): Promise<ParsedEmail | null> {
  try {
    const gmail = getGmailClient(tokens);

    const response = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const message = response.data;
    if (!message || !message.id) return null;

    const headers = message.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

    // Parse body
    const body = parseMessageBody(message.payload);

    // Parse attachments
    const attachments: AttachmentMeta[] = (message.payload?.parts || [])
      .filter((p) => p.filename && p.body?.attachmentId)
      .map((p) => ({
        filename: p.filename!,
        mimeType: p.mimeType || "application/octet-stream",
        size: Number(p.body?.size || 0),
        attachmentId: p.body?.attachmentId || "",
      }));

    return {
      gmailId: message.id,
      threadId: message.threadId || "",
      fromAddress: extractEmailAddress(getHeader("From")),
      fromName: extractName(getHeader("From")),
      toAddresses: getHeader("To").split(",").map(extractEmailAddress).filter(Boolean),
      ccAddresses: getHeader("Cc").split(",").map(extractEmailAddress).filter(Boolean),
      subject: getHeader("Subject"),
      bodyText: body.text,
      bodyHtml: body.html,
      snippet: message.snippet || "",
      attachments,
      sentAt: new Date(Number(message.internalDate) || Date.now()),
    };
  } catch (error) {
    console.error(`Failed to fetch email ${messageId}:`, error);
    return null;
  }
}

function parseMessageBody(
  payload: unknown
): { text: string; html: string } {
  if (!payload) return { text: "", html: "" };

  const p = payload as Record<string, unknown>;
  const parts = (p.parts as Array<Record<string, unknown>>) || [];
  let text = "";
  let html = "";

  // Try multipart first
  for (const part of parts) {
    const mimeType = (part.mimeType as string) || "";
    const partBody = part.body as Record<string, unknown> | undefined;
    if (mimeType === "text/plain" && partBody?.data) {
      text = Buffer.from(partBody.data as string, "base64").toString("utf-8");
    }
    if (mimeType === "text/html" && partBody?.data) {
      html = Buffer.from(partBody.data as string, "base64").toString("utf-8");
    }
  }

  // Try single part body
  if (!text && !html && p.body) {
    const bodyData = p.body as Record<string, unknown>;
    const decoded = Buffer.from(bodyData.data as string, "base64").toString("utf-8");
    if ((p.mimeType as string) === "text/html") {
      html = decoded;
    } else {
      text = decoded;
    }
  }

  return { text, html };
}

function extractEmailAddress(header: string): string {
  const match = header.match(/<(.+?)>/);
  return match ? match[1] : header.trim();
}

function extractName(header: string): string {
  const match = header.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : extractEmailAddress(header).split("@")[0];
}
