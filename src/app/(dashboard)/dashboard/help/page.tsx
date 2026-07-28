import { DashboardLayout } from "@/components/dashboard-layout";

export default function HelpPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-muted-foreground mt-1">Get help with Area-One</p>
        </div>
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Help center coming soon. Contact support@area-one.com for assistance.
        </div>
      </div>
    </DashboardLayout>
  );
}
