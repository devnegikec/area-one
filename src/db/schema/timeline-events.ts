import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { workspaces } from "./workspaces";
import { emails } from "./emails";

export const timelineEvents = pgTable("timeline_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  customerId: uuid("customer_id")
    .references(() => customers.id, { onDelete: "cascade" })
    .notNull(),
  sourceEmailId: uuid("source_email_id")
    .references(() => emails.id, { onDelete: "set null" }),
  type: text("type", {
    enum: [
      "email_received",
      "email_sent",
      "meeting_scheduled",
      "deal_progressed",
      "deal_stalled",
      "objection_raised",
      "commitment_made",
      "ai_action",
      "note",
    ],
  }).notNull(),
  title: text("title").notNull(), // AI-generated title (e.g., "Sarah asked about Enterprise pricing")
  description: text("description"), // AI-generated 1-2 sentence summary
  occurredAt: timestamp("occurred_at").notNull(), // When the event actually happened
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
