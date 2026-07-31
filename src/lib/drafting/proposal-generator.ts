import { db } from "@/db";
import { customers, customerMemoryEntries, contacts, timelineEvents } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const deepseek = createOpenAICompatible({
  name: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export interface GeneratedProposal {
  title: string;
  executiveSummary: string;
  sections: Array<{ heading: string; content: string }>;
  pricing: string;
  nextSteps: string;
}

export async function generateProposal(
  customerId: string,
  workspaceId: string
): Promise<GeneratedProposal> {
  // Gather full customer context
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
        eq(customerMemoryEntries.status, "active")
      )
    )
    .limit(25);

  const customerContacts = await db
    .select({ name: contacts.name, email: contacts.email, title: contacts.title })
    .from(contacts)
    .where(eq(contacts.customerId, customerId))
    .limit(5);

  const recentTimeline = await db
    .select({ title: timelineEvents.title, occurredAt: timelineEvents.occurredAt })
    .from(timelineEvents)
    .where(eq(timelineEvents.customerId, customerId))
    .orderBy(desc(timelineEvents.occurredAt))
    .limit(10);

  const context = [
    `Customer: ${customer?.name || "Unknown"}${customer?.domain ? ` (${customer.domain})` : ""}`,
    "",
    "Key Contacts:",
    ...customerContacts.map((c) => `  ${c.name || "Unknown"} - ${c.title || "No title"} (${c.email})`),
    "",
    "Known Facts:",
    ...facts.map((f) => `  [${f.category}] ${f.fact}`),
    "",
    "Recent Activity:",
    ...recentTimeline.map((e) => `  ${new Date(e.occurredAt).toLocaleDateString()} - ${e.title}`),
  ].join("\n");

  const { text } = await generateText({
    model: deepseek("deepseek-chat"),
    system: `You are a sales proposal writer. Create a professional proposal based on the customer context.

Format your response EXACTLY as:
TITLE: [Proposal title]
EXECUTIVE_SUMMARY: [2-3 sentence summary of the proposal]
SECTION: Understanding Your Needs
[Content about customer's requirements, pain points, goals]
SECTION: Our Solution
[How your product/service addresses their needs]
SECTION: Why Now
[Timeline, urgency, ROI justification]
SECTION: Implementation Plan
[High-level steps and timeline]
PRICING: [Pricing recommendation based on budget facts]
NEXT_STEPS: [Clear call-to-action and next steps]

Use the customer's actual name, facts, and context. Be specific. Reference their budget, timeline, and requirements from the facts provided.`,
    prompt: context,
    temperature: 0.5,
  });

  return parseProposal(text);
}

function parseProposal(text: string): GeneratedProposal {
  const getSection = (label: string): string => {
    const regex = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`, "i");
    return text.match(regex)?.[1]?.trim() || "";
  };

  const sectionRegex = /SECTION:\s*(.+?)\n([\s\S]*?)(?=\nSECTION:|$)/gi;
  const sections: Array<{ heading: string; content: string }> = [];
  let match;
  while ((match = sectionRegex.exec(text)) !== null) {
    sections.push({ heading: match[1].trim(), content: match[2].trim() });
  }

  return {
    title: getSection("TITLE") || "Proposal",
    executiveSummary: getSection("EXECUTIVE_SUMMARY"),
    sections,
    pricing: getSection("PRICING"),
    nextSteps: getSection("NEXT_STEPS"),
  };
}
