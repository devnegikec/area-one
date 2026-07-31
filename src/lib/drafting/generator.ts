import { db } from "@/db";
import { customers, customerMemoryEntries, emails, recommendations } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const deepseek = createOpenAICompatible({
  name: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const DRAFT_PROMPTS: Record<string, string> = {
  follow_up: "Write a friendly follow-up email. Reference the previous conversation, add value (insight/resource), and include a clear call-to-action.",
  pricing: "Write a pricing/packaging email. Present options clearly, highlight ROI, and include next steps to move forward.",
  meeting_request: "Write a meeting request email. Propose 2-3 time slots, explain the agenda briefly, and make it easy to say yes.",
  proposal_cover: "Write a proposal cover email. Summarize what's attached, highlight key benefits, and set expectations for next steps.",
  thank_you: "Write a thank-you email. Be warm and genuine, reference what you're thanking them for, and keep the door open.",
  check_in: "Write a check-in email. Be casual and helpful, ask how things are going, and offer assistance without being pushy.",
};

export interface GeneratedDraft {
  subject: string;
  body: string;
}

export async function generateDraft(
  customerId: string,
  workspaceId: string,
  draftType: string
): Promise<GeneratedDraft> {
  // Gather context
  const [customer] = await db
    .select({ name: customers.name, domain: customers.domain })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.workspaceId, workspaceId)))
    .limit(1);

  const facts = await db
    .select({ fact: customerMemoryEntries.fact, category: customerMemoryEntries.category })
    .from(customerMemoryEntries)
    .where(
      and(
        eq(customerMemoryEntries.customerId, customerId),
        eq(customerMemoryEntries.workspaceId, workspaceId),
        eq(customerMemoryEntries.status, "active")
      )
    )
    .limit(15);

  const recentEmails = await db
    .select({ subject: emails.subject, snippet: emails.snippet, direction: emails.direction, fromName: emails.fromName })
    .from(emails)
    .where(and(eq(emails.customerId, customerId), eq(emails.workspaceId, workspaceId)))
    .orderBy(desc(emails.receivedAt))
    .limit(5);

  const tone = DRAFT_PROMPTS[draftType] || DRAFT_PROMPTS.follow_up;

  const context = [
    `Customer: ${customer?.name || "Unknown"}${customer?.domain ? ` (${customer.domain})` : ""}`,
    "",
    "Known Facts:",
    ...facts.map((f) => `  [${f.category}] ${f.fact}`),
    "",
    "Recent Context:",
    ...recentEmails.map((e) => `  ${e.direction === "inbound" ? "They wrote" : "We wrote"}: "${e.subject || e.snippet?.slice(0, 100)}"`),
  ].join("\n");

  const { text } = await generateText({
    model: deepseek("deepseek-chat"),
    system: `You are an expert sales email writer. ${tone}

Format your response as:
SUBJECT: [subject line]
BODY: [email body]

Keep the email concise, professional, and personalized to the customer context. Use the facts provided to make it relevant.`,
    prompt: context,
    temperature: 0.7,
  });

  // Parse subject and body
  const subjectMatch = text.match(/SUBJECT:\s*(.+)/i);
  const bodyMatch = text.match(/BODY:\s*([\s\S]+)/i);

  return {
    subject: subjectMatch?.[1]?.trim() || "Follow-up",
    body: bodyMatch?.[1]?.trim() || text.replace(/SUBJECT:.*\n?/i, "").trim(),
  };
}
