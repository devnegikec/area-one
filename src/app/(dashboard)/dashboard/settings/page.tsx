"use client";

import * as React from "react";
import { Mail, Check, Loader2, MessageSquare } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [connectingGmail, setConnectingGmail] = React.useState(false);
  const [connectingSlack, setConnectingSlack] = React.useState(false);
  const [connectingCalendar, setConnectingCalendar] = React.useState(false);
  const [integrations, setIntegrations] = React.useState<{ gmail: boolean; slack: boolean; calendar: boolean }>({
    gmail: false,
    slack: false,
    calendar: false,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/integrations/status");
        if (res.ok) {
          const data = await res.json();
          setIntegrations(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, []);

  const handleConnectGmail = () => {
    setConnectingGmail(true);
    window.location.href = "/api/integrations/gmail/connect";
  };

  const handleConnectSlack = () => {
    setConnectingSlack(true);
    window.location.href = "/api/integrations/slack/connect";
  };

  const handleConnectCalendar = () => {
    setConnectingCalendar(true);
    window.location.href = "/api/integrations/calendar/connect";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your workspace and integrations</p>
        </div>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Integrations</CardTitle>
            <CardDescription>Connect your communication tools to enable AI-powered insights.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Gmail */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                  <Mail className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium">Gmail</p>
                  <p className="text-sm text-muted-foreground">Sync emails, get AI recommendations, send replies</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : integrations.gmail ? (
                  <Badge variant="success" className="gap-1">
                    <Check className="h-3 w-3" /> Connected
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectGmail}
                    disabled={connectingGmail}
                  >
                    {connectingGmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Connect Gmail
                  </Button>
                )}
              </div>
            </div>

            {/* Slack */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">Slack</p>
                  <p className="text-sm text-muted-foreground">Sync Slack conversations, get AI insights</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : integrations.slack ? (
                  <Badge variant="success" className="gap-1">
                    <Check className="h-3 w-3" /> Connected
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectSlack}
                    disabled={connectingSlack}
                  >
                    {connectingSlack && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Connect Slack
                  </Button>
                )}
              </div>
            </div>

            {/* Calendar */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-sm text-muted-foreground">Schedule meetings, sync events</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : integrations.calendar ? (
                  <Badge variant="success" className="gap-1">
                    <Check className="h-3 w-3" /> Connected
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectCalendar}
                    disabled={connectingCalendar}
                  >
                    {connectingCalendar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Connect Calendar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Autonomy Settings */}
        <AutonomySettings />

      </div>
    </DashboardLayout>
  );
}

const GUARDRAIL_LABELS: Record<number, string> = {
  0: "🤖 Fully Auto",
  1: "📝 Auto-Draft, Approve",
  2: "💡 Suggest Only",
  3: "🔒 Never Auto",
};

const AUTONOMY_ITEMS: Array<{ key: string; label: string; description: string }> = [
  { key: "entityExtraction", label: "Entity Extraction", description: "Extract companies and contacts from emails" },
  { key: "memoryExtraction", label: "Memory Extraction", description: "Extract facts (budget, timeline, objections)" },
  { key: "timelineGeneration", label: "Timeline Events", description: "Generate timeline events from emails" },
  { key: "recommendationGeneration", label: "Recommendations", description: "Generate next-best-action suggestions" },
  { key: "draftGeneration", label: "Draft Generation", description: "Auto-generate email drafts" },
  { key: "followUpSending", label: "Follow-up Emails", description: "Send follow-up emails" },
  { key: "emailSending", label: "Email Sending", description: "Send any email" },
  { key: "meetingScheduling", label: "Meeting Scheduling", description: "Schedule meetings automatically" },
  { key: "proposalSending", label: "Proposal Sending", description: "Send proposals to customers" },
  { key: "pricingChanges", label: "Pricing Changes", description: "Modify pricing in proposals/contracts" },
];

function AutonomySettings() {
  const [rules, setRules] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetch() {
      try {
        const res = await fetch("/api/settings/autonomy");
        if (res.ok) setRules(await res.json());
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const handleChange = async (key: string, level: number) => {
    setRules((prev) => ({ ...prev, [key]: level }));
    setSaving(key);
    await fetch("/api/settings/autonomy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: level }),
    });
    setSaving(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Autonomy Settings</CardTitle>
        <CardDescription>
          Control how much AI can do automatically. Higher levels = more human oversight.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {AUTONOMY_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <div className="flex items-center gap-1 ml-3">
              {saving === item.key && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              <select
                value={rules[item.key] ?? 1}
                onChange={(e) => handleChange(item.key, Number(e.target.value))}
                className="text-xs rounded-md border bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {[0, 1, 2, 3].map((level) => (
                  <option key={level} value={level}>
                    {GUARDRAIL_LABELS[level]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
