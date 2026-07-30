import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { workspaces } from "./workspaces";

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  customerId: uuid("customer_id")
    .references(() => customers.id, { onDelete: "cascade" })
    .notNull(),
  email: text("email").notNull(),
  name: text("name"),
  title: text("title"), // job title
  phone: text("phone"),
  isPrimary: text("is_primary").default("false"), // primary contact flag
  // AI-extracted
  aiRole: text("ai_role"), // "decision_maker", "influencer", "user"
  aiFirstSeen: timestamp("ai_first_seen"),
  aiLastSeen: timestamp("ai_last_seen"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
