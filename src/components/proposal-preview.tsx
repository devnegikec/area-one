"use client";

import * as React from "react";
import { FileText, Loader2, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Proposal {
  title: string;
  executiveSummary: string;
  sections: Array<{ heading: string; content: string }>;
  pricing: string;
  nextSteps: string;
}

interface ProposalPreviewProps {
  customerId: string;
  customerName?: string;
}

export function ProposalPreview({ customerId, customerName }: ProposalPreviewProps) {
  const [proposal, setProposal] = React.useState<Proposal | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [generated, setGenerated] = React.useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });
      if (res.ok) {
        setProposal(await res.json());
        setGenerated(true);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  if (!generated) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-8 w-8 text-violet-400 mb-3" />
          <p className="text-sm font-medium">Generate a proposal</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            AI will write a personalized proposal using {customerName || "customer"} context
          </p>
          <Button onClick={handleGenerate} disabled={loading} size="sm" className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Generating..." : "Generate Proposal"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!proposal) return null;

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{proposal.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{proposal.executiveSummary}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>

        {proposal.sections.map((section, i) => (
          <div key={i}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {section.heading}
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.content}</p>
          </div>
        ))}

        {proposal.pricing && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              💰 Pricing
            </h3>
            <p className="text-sm whitespace-pre-wrap">{proposal.pricing}</p>
          </div>
        )}

        {proposal.nextSteps && (
          <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
              ✅ Next Steps
            </h3>
            <p className="text-sm whitespace-pre-wrap">{proposal.nextSteps}</p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={handleGenerate} disabled={loading}>
            <RefreshCw className="h-3.5 w-3.5" /> Regenerate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
