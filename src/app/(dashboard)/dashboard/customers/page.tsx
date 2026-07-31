"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, Users, Mail, ExternalLink, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Customer {
  id: string;
  name: string;
  domain: string | null;
  aiIndustry: string | null;
  aiEngagementScore: string | null;
  emailCount: number;
  contactCount: number;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch("/api/customers");
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">
            AI-discovered companies from your email conversations
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : customers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium">No customers yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Customers appear here automatically when AI extracts company
                information from your emails. Connect Gmail to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <Link key={customer.id} href={`/dashboard/customers/${customer.id}`}>
                <Card className="group h-full transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/20">
                          <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate group-hover:text-primary transition-colors">
                            {customer.name}
                          </p>
                          {customer.domain && (
                            <p className="text-xs text-muted-foreground truncate">
                              {customer.domain}
                            </p>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {customer.emailCount} emails
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {customer.contactCount} contacts
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      {customer.aiEngagementScore && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {customer.aiEngagementScore}
                        </Badge>
                      )}
                      {customer.aiIndustry && (
                        <Badge variant="outline" className="text-xs">
                          {customer.aiIndustry}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
