import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { workspaces } from "./workspaces";
import { emails } from "./emails";

export const customerMemoryEntries = pgTable("customer_memory_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  customerId: uuid("customer_id")
    .references(() => customers.id, { onDelete: "cascade" })
    .notNull(),
  sourceEmailId: uuid("source_email_id")
    .references(() => emails.id, { onDelete: "set null" }),
  category: text("category", {
    enum: [
      "budget",
      "timeline",
      "objection",
      "competitor",
      "decision_maker",
      "requirements",
      "commitment",
      "general",
    ],
  }).notNull(),
  fact: text("fact").notNull(), // The extracted fact (e.g., "Budget is $50K/year")
  confidence: integer("confidence").default(50).notNull(), // 0-100
  evidence: text("evidence"), // Snippet from email supporting the fact
  status: text("status", { enum: ["active", "expired", "corrected"] })
    .default("active")
    .notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
