import { pgTable, uuid, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { workspaces } from "./workspaces";
import { emails } from "./emails";

export const recommendations = pgTable("recommendations", {
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
      "send_email",
      "schedule_meeting",
      "share_pricing",
      "follow_up",
      "escalate",
      "mark_lost",
      "ask_feedback",
      "send_proposal",
    ],
  }).notNull(),
  title: text("title").notNull(),
  reasoning: text("reasoning"), // WHY this recommendation (e.g., "Customer asked about pricing 3 days ago")
  draftContent: text("draft_content"), // AI-generated draft email/content
  urgency: text("urgency", { enum: ["critical", "high", "medium", "low"] })
    .default("medium")
    .notNull(),
  confidence: integer("confidence").default(50).notNull(), // 0-100
  evidence: jsonb("evidence").$type<string[]>(), // Supporting email/memory IDs
  status: text("status", { enum: ["pending", "approved", "rejected", "executed", "snoozed"] })
    .default("pending")
    .notNull(),
  snoozeUntil: timestamp("snooze_until"),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
