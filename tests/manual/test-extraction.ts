/**
 * Test script: Run entity extraction on an email directly (bypasses HTTP/auth).
 *
 * Usage:
 *   npx tsx --require ./tests/manual/preload-env.cjs tests/manual/test-extraction.ts <emailId>
 *
 * Example:
 *   npx tsx --require ./tests/manual/preload-env.cjs tests/manual/test-extraction.ts 26682312-e49b-414c-9dd7-f84f807d3918
 */
import { db } from "@/db";
import { emails } from "@/db/schema/emails";
import { extractEntities } from "@/lib/ai/extraction";
import { matchCustomer, upsertContacts } from "@/lib/customer-memory/customer-matcher";
import { eq } from "drizzle-orm";

async function main() {
  const emailId = process.argv[2];
  if (!emailId) {
    console.error("Usage: npx tsx tests/manual/test-extraction.ts <emailId>");
    process.exit(1);
  }

  // 1. Fetch the email
  const [email] = await db.select().from(emails).where(eq(emails.id, emailId)).limit(1);
  if (!email) {
    console.error(`❌ Email not found: ${emailId}`);
    process.exit(1);
  }

  console.log(`📧 Email: "${email.subject}"`);
  console.log(`   From: ${email.fromName} <${email.fromAddress}>`);

  // 2. Extract entities
  console.log("\n🤖 Running AI extraction...");
  const entities = await extractEntities({
    fromAddress: email.fromAddress,
    fromName: email.fromName,
    toAddresses: email.toAddresses,
    ccAddresses: email.ccAddresses,
    subject: email.subject,
    bodyText: email.bodyText,
    snippet: email.snippet,
  });

  console.log("\n📊 Extraction results:");
  console.log(`   Company: ${entities.company.name || "none detected"}`);
  if (entities.company.domain) {
    console.log(`   Domain: ${entities.company.domain}`);
  }

  console.log(`\n   Contacts (${entities.contacts.length}):`);
  for (const c of entities.contacts) {
    console.log(`     - ${c.name || "unknown"} <${c.email}> [${c.role}]${c.title ? ` — ${c.title}` : ""}`);
  }

  console.log(`\n   Topics: ${entities.topics.join(", ") || "none"}`);

  // 3. Match or create customer
  const customerId = await matchCustomer(email.workspaceId, entities, email.fromAddress);
  console.log(`\n👤 Customer linked: ${customerId}`);

  // 4. Upsert contacts
  await upsertContacts(email.workspaceId, customerId, entities);

  // 5. Link email to customer
  await db.update(emails).set({ customerId }).where(eq(emails.id, emailId));

  console.log("✅ Extraction complete — email linked to customer, contacts stored.");
}

main().catch(console.error);
