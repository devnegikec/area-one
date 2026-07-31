"use client";

import * as React from "react";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Mail, Users, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Digest {
  summary: string;
  stats: {
    totalEmails: number;
    newCustomers: number;
    pendingRecommendations: number;
    dealsProgressed: number;
    dealsStalled: number;
    overdueFollowUps: number;
  };
  highlights: string[];
}

export default function ReportsPage() {
  const [digest, setDigest] = React.useState<Digest | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchDigest() {
      try {
        const res = await fetch("/api/reports/weekly");
        if (res.ok) setDigest(await res.json());
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchDigest();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">Weekly digest and deal pipeline</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : digest ? (
          <>
            {/* AI Summary */}
            <Card className="border-violet-200 dark:border-violet-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                  Weekly Digest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{digest.summary}</p>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <StatCard icon={<Mail className="h-4 w-4" />} label="Emails" value={digest.stats.totalEmails} />
              <StatCard icon={<Users className="h-4 w-4" />} label="New Customers" value={digest.stats.newCustomers} />
              <StatCard icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} label="Deals Progressed" value={digest.stats.dealsProgressed} />
              <StatCard icon={<TrendingDown className="h-4 w-4 text-red-500" />} label="Deals Stalled" value={digest.stats.dealsStalled} />
              <StatCard icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} label="Pending Actions" value={digest.stats.pendingRecommendations} />
              <StatCard icon={<AlertTriangle className="h-4 w-4 text-orange-500" />} label="Overdue" value={digest.stats.overdueFollowUps} />
            </div>

            {/* Highlights */}
            {digest.highlights.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Recent Highlights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {digest.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-violet-500 mt-0.5">•</span>
                        <span className="text-muted-foreground">{h}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium">No data yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Reports appear once you have emails and customer activity. Connect Gmail to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-muted mb-2">
          {icon}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
