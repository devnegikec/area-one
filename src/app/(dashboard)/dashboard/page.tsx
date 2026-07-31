import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { workspaceMembers } from "@/db/schema/workspaces";
import { eq } from "drizzle-orm";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardHome } from "@/components/dashboard-home";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string; gmail_connected?: string; emails_synced?: string }>;
}) {
  const params = await searchParams;

  // Auto-resolve workspace for the logged-in user
  const { userId } = await auth();
  let workspaceId: string | undefined = params.workspace;
  if (!workspaceId && userId) {
    const [membership] = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId))
      .limit(1);
    workspaceId = membership?.workspaceId;
  }

  return (
    <DashboardLayout>
      {params.gmail_connected === "true" && (
        <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-700 dark:text-emerald-300">
          ✅ Gmail connected successfully! {params.emails_synced} emails synced.
        </div>
      )}
      <DashboardHome workspaceId={workspaceId} />
    </DashboardLayout>
  );
}
