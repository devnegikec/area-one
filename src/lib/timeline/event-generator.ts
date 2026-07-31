import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const deepseek = createOpenAICompatible({
  name: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const EVENT_JSON_SCHEMA = `{ "type": "email_received|email_sent|deal_progressed|deal_stalled|objection_raised|commitment_made|note", "title": "Concise event title", "description": "1-2 sentence summary" }`;

const EVENT_PROMPT = `You are a timeline generator for a revenue intelligence platform. Create a timeline event from this email.

Event types:
- email_received: Inbound email from customer
- email_sent: Outbound email to customer
- deal_progressed: Positive movement (pricing discussed, demo booked, agreement reached)
- deal_stalled: Negative signal (no response, objection, delay)
- objection_raised: Customer raises concern or complaint
- commitment_made: Customer verbal/written commitment
- note: General noteworthy update

Return ONLY a JSON object matching this schema:
${EVENT_JSON_SCHEMA}

Rules:
- Title should be 5-10 words, action-oriented
- Description should summarize the key takeaway
- IMPORTANT: Return ONLY the JSON, no markdown, no explanation.`;

export interface GeneratedEvent {
  type: string;
  title: string;
  description: string;
}

export async function generateTimelineEvent(params: {
  subject: string | null;
  snippet: string | null;
  bodyText: string | null;
  direction: string;
  fromName: string | null;
  fromAddress: string;
}): Promise<GeneratedEvent> {
  const directionLabel = params.direction === "inbound" ? "Received from" : "Sent to";
  const context = [
    `${directionLabel}: ${params.fromName ?? params.fromAddress}`,
    `Subject: ${params.subject ?? "(no subject)"}`,
    "",
    params.bodyText ?? params.snippet ?? "(no content)",
  ].join("\n");

  const { text } = await generateText({
    model: deepseek("deepseek-chat"),
    system: EVENT_PROMPT,
    prompt: context,
    temperature: 0.3,
  });

  const cleaned = text.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned);
  return parsed as GeneratedEvent;
}
