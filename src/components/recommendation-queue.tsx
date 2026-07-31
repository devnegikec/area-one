"use client";

import * as React from "react";
import { Sparkles, Check, X, Clock, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Rec {
  id: string;
  type: string;
  title: string;
  reasoning: string | null;
  urgency: string;
  confidence: number;
  status: string;
  customerId: string;
  customerName: string | null;
  createdAt: string;
}

const urgencyColors: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-muted text-muted-foreground",
};

const typeLabels: Record<string, string> = {
  send_email: "Send Email",
  schedule_meeting: "Schedule Meeting",
  share_pricing: "Share Pricing",
  follow_up: "Follow Up",
  escalate: "Escalate",
  mark_lost: "Mark Lost",
  ask_feedback: "Ask Feedback",
  send_proposal: "Send Proposal",
};

export function RecommendationQueue() {
  const [recs, setRecs] = React.useState<Rec[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchRecs() {
      try {
        const res = await fetch("/api/recommendations");
        if (res.ok) {
          const data = await res.json();
          setRecs(data.recommendations);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchRecs();
  }, []);

  const handleAction = async (id: string, status: string) => {
    await fetch("/api/recommendations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setRecs((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (recs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">No pending recommendations</p>
          <p className="text-xs text-muted-foreground mt-1">
            Recommendations appear as AI analyzes your customer communications.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          AI Recommendations ({recs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recs.slice(0, 5).map((rec) => (
          <div
            key={rec.id}
            className="flex items-start gap-3 p-3 rounded-lg border hover:border-primary/30 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`text-[10px] px-1.5 py-0 ${urgencyColors[rec.urgency]}`}>
                  {rec.urgency}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {typeLabels[rec.type] || rec.type}
                </Badge>
                {rec.customerName && (
                  <span className="text-[10px] text-muted-foreground">
                    {rec.customerName}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium">{rec.title}</p>
              {rec.reasoning && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {rec.reasoning}
                </p>
              )}
              <div className="flex items-center gap-1 mt-1.5">
                <div className="h-1 w-12 rounded-full bg-muted">
                  <div
                    className="h-1 rounded-full bg-violet-500"
                    style={{ width: `${rec.confidence}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{rec.confidence}%</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-emerald-600"
                onClick={() => handleAction(rec.id, "approved")}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => handleAction(rec.id, "rejected")}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => handleAction(rec.id, "snoozed")}
              >
                <Clock className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {recs.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{recs.length - 5} more recommendations
          </p>
        )}
      </CardContent>
    </Card>
  );
}
