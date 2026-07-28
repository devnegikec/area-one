import { db } from "@/db";
import { workspaces, workspaceMembers } from "@/db/schema/workspaces";
import { eq, and } from "drizzle-orm";

/**
 * Sync Clerk user events to our database.
 *
 * Events handled:
 * - user.created   → create a default workspace for the new user
 * - user.updated   → (future: update user metadata)
 * - user.deleted   → remove user from workspace_members
 * - organizationMembership.created → add user to workspace (invite accept)
 */
export async function syncClerkUser(
  eventType: string,
  data: Record<string, unknown>
): Promise<void> {
  switch (eventType) {
    case "user.created":
      await handleUserCreated(data);
      break;
    case "user.deleted":
      await handleUserDeleted(data);
      break;
    case "organizationMembership.created":
      await handleOrgMembershipCreated(data);
      break;
    default:
      // Ignore other events silently
      break;
  }
}

async function handleUserCreated(data: Record<string, unknown>) {
  const userId = data.id as string;
  const email = ((data.email_addresses as Array<{ email_address: string }>)?.[0]?.email_address) || "";
  const firstName = (data.first_name as string) || "";

  // Create a default workspace named after the user
  const slug = `${(firstName || email.split("@")[0]).toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: `${firstName || email.split("@")[0]}'s Workspace`,
      slug,
    })
    .returning();

  if (!workspace) return;

  // Add user as workspace owner
  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId,
    role: "owner",
    joinedAt: new Date(),
  });
}

async function handleUserDeleted(data: Record<string, unknown>) {
  const userId = data.id as string;
  if (!userId) return;

  // Remove user from all workspaces
  await db.delete(workspaceMembers).where(eq(workspaceMembers.userId, userId));
}

async function handleOrgMembershipCreated(data: Record<string, unknown>) {
  // Clerk org membership webhook data structure
  const pubData = data.public_user_data as Record<string, unknown> | undefined;
  const org = data.organization as Record<string, unknown> | undefined;
  const userId = (pubData?.user_id as string) || (data.user_id as string);
  const orgId = org?.id as string;

  if (!userId || !orgId) return;

  // Check if this org is linked to a workspace
  const [existingWorkspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, orgId))
    .limit(1);

  if (!existingWorkspace) return;

  // Add user as member (role: member by default, can be promoted later)
  const [existingMember] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, existingWorkspace.id),
        eq(workspaceMembers.userId, userId)
      )
    )
    .limit(1);

  if (!existingMember) {
    await db.insert(workspaceMembers).values({
      workspaceId: existingWorkspace.id,
      userId,
      role: "member",
      joinedAt: new Date(),
    });
  }
}
