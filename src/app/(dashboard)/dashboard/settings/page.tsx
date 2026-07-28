import { DashboardLayout } from "@/components/dashboard-layout";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your workspace and integrations</p>
        </div>
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Settings panel coming soon.
        </div>
      </div>
    </DashboardLayout>
  );
}
