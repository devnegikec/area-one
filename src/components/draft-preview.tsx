"use client";

import * as React from "react";
import { Sparkles, Send, RefreshCw, Edit3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface DraftData {
  id: string;
  subject: string;
  body: string;
  type: string;
  status: string;
}

interface DraftPreviewProps {
  recommendationId?: string;
  customerId?: string;
  type?: string; // follow_up, pricing, meeting_request, etc.
  onClose?: () => void;
}

export function DraftPreview({ recommendationId, customerId, type = "follow_up", onClose }: DraftPreviewProps) {
  const [draft, setDraft] = React.useState<DraftData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editSubject, setEditSubject] = React.useState("");
  const [editBody, setEditBody] = React.useState("");
  const [generated, setGenerated] = React.useState(false);
  const [toAddress, setToAddress] = React.useState("");
  const [sent, setSent] = React.useState(false);

  const generateDraft = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId, customerId, type }),
      });
      if (res.ok) {
        const data = await res.json();
        setDraft(data.draft);
        setEditSubject(data.draft.subject);
        setEditBody(data.draft.body);
        setGenerated(true);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    const originalLength = draft.body.length;
    const newLength = editBody.length;
    const distance = Math.round((Math.abs(newLength - originalLength) / Math.max(originalLength, 1)) * 100);

    await fetch("/api/drafts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: draft.id, subject: editSubject, body: editBody, editDistance: Math.min(distance, 100) }),
    });
    setDraft({ ...draft, subject: editSubject, body: editBody });
    setEditing(false);
  };

  const handleSend = async () => {
    if (!draft || !toAddress) return;
    setSending(true);
    try {
      const res = await fetch("/api/drafts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: draft.id, toAddress }),
      });
      if (res.ok) setSent(true);
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  const handleDiscard = () => {
    setDraft(null);
    setGenerated(false);
    onClose?.();
  };

  if (!generated) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles className="h-8 w-8 text-violet-400 mb-3" />
          <p className="text-sm font-medium">Generate an AI draft</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            DeepSeek will write a personalized email using customer context
          </p>
          <Button onClick={generateDraft} disabled={loading} size="sm" className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Generating..." : "Generate Draft"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Send className="h-8 w-8 text-emerald-500 mb-3" />
          <p className="text-sm font-medium">Email sent!</p>
          <p className="text-xs text-muted-foreground mt-1">Sent to {toAddress}</p>
        </CardContent>
      </Card>
    );
  }

  if (!draft) return null;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {editing ? (
          <>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Subject</label>
              <Input
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Body</label>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="mt-1 w-full min-h-30 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Subject</p>
              <p className="text-sm font-medium">{draft.subject}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Body</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{draft.body}</p>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">To</label>
              <Input
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="recipient@company.com"
                className="mt-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" className="gap-1" onClick={handleSend} disabled={sending || !toAddress}>
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {sending ? "Sending..." : "Send"}
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => { setEditing(true); }}>
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={generateDraft} disabled={loading}>
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </Button>
              <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground" onClick={handleDiscard}>
                Discard
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
