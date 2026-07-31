import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const deepseek = createOpenAICompatible({
  name: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const MEMORY_CATEGORIES = [
  "budget", "timeline", "objection", "competitor",
  "decision_maker", "requirements", "commitment", "general",
] as const;

const FACT_JSON_SCHEMA = `[
  { "category": "budget|timeline|objection|competitor|decision_maker|requirements|commitment|general", "fact": "concise fact", "evidence": "supporting quote from email", "confidence": 50 }
]`;

const FACTS_PROMPT = `You are a customer intelligence system. Extract business facts from this email.

Categories:
- budget: Pricing, discount, financial approval
- timeline: Deadlines, urgency, "by Q4", "ASAP"
- objection: Concerns, complaints, pushback
- competitor: Mentions of competitors
- decision_maker: Who makes decisions, org structure
- requirements: Technical needs, feature requests
- commitment: Verbal agreement, "we're ready", "let's do this"
- general: Other useful business context

Return ONLY a JSON array matching this schema:
${FACT_JSON_SCHEMA}

Rules:
- Each fact must have a category, concise fact statement, evidence quote, and confidence (0-100)
- Only extract facts actually mentioned in the email — do not fabricate
- Return an empty array [] if no meaningful facts are found
- IMPORTANT: Return ONLY the JSON array, no markdown, no explanation.`;

export interface ExtractedFact {
  category: string;
  fact: string;
  evidence: string;
  confidence: number;
}

export async function extractFacts(params: {
  subject: string | null;
  bodyText: string | null;
  snippet: string | null;
  existingFacts?: string[]; // For deduplication context
}): Promise<ExtractedFact[]> {
  const context = [
    `Subject: ${params.subject ?? "(no subject)"}`,
    "",
    params.bodyText ?? params.snippet ?? "(no content)",
  ].join("\n");

  const existingContext = params.existingFacts?.length
    ? `\n\nExisting facts for this customer (avoid duplicating):\n${params.existingFacts.map((f) => `- ${f}`).join("\n")}`
    : "";

  const { text } = await generateText({
    model: deepseek("deepseek-chat"),
    system: FACTS_PROMPT,
    prompt: context + existingContext,
    temperature: 0.1,
  });

  const cleaned = text.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(
    (f): f is ExtractedFact =>
      typeof f.fact === "string" &&
      f.fact.length > 0 &&
      MEMORY_CATEGORIES.includes(f.category)
  );
}
