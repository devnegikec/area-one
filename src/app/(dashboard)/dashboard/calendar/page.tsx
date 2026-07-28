import { DashboardLayout } from "@/components/dashboard-layout";

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Coming soon.
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CalendarPage() {
  return <PlaceholderPage title="Calendar" description="View and manage your scheduled meetings" />;
}
