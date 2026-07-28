import { DashboardLayout } from "@/components/dashboard-layout";

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer relationships</p>
        </div>
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Customer management coming in Phase 2 — AI Memory Extraction.
        </div>
      </div>
    </DashboardLayout>
  );
}
