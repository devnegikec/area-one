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
