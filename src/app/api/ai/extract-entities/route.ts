import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { emails } from "@/db/schema/emails";
import { extractEntities } from "@/lib/ai/extraction";
import { matchCustomer, upsertContacts } from "@/lib/customer-memory/customer-matcher";
import { eq } from "drizzle-orm";

/**
 * POST /api/ai/extract-entities
 *
 * Trigger entity extraction for a specific email.
 * Called after an email is processed (from Gmail webhook, initial sync, etc.).
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
    return NextResponse.json({ error: "Missing emailId in body" }, { status: 400 });
  }

  if (!emailId) {
    return NextResponse.json({ error: "emailId is required" }, { status: 400 });
  }

  // Fetch the email
  const [email] = await db
    .select()
    .from(emails)
    .where(eq(emails.id, emailId))
    .limit(1);

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
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

    // Step 2: Match or create customer
    const customerId = await matchCustomer(
      email.workspaceId,
      entities,
      email.fromAddress
    );

    // Step 3: Upsert contacts
    await upsertContacts(email.workspaceId, customerId, entities);

    // Step 4: Link email to customer
    await db
      .update(emails)
      .set({ customerId, processedAt: new Date() })
      .where(eq(emails.id, emailId));

    // Step 5: Trigger memory extraction (fire-and-forget)
    triggerMemoryExtraction(emailId).catch((err) =>
      console.error(`Memory extraction failed for email ${emailId}:`, err)
    );

    // Step 6: Trigger timeline event (fire-and-forget)
    triggerTimelineEvent(emailId).catch((err) =>
      console.error(`Timeline event failed for email ${emailId}:`, err)
    );

    return NextResponse.json({
      customerId,
      company: entities.company.name || null,
      contactsFound: entities.contacts.length,
      topics: entities.topics,
    });
  } catch (error) {
    console.error("Entity extraction failed:", error);
    return NextResponse.json(
      { error: "Extraction failed", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Fire-and-forget memory extraction after entity extraction completes.
 */
async function triggerMemoryExtraction(emailId: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await fetch(`${baseUrl}/api/ai/extract-memory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailId }),
  });
}

/**
 * Fire-and-forget timeline event generation.
 */
async function triggerTimelineEvent(emailId: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await fetch(`${baseUrl}/api/ai/generate-timeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailId }),
  });
}
