import { DashboardLayout } from "@/components/dashboard-layout";

export default function EmailsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emails</h1>
          <p className="text-muted-foreground mt-1">Browse and search your email conversations</p>
        </div>
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Email feed coming soon. Connect Gmail to get started.
        </div>
      </div>
    </DashboardLayout>
  );
}
