import { db } from "@/db";
import { customers, contacts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { ExtractedEntities } from "@/lib/ai/extraction";

/**
 * Match or create a customer based on extracted entities.
 * Strategy:
 * 1. Try matching by domain (email domain of sender/recipients)
 * 2. Try matching by company name
 * 3. Create new customer if no match
 */
export async function matchCustomer(
  workspaceId: string,
  entities: ExtractedEntities,
  fromAddress: string
): Promise<string> {
  const companyName = entities.company.name || null;
  const companyDomain = entities.company.domain || fromAddress.split("@")[1] || null;

  // 1. Try matching by domain
  if (companyDomain) {
    const [existingDomain] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(eq(customers.workspaceId, workspaceId), eq(customers.domain, companyDomain))
      )
      .limit(1);

    if (existingDomain) {
      await updateCustomerFromExtraction(existingDomain.id, entities);
      return existingDomain.id;
    }
  }

  // 2. Try matching by company name
  if (companyName) {
    const [existingName] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(eq(customers.workspaceId, workspaceId), eq(customers.name, companyName))
      )
      .limit(1);

    if (existingName) {
      // Fill in domain if we now know it
      if (companyDomain) {
        await db
          .update(customers)
          .set({ domain: companyDomain, updatedAt: new Date() })
          .where(eq(customers.id, existingName.id));
      }
      await updateCustomerFromExtraction(existingName.id, entities);
      return existingName.id;
    }
  }

  // 3. Create new customer
  const [newCustomer] = await db
    .insert(customers)
    .values({
      workspaceId,
      name: companyName || companyDomain || fromAddress,
      domain: companyDomain,
    })
    .returning({ id: customers.id });

  return newCustomer.id;
}

/**
 * Update customer metadata from extraction results.
 */
async function updateCustomerFromExtraction(
  customerId: string,
  entities: ExtractedEntities
): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  // Update domain if we now have one and it's not already set
  if (entities.company.domain) {
    const [existing] = await db
      .select({ domain: customers.domain })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!existing?.domain) {
      updates.domain = entities.company.domain;
    }
  }

  if (Object.keys(updates).length > 1) {
    await db.update(customers).set(updates).where(eq(customers.id, customerId));
  }
}

/**
 * Upsert contacts from extracted entities.
 * Links them to the customer and updates their last-seen timestamp.
 */
export async function upsertContacts(
  workspaceId: string,
  customerId: string,
  entities: ExtractedEntities
): Promise<void> {
  for (const contact of entities.contacts) {
    // Check if contact already exists
    const [existing] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceId, workspaceId),
          eq(contacts.email, contact.email)
        )
      )
      .limit(1);

    if (existing) {
      // Update last seen + any new info
      await db
        .update(contacts)
        .set({
          name: contact.name ?? undefined,
          title: contact.title ?? undefined,
          aiRole: contact.role,
          aiLastSeen: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, existing.id));
    } else {
      // Create new contact
      await db.insert(contacts).values({
        workspaceId,
        customerId,
        email: contact.email,
        name: contact.name ?? null,
        title: contact.title ?? null,
        aiRole: contact.role,
        aiFirstSeen: new Date(),
        aiLastSeen: new Date(),
      });
    }
  }
}
