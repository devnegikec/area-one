import { pgTable, uuid, text, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    settings: jsonb("settings").$type<WorkspaceSettings>().default({
      aiAutoApprove: false,
      retentionDays: 365,
      defaultTone: "professional",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("workspace_slug_idx").on(table.slug),
  })
);

export const workspaceMembers = pgTable("workspace_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").notNull(), // Clerk user ID
  role: text("role", { enum: ["owner", "admin", "member"] })
    .notNull()
    .default("member"),
  invitedAt: timestamp("invited_at").defaultNow(),
  joinedAt: timestamp("joined_at"),
});

export interface WorkspaceSettings {
  aiAutoApprove: boolean;
  retentionDays: number;
  defaultTone: "professional" | "casual" | "formal";
}
