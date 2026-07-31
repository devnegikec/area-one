import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { emails, customerMemoryEntries, customers } from "@/db/schema";
import { workspaceMembers } from "@/db/schema/workspaces";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const deepseek = createOpenAICompatible({
  name: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

/**
 * GET /api/search?q=...&mode=ask
 *
 * Hybrid search: text search across emails + memory, plus AI answer mode.
 * mode=ask: Uses DeepSeek to answer questions based on search results.
 */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();
  const mode = searchParams.get("mode") || "search"; // "search" or "ask"

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], answer: null });
  }

  // Auto-resolve workspace
  const [membership] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);

  if (!membership) {
    return NextResponse.json({ results: [], answer: null });
  }

  const wid = membership.workspaceId;
  const pattern = `%${query}%`;

  // Search emails
  const emailResults = await db
    .select({
      id: emails.id,
      type: sql<string>`'email'`.mapWith(String),
      title: emails.subject,
      snippet: emails.snippet,
      receivedAt: emails.receivedAt,
      customerName: customers.name,
    })
    .from(emails)
    .leftJoin(customers, eq(customers.id, emails.customerId))
    .where(
      and(
        eq(emails.workspaceId, wid),
        or(
          ilike(emails.subject, pattern),
          ilike(emails.bodyText, pattern),
          ilike(emails.snippet, pattern)
        )
      )
    )
    .orderBy(desc(emails.receivedAt))
    .limit(10);

  // Search memory facts
  const memoryResults = await db
    .select({
      id: customerMemoryEntries.id,
      type: sql<string>`'memory'`.mapWith(String),
      title: customerMemoryEntries.fact,
      snippet: customerMemoryEntries.evidence,
      receivedAt: customerMemoryEntries.createdAt,
      customerName: customers.name,
    })
    .from(customerMemoryEntries)
    .leftJoin(customers, eq(customers.id, customerMemoryEntries.customerId))
    .where(
      and(
        eq(customerMemoryEntries.workspaceId, wid),
        eq(customerMemoryEntries.status, "active"),
        or(
          ilike(customerMemoryEntries.fact, pattern),
          ilike(customerMemoryEntries.evidence, pattern)
        )
      )
    )
    .orderBy(desc(customerMemoryEntries.confidence))
    .limit(10);

  const results = [...emailResults, ...memoryResults];

  // AI Answer mode
  let answer: string | null = null;
  if (mode === "ask" && results.length > 0) {
    const context = results
      .map(
        (r, i) =>
          `[${i + 1}] ${r.type === "email" ? "Email" : "Fact"}${r.customerName ? ` (${r.customerName})` : ""}: ${r.title || r.snippet || ""}`
      )
      .join("\n");

    const { text } = await generateText({
      model: deepseek("deepseek-chat"),
      system:
        "You are a revenue intelligence assistant. Answer the user's question based on the provided search results. Be concise and cite specific evidence. If the results don't answer the question, say so.",
      prompt: `Question: ${query}\n\nSearch Results:\n${context}`,
      temperature: 0.3,
    });

    answer = text;
  }

  return NextResponse.json({ results, answer });
}
