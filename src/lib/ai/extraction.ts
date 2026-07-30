import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";

// ─── DeepSeek Provider (OpenAI-compatible Chat API) ──────────────

const deepseek = createOpenAICompatible({
  name: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// ─── Extraction Schema ───────────────────────────────────────────

export const extractedEntitiesSchema = z.object({
  company: z
    .object({
      name: z.string().describe("Company or organization name (empty string if none)"),
      domain: z.string().describe("Company domain, e.g. acme.com (empty string if unknown)"),
    })
    .describe("The company mentioned in the email"),
  contacts: z
    .array(
      z.object({
        email: z.string().describe("Contact email address"),
        name: z.string().describe("Full name (empty string if unknown)"),
        title: z.string().describe("Job title (empty string if unknown)"),
        role: z
          .enum(["sender", "recipient", "mentioned"])
          .describe("Relationship to this email"),
      })
    )
    .describe("People identified in this email"),
  topics: z
    .array(z.string())
    .describe("Key topics discussed (e.g. pricing, demo, support, contract)"),
});

export type ExtractedEntities = z.infer<typeof extractedEntitiesSchema>;

// ─── JSON Schema (inline for providers without structured outputs) ─

const JSON_SCHEMA = `{
  "company": { "name": "Company name or empty string", "domain": "Domain or empty string" },
  "contacts": [{ "email": "...", "name": "Full name or empty", "title": "Job title or empty", "role": "sender|recipient|mentioned" }],
  "topics": ["topic1", "topic2"]
}`;

// ─── Extraction Prompt ───────────────────────────────────────────

const EXTRACTION_PROMPT = `You are an entity extraction system. Given an email, extract structured information.

Return ONLY a JSON object matching this exact schema:
${JSON_SCHEMA}

Rules:
- Company: The organization being discussed (sender/recipient's company, not the user's own). Use empty strings if none detected.
- Contacts: Every person involved — sender, recipients, mentioned people. Include email, name, title, role.
- Topics: 1-5 key business topics (e.g. pricing, demo, support, contract, onboarding, renewal).
- Be accurate. Do not fabricate. Use empty strings for unknown fields.

IMPORTANT: Respond with ONLY the JSON object, no markdown, no explanation.`;

// ─── Extraction Function ─────────────────────────────────────────

export async function extractEntities(params: {
  fromAddress: string;
  fromName: string | null;
  toAddresses: string[];
  ccAddresses?: string[] | null;
  subject: string | null;
  bodyText: string | null;
  snippet: string | null;
}): Promise<ExtractedEntities> {
  const context = [
    `From: ${params.fromName ?? params.fromAddress} <${params.fromAddress}>`,
    `To: ${params.toAddresses.join(", ")}`,
    params.ccAddresses?.length ? `Cc: ${params.ccAddresses.join(", ")}` : null,
    `Subject: ${params.subject ?? "(no subject)"}`,
    "",
    params.bodyText ?? params.snippet ?? "(no content)",
  ]
    .filter(Boolean)
    .join("\n");

  const { text } = await generateText({
    model: deepseek("deepseek-chat"),
    system: EXTRACTION_PROMPT,
    prompt: context,
    temperature: 0.1,
  });

  // Parse and validate the JSON response
  const cleaned = text.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned);
  return extractedEntitiesSchema.parse(parsed);
}
