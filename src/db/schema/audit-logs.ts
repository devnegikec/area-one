import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").notNull(), // Clerk user ID
  action: text("action", {
    enum: [
      "workspace.created",
      "workspace.updated",
      "integration.connected",
      "integration.disconnected",
      "email.synced",
      "email.sent",
      "recommendation.approved",
      "recommendation.rejected",
      "draft.sent",
      "memory.updated",
      "customer.merged",
      "settings.autonomy.changed",
      "data.exported",
      "member.invited",
      "member.removed",
    ],
  }).notNull(),
  resource: text("resource").notNull(), // e.g., "customer:xxx", "integration:gmail"
  details: jsonb("details").$type<Record<string, unknown>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
