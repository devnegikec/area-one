import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, contacts, emails, customerMemoryEntries, timelineEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/customers/[id]
 * Returns a single customer with contacts and recent emails.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const customerContacts = await db
    .select()
    .from(contacts)
    .where(eq(contacts.customerId, id))
    .orderBy(desc(contacts.aiLastSeen))
    .limit(50);

  const recentEmails = await db
    .select({
      id: emails.id,
      subject: emails.subject,
      snippet: emails.snippet,
      fromAddress: emails.fromAddress,
      fromName: emails.fromName,
      direction: emails.direction,
      receivedAt: emails.receivedAt,
      aiSentiment: emails.aiSentiment,
    })
    .from(emails)
    .where(eq(emails.customerId, id))
    .orderBy(desc(emails.receivedAt))
    .limit(20);

  const memory = await db
    .select({
      id: customerMemoryEntries.id,
      category: customerMemoryEntries.category,
      fact: customerMemoryEntries.fact,
      confidence: customerMemoryEntries.confidence,
      evidence: customerMemoryEntries.evidence,
      status: customerMemoryEntries.status,
      createdAt: customerMemoryEntries.createdAt,
    })
    .from(customerMemoryEntries)
    .where(eq(customerMemoryEntries.customerId, id))
    .orderBy(desc(customerMemoryEntries.confidence))
    .limit(50);

  const timeline = await db
    .select({
      id: timelineEvents.id,
      type: timelineEvents.type,
      title: timelineEvents.title,
      description: timelineEvents.description,
      occurredAt: timelineEvents.occurredAt,
    })
    .from(timelineEvents)
    .where(eq(timelineEvents.customerId, id))
    .orderBy(desc(timelineEvents.occurredAt))
    .limit(50);

  return NextResponse.json({
    customer,
    contacts: customerContacts,
    emails: recentEmails,
    memory,
    timeline,
  });
}
