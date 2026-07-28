import { db } from "@/db";
import { workspaces, workspaceMembers } from "@/db/schema/workspaces";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  settings: {
    aiAutoApprove: boolean;
    retentionDays: number;
    defaultTone: string;
  };
  role: "owner" | "admin" | "member";
  createdAt: Date;
}

/**
 * Get all workspaces for the currently authenticated user.
 */
export async function getUserWorkspaces(): Promise<WorkspaceData[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const memberships = await db
    .select({
      workspace: workspaces,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId));

  return memberships.map(({ workspace, role }) => ({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    settings: workspace.settings as WorkspaceData["settings"],
    role: role as WorkspaceData["role"],
    createdAt: workspace.createdAt,
  }));
}

/**
 * Get a single workspace by slug. Verifies the current user is a member.
 */
export async function getWorkspaceBySlug(slug: string): Promise<WorkspaceData | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const [result] = await db
    .select({
      workspace: workspaces,
      role: workspaceMembers.role,
    })
    .from(workspaces)
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaces.id, workspaceMembers.workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    )
    .where(eq(workspaces.slug, slug))
    .limit(1);

  if (!result) return null;

  return {
    id: result.workspace.id,
    name: result.workspace.name,
    slug: result.workspace.slug,
    settings: result.workspace.settings as WorkspaceData["settings"],
    role: result.role as WorkspaceData["role"],
    createdAt: result.workspace.createdAt,
  };
}

/**
 * Create a new workspace for the current user.
 */
export async function createWorkspace(
  name: string
): Promise<WorkspaceData | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;

  const [workspace] = await db
    .insert(workspaces)
    .values({ name, slug })
    .returning();

  if (!workspace) return null;

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId,
    role: "owner",
    joinedAt: new Date(),
  });

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    settings: workspace.settings as WorkspaceData["settings"],
    role: "owner",
    createdAt: workspace.createdAt,
  };
}

/**
 * Invite a user to a workspace by Clerk user ID.
 */
export async function inviteMember(
  workspaceId: string,
  inviteeUserId: string,
  role: "admin" | "member" = "member"
): Promise<void> {
  const [existingMember] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, inviteeUserId)
      )
    )
    .limit(1);

  if (existingMember) return; // Already a member

  await db.insert(workspaceMembers).values({
    workspaceId,
    userId: inviteeUserId,
    role,
    invitedAt: new Date(),
  });
}
