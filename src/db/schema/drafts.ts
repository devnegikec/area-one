import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { workspaces } from "./workspaces";
import { recommendations } from "./recommendations";

export const drafts = pgTable("drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  customerId: uuid("customer_id")
    .references(() => customers.id, { onDelete: "cascade" })
    .notNull(),
  recommendationId: uuid("recommendation_id")
    .references(() => recommendations.id, { onDelete: "set null" }),
  type: text("type", {
    enum: ["follow_up", "pricing", "meeting_request", "proposal_cover", "thank_you", "check_in"],
  }).notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(), // Plain text version
  bodyHtml: text("body_html"), // Optional HTML version
  version: integer("version").default(1).notNull(),
  status: text("status", { enum: ["draft", "sent", "discarded"] })
    .default("draft")
    .notNull(),
  editDistance: integer("edit_distance"), // How much user changed the AI draft (0-100)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
