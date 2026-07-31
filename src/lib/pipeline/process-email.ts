import { db } from "@/db";
import { emails, customers, customerMemoryEntries, timelineEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { extractEntities } from "@/lib/ai/extraction";
import { matchCustomer, upsertContacts } from "@/lib/customer-memory/customer-matcher";
import { extractFacts } from "@/lib/customer-memory/extract-facts";
import { generateTimelineEvent } from "@/lib/timeline/event-generator";

export interface PipelineResult {
  emailId: string;
  customerId: string | null;
  companyName: string | null;
  contactsFound: number;
  factsStored: number;
  timelineEvent: string | null;
  error: string | null;
}

/**
 * Run the full AI pipeline on a single email.
 * Called directly (not via HTTP) — no auth issues.
 */
export async function processEmail(emailId: string): Promise<PipelineResult> {
  const result: PipelineResult = {
    emailId,
    customerId: null,
    companyName: null,
    contactsFound: 0,
    factsStored: 0,
    timelineEvent: null,
    error: null,
  };

  // Fetch email
  const [email] = await db
    .select()
    .from(emails)
    .where(eq(emails.id, emailId))
    .limit(1);

  if (!email) {
    result.error = "Email not found";
    return result;
  }

  try {
    // Step 1: Extract entities with AI
    const entities = await extractEntities({
      fromAddress: email.fromAddress,
      fromName: email.fromName,
      toAddresses: email.toAddresses,
      ccAddresses: email.ccAddresses,
      subject: email.subject,
      bodyText: email.bodyText,
      snippet: email.snippet,
    });

    result.companyName = entities.company.name || null;

    // Step 2: Match or create customer
    const customerId = await matchCustomer(
      email.workspaceId,
      entities,
      email.fromAddress
    );
    result.customerId = customerId;

    // Step 3: Upsert contacts
    await upsertContacts(email.workspaceId, customerId, entities);
    result.contactsFound = entities.contacts.length;

    // Step 4: Link email to customer
    await db
      .update(emails)
      .set({ customerId, processedAt: new Date() })
      .where(eq(emails.id, emailId));

    // Step 5: Extract memory facts
    try {
      const existing = await db
        .select({ fact: customerMemoryEntries.fact })
        .from(customerMemoryEntries)
        .where(eq(customerMemoryEntries.customerId, customerId));

      const existingFacts = existing.map((e) => e.fact);
      const facts = await extractFacts({
        subject: email.subject,
        bodyText: email.bodyText,
        snippet: email.snippet,
        existingFacts,
      });

      for (const fact of facts) {
        const isDuplicate = existingFacts.some(
          (ef) =>
            ef.toLowerCase().includes(fact.fact.toLowerCase().slice(0, 20)) ||
            fact.fact.toLowerCase().includes(ef.toLowerCase().slice(0, 20))
        );

        if (!isDuplicate) {
          await db.insert(customerMemoryEntries).values({
            workspaceId: email.workspaceId,
            customerId,
            sourceEmailId: email.id,
            category: fact.category,
            fact: fact.fact,
            confidence: Math.min(100, Math.max(0, fact.confidence || 50)),
          });
          result.factsStored++;
        }
      }
    } catch (err) {
      console.error(`Memory extraction failed for ${emailId}:`, err);
    }

    // Step 6: Generate timeline event
    try {
      const event = await generateTimelineEvent({
        subject: email.subject,
        snippet: email.snippet,
        bodyText: email.bodyText,
        direction: email.direction,
        fromName: email.fromName,
        fromAddress: email.fromAddress,
      });

      await db.insert(timelineEvents).values({
        workspaceId: email.workspaceId,
        customerId,
        sourceEmailId: email.id,
        type: event.type,
        title: event.title,
        description: event.description,
        occurredAt: email.receivedAt,
      });

      result.timelineEvent = `${event.type}: ${event.title}`;
    } catch (err) {
      console.error(`Timeline generation failed for ${emailId}:`, err);
    }

    return result;
  } catch (error) {
    console.error(`Pipeline failed for ${emailId}:`, error);
    result.error = String(error).slice(0, 200);
    return result;
  }
}
