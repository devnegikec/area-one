"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Building2, Mail, User, ArrowLeft, Loader2, ExternalLink, Brain, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CustomerDetail {
  customer: {
    id: string;
    name: string;
    domain: string | null;
    aiSummary: string | null;
    aiIndustry: string | null;
    aiEngagementScore: string | null;
    createdAt: string;
  };
  contacts: Array<{
    id: string;
    email: string;
    name: string | null;
    title: string | null;
    aiRole: string | null;
    aiLastSeen: string | null;
  }>;
  emails: Array<{
    id: string;
    subject: string | null;
    snippet: string | null;
    fromAddress: string;
    fromName: string | null;
    direction: string;
    receivedAt: string;
    aiSentiment: string | null;
  }>;
  memory: Array<{
    id: string;
    category: string;
    fact: string;
    confidence: number;
    evidence: string | null;
    status: string;
    createdAt: string;
  }>;
  timeline: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    occurredAt: string;
  }>;
}

function sentimentColor(sentiment: string | null): string {
  switch (sentiment) {
    case "positive": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "negative": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "neutral": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    default: return "bg-muted text-muted-foreground";
  }
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = React.useState<CustomerDetail | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/customers/${id}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [id]);

  // Hooks must be called before any early returns (Rules of Hooks)
  const memory = data?.memory ?? [];

  const memoryByCategory = React.useMemo(() => {
    const grouped: Record<string, typeof memory> = {};
    for (const m of memory) {
      if (!grouped[m.category]) grouped[m.category] = [];
      grouped[m.category].push(m);
    }
    return grouped;
  }, [memory]);

  const categoryLabels: Record<string, string> = {
    budget: "💰 Budget",
    timeline: "📅 Timeline",
    objection: "⚠️ Objections",
    competitor: "🏢 Competitors",
    decision_maker: "👔 Decision Makers",
    requirements: "📋 Requirements",
    commitment: "🤝 Commitments",
    general: "📝 General",
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Customer not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const { customer, contacts, emails, timeline } = data;

  const timelineIcons: Record<string, string> = {
    email_received: "📥",
    email_sent: "📤",
    meeting_scheduled: "📅",
    deal_progressed: "📈",
    deal_stalled: "⚠️",
    objection_raised: "🚩",
    commitment_made: "🤝",
    ai_action: "🤖",
    note: "📝",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back + Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {customer.domain && (
                <span className="text-sm text-muted-foreground">{customer.domain}</span>
              )}
              {customer.aiIndustry && (
                <Badge variant="outline" className="text-xs">{customer.aiIndustry}</Badge>
              )}
              {customer.aiEngagementScore && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {customer.aiEngagementScore} engagement
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Contacts Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Contacts ({contacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contacts found</p>
              ) : (
                contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {(contact.name?.[0] ?? contact.email[0]).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {contact.name || contact.email}
                      </p>
                      {contact.name && (
                        <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {contact.title && (
                          <span className="text-xs text-muted-foreground">{contact.title}</span>
                        )}
                        {contact.aiRole && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {contact.aiRole}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* AI Memory Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Memory ({memory.length} facts)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {memory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No facts extracted yet. Memory builds automatically as more emails are processed.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(memoryByCategory).map(([category, facts]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        {categoryLabels[category] || category}
                      </h4>
                      <div className="space-y-2">
                        {facts.map((fact) => (
                          <div
                            key={fact.id}
                            className="rounded-lg border bg-muted/20 p-3"
                          >
                            <p className="text-sm">{fact.fact}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-1">
                                <div className="h-1.5 w-16 rounded-full bg-muted">
                                  <div
                                    className="h-1.5 rounded-full bg-violet-500"
                                    style={{ width: `${fact.confidence}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                  {fact.confidence}%
                                </span>
                              </div>
                              {fact.evidence && (
                                <span className="text-[10px] text-muted-foreground italic truncate max-w-50">
                                  &ldquo;{fact.evidence}&rdquo;
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline ({timeline.length} events)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No timeline events yet. Events generate automatically as emails are processed.
                </p>
              ) : (
                <div className="relative pl-6 border-l-2 border-muted space-y-4">
                  {timeline.map((event) => (
                    <div key={event.id} className="relative">
                      <span className="absolute -left-[25px] text-sm">
                        {timelineIcons[event.type] || "•"}
                      </span>
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-sm font-medium">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {event.description}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {new Date(event.occurredAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emails Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Recent Emails ({emails.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {emails.length === 0 ? (
                <p className="text-sm text-muted-foreground">No emails found</p>
              ) : (
                emails.map((email) => (
                  <Link
                    key={email.id}
                    href={`/dashboard/emails`}
                    className="block p-3 rounded-lg border hover:border-primary/30 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {email.subject || "(no subject)"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {email.direction === "inbound" ? "From:" : "To:"}{" "}
                          {email.fromName || email.fromAddress}
                          {" · "}
                          {new Date(email.receivedAt).toLocaleDateString()}
                        </p>
                        {email.snippet && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {email.snippet}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {email.aiSentiment && (
                          <Badge className={`text-[10px] px-1.5 py-0 ${sentimentColor(email.aiSentiment)}`}>
                            {email.aiSentiment}
                          </Badge>
                        )}
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-40" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
