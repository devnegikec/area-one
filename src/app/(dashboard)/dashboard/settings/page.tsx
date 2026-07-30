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

  const handleConnectGmail = () => {
    setConnectingGmail(true);
    window.location.href = "/api/integrations/gmail/connect";
  };

  const handleConnectSlack = () => {
    setConnectingSlack(true);
    window.location.href = "/api/integrations/slack/connect";
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
                {false ? (
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
                {false ? (
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

            {/* Calendar placeholder */}
            <div className="flex items-center justify-between rounded-lg border p-4 opacity-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-sm text-muted-foreground">Coming soon — schedule meetings, sync events</p>
                </div>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
