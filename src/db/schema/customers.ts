import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  domain: text("domain"), // primary email domain (e.g., "acme.com")
  // AI-extracted metadata
  aiSummary: text("ai_summary"), // brief company description
  aiIndustry: text("ai_industry"), // detected industry
  aiEngagementScore: text("ai_engagement_score"), // "high", "medium", "low"
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
