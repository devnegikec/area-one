import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  customerId: uuid("customer_id"), // FK added in Phase 2
  channel: text("channel", {
    enum: ["email", "slack", "linkedin", "meeting", "phone", "whatsapp"],
  }).notNull(),
  externalId: text("external_id").unique(), // Gmail thread ID, Slack channel ID
  subject: text("subject"),
  summary: text("summary"), // AI-generated summary (Phase 2)
  sentiment: text("sentiment", { enum: ["positive", "neutral", "negative"] }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id, { onDelete: "cascade" })
    .notNull(),
  direction: text("direction", { enum: ["inbound", "outbound"] })
    .notNull()
    .default("inbound"),
  senderEmail: text("sender_email"),
  senderName: text("sender_name"),
  recipientEmail: text("recipient_email"),
  subject: text("subject"),
  body: text("body"),
  bodyHtml: text("body_html"),
  attachments: jsonb("attachments").$type<AttachmentMeta[]>(),
  // AI fields (Phase 2)
  aiSummary: text("ai_summary"),
  aiIntent: text("ai_intent"),
  aiActionItems: jsonb("ai_action_items").$type<string[]>(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

interface AttachmentMeta {
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}
