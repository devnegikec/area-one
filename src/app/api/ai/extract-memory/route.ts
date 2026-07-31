import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { emails, customerMemoryEntries } from "@/db/schema";
import { extractFacts } from "@/lib/customer-memory/extract-facts";
import { eq } from "drizzle-orm";

/**
 * POST /api/ai/extract-memory
 *
 * Trigger fact extraction for an email that's already linked to a customer.
 * Called after entity extraction completes.
 *
 * Body: { emailId: string }
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let emailId: string;
  try {
    const body = await req.json();
    emailId = body.emailId;
  } catch {
    return NextResponse.json({ error: "Missing emailId" }, { status: 400 });
  }

  const [email] = await db
    .select()
    .from(emails)
    .where(eq(emails.id, emailId))
    .limit(1);

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  if (!email.customerId) {
    return NextResponse.json(
      { error: "Email not linked to a customer yet. Run entity extraction first." },
      { status: 400 }
    );
  }

  try {
    // Fetch existing facts for deduplication
    const existing = await db
      .select({ fact: customerMemoryEntries.fact })
      .from(customerMemoryEntries)
      .where(eq(customerMemoryEntries.customerId, email.customerId));

    const existingFacts = existing.map((e) => e.fact);

    // Extract facts via AI
    const facts = await extractFacts({
      subject: email.subject,
      bodyText: email.bodyText,
      snippet: email.snippet,
      existingFacts,
    });

    // Store new facts (skip duplicates)
    let stored = 0;
    for (const fact of facts) {
      // Check for near-duplicate
      const isDuplicate = existingFacts.some(
        (ef) => ef.toLowerCase().includes(fact.fact.toLowerCase().slice(0, 20)) ||
                fact.fact.toLowerCase().includes(ef.toLowerCase().slice(0, 20))
      );

      if (!isDuplicate) {
        await db.insert(customerMemoryEntries).values({
          workspaceId: email.workspaceId,
          customerId: email.customerId!,
          sourceEmailId: email.id,
          category: fact.category,
          fact: fact.fact,
          confidence: Math.min(100, Math.max(0, fact.confidence)),
          evidence: fact.evidence,
        });
        stored++;
      }
    }

    return NextResponse.json({
      factsFound: facts.length,
      factsStored: stored,
      duplicates: facts.length - stored,
    });
  } catch (error) {
    console.error("Memory extraction failed:", error);
    return NextResponse.json(
      { error: "Memory extraction failed", details: String(error) },
      { status: 500 }
    );
  }
}
