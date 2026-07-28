import { Mail, Clock, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ title, value, description, icon, trend, trendUp }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
          {trend && (
            <span className={trendUp ? "text-emerald-500 ml-1" : "text-destructive ml-1"}>{trend}</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

export function DashboardHome() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your revenue execution overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Actions"
          value="12"
          description="3 high priority"
          icon={<Clock className="h-4 w-4" />}
          trend="+2 today"
          trendUp={false}
        />
        <StatCard
          title="Active Deals"
          value="28"
          description="Across 15 customers"
          icon={<TrendingUp className="h-4 w-4" />}
          trend="+5 this week"
          trendUp
        />
        <StatCard
          title="Emails Today"
          value="47"
          description="12 unreplied"
          icon={<Mail className="h-4 w-4" />}
        />
        <StatCard
          title="Customers"
          value="89"
          description="8 new this month"
          icon={<Users className="h-4 w-4" />}
          trend="+8"
          trendUp
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Connect Gmail to see your recent emails here.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">AI recommendations will appear here once email processing is enabled.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
