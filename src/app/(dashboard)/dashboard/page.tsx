import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardHome } from "@/components/dashboard-home";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string; gmail_connected?: string; emails_synced?: string }>;
}) {
  const params = await searchParams;

  return (
    <DashboardLayout>
      {params.gmail_connected === "true" && (
        <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-700 dark:text-emerald-300">
          ✅ Gmail connected successfully! {params.emails_synced} emails synced.
        </div>
      )}
      <DashboardHome workspaceId={params.workspace} />
    </DashboardLayout>
  );
}
