"use client";

import * as React from "react";
import { Mail, Clock, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailCard } from "@/components/email-card";

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

interface DashboardHomeProps {
  workspaceId?: string;
}

export function DashboardHome({ workspaceId }: DashboardHomeProps) {
  const [recentEmails, setRecentEmails] = React.useState<Array<{
    id: string;
    fromAddress: string;
    fromName: string | null;
    subject: string | null;
    snippet: string | null;
    receivedAt: string;
    aiSentiment: string | null;
    direction: string;
  }>>([]);
  const [stats, setStats] = React.useState({
    totalEmails: 0,
    inbound: 0,
    outbound: 0,
    withSentiment: 0,
  });

  const loading = !!workspaceId && recentEmails.length === 0;

  React.useEffect(() => {
    if (!workspaceId) {
      return;
    }

    async function fetchEmails() {
      try {
        const res = await fetch(`/api/emails?workspace_id=${workspaceId}&limit=10`);
        if (res.ok) {
          const emails = await res.json();
          setRecentEmails(emails);

          // Calculate stats
          setStats({
            totalEmails: emails.length,
            inbound: emails.filter((e: { direction: string }) => e.direction === "inbound").length,
            outbound: emails.filter((e: { direction: string }) => e.direction === "outbound").length,
            withSentiment: emails.filter((e: { aiSentiment: string | null }) => e.aiSentiment).length,
          });
        }
      } catch {
        // silently fail
      }
    }

    fetchEmails();
  }, [workspaceId]);

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
          value="--"
          description="Connect Gmail to see actions"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Active Deals"
          value="--"
          description="Pipeline tracking coming soon"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Emails Synced"
          value={workspaceId ? String(stats.totalEmails) : "--"}
          description={workspaceId ? `${stats.inbound} inbound, ${stats.outbound} outbound` : "Connect Gmail to sync"}
          icon={<Mail className="h-4 w-4" />}
        />
        <StatCard
          title="Customers"
          value="--"
          description="AI extraction in Phase 2"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Recent Emails */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Emails</h2>
        {!workspaceId ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Mail className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">Connect your Gmail account to see your emails here.</p>
              <a
                href="/dashboard/settings"
                className="text-sm text-primary hover:underline font-medium"
              >
                Go to Settings →
              </a>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : recentEmails.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No emails synced yet. New emails will appear here automatically.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentEmails.map((email) => (
              <EmailCard
                key={email.id}
                id={email.id}
                from={email.fromAddress}
                fromName={email.fromName || undefined}
                subject={email.subject || "(No subject)"}
                preview={email.snippet || ""}
                receivedAt={email.receivedAt}
                isUnread={email.direction === "inbound"}
                sentiment={
                  email.aiSentiment === "positive"
                    ? "positive"
                    : email.aiSentiment === "negative"
                      ? "negative"
                      : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
