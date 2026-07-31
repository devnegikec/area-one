import { db } from "@/db";
import { emails, customerMemoryEntries, timelineEvents, customers } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const deepseek = createOpenAICompatible({
  name: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const RECOMMENDATION_JSON = `[
  {
    "type": "send_email|schedule_meeting|share_pricing|follow_up|escalate|mark_lost|ask_feedback|send_proposal",
    "title": "Action-oriented title (5-10 words)",
    "reasoning": "Why this is recommended, citing specific evidence",
    "urgency": "critical|high|medium|low",
    "confidence": 75
  }
]`;

const RECOMMEND_PROMPT = `You are a revenue intelligence agent. Analyze the customer context and recommend next-best-actions.

Action types:
- send_email: Send a follow-up, introduction, or thank-you email
- schedule_meeting: Book a demo, discovery call, or QBR
- share_pricing: Send pricing/packaging information
- follow_up: Check in (silence detected, deal stalling)
- escalate: Escalate to manager (urgent issue, high-value deal at risk)
- mark_lost: Deal is likely lost (rejection signals, competitor win)
- ask_feedback: Request feedback post-meeting or post-proposal
- send_proposal: Create and send a formal proposal

Consider: deal stage, last activity, customer sentiment, objections, budget, timeline, missing responses.

Return ONLY a JSON array of 1-3 recommendations, ordered by importance:
${RECOMMENDATION_JSON}

Rules:
- Only recommend actions actually needed based on context
- Confidence: 85+ for clear needs, 50-70 for suggestions
- Urgency: critical if 48h+ silence on active deal, high if objection detected
- Return empty array [] if no clear actions needed
- IMPORTANT: Return ONLY the JSON array, no markdown, no explanation.`;

export interface GeneratedRecommendation {
  type: string;
  title: string;
  reasoning: string;
  urgency: string;
  confidence: number;
}

export async function generateRecommendations(
  customerId: string,
  workspaceId: string
): Promise<GeneratedRecommendation[]> {
  // Gather context
  const [customer] = await db
    .select({ name: customers.name, domain: customers.domain })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.workspaceId, workspaceId)))
    .limit(1);

  const recentEmails = await db
    .select({
      subject: emails.subject,
      snippet: emails.snippet,
      direction: emails.direction,
      receivedAt: emails.receivedAt,
      fromName: emails.fromName,
      fromAddress: emails.fromAddress,
    })
    .from(emails)
    .where(
      and(eq(emails.customerId, customerId), eq(emails.workspaceId, workspaceId))
    )
    .orderBy(desc(emails.receivedAt))
    .limit(10);

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
    .limit(20);

  const recentEvents = await db
    .select({ title: timelineEvents.title, type: timelineEvents.type, occurredAt: timelineEvents.occurredAt })
    .from(timelineEvents)
    .where(
      and(eq(timelineEvents.customerId, customerId), eq(timelineEvents.workspaceId, workspaceId))
    )
    .orderBy(desc(timelineEvents.occurredAt))
    .limit(10);

  // Build context for AI
  const context = [
    `Customer: ${customer?.name || "Unknown"}${customer?.domain ? ` (${customer.domain})` : ""}`,
    "",
    "Recent Timeline:",
    ...recentEvents.map((e) => `  ${new Date(e.occurredAt).toLocaleDateString()} - [${e.type}] ${e.title}`),
    "",
    "Key Facts:",
    ...facts.map((f) => `  [${f.category}] ${f.fact}`),
    "",
    "Recent Emails:",
    ...recentEmails.map((e) =>
      `  ${e.direction === "inbound" ? "←" : "→"} ${e.fromName || e.fromAddress}: ${e.subject || e.snippet?.slice(0, 80) || "(no content)"} (${new Date(e.receivedAt).toLocaleDateString()})`
    ),
  ].join("\n");

  const { text } = await generateText({
    model: deepseek("deepseek-chat"),
    system: RECOMMEND_PROMPT,
    prompt: context,
    temperature: 0.3,
  });

  const cleaned = text.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned);
  return Array.isArray(parsed) ? parsed : [];
}
