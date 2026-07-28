import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  provider: text("provider", {
    enum: [
      "gmail",
      "outlook",
      "slack",
      "google_calendar",
      "zoom",
      "hubspot",
      "salesforce",
      "stripe",
      "linkedin",
      "whatsapp",
    ],
  }).notNull(),
  status: text("status", {
    enum: ["active", "expired", "error", "disconnected"],
  })
    .notNull()
    .default("active"),
  // Encrypted credentials — NEVER store raw tokens here.
  // Store { encrypted, iv, tag } from aes-256-gcm encryption.
  credentials: jsonb("credentials").$type<EncryptedCredentials>(),
  settings: jsonb("settings").$type<Record<string, unknown>>(),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status", {
    enum: ["idle", "syncing", "error"],
  }).default("idle"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export interface EncryptedCredentials {
  encrypted: string;
  iv: string;
  tag: string;
}
