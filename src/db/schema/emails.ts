import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const emails = pgTable("emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  gmailId: text("gmail_id").unique(),
  threadId: text("thread_id"),
  customerId: uuid("customer_id"), // FK added in Phase 2
  fromAddress: text("from_address").notNull(),
  fromName: text("from_name"),
  toAddresses: text("to_addresses").array().notNull(),
  ccAddresses: text("cc_addresses").array(),
  subject: text("subject"),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  snippet: text("snippet"),
  attachments: jsonb("attachments").$type<AttachmentMeta[]>(),
  direction: text("direction", { enum: ["inbound", "outbound"] }).notNull().default("inbound"),
  // AI-generated fields (populated in Phase 2)
  aiSummary: text("ai_summary"),
  aiIntent: text("ai_intent"),
  aiSentiment: text("ai_sentiment", { enum: ["positive", "neutral", "negative"] }),
  aiActionItems: jsonb("ai_action_items").$type<string[]>(),
  sentAt: timestamp("sent_at"),
  receivedAt: timestamp("received_at").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface AttachmentMeta {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}
