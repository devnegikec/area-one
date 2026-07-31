import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { emails } from "@/db/schema/emails";
import { workspaceMembers } from "@/db/schema/workspaces";
import { eq, sql, desc } from "drizzle-orm";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mail, Users, Clock } from "lucide-react";
import { SyncButton } from "../emails/sync-button";

export default async function ConversationsPage() {
  const { userId } = await auth();

  let threads: Array<{
    threadId: string;
    subject: string;
    participants: string[];
    lastMessageAt: string;
    messageCount: number;
    latestSnippet: string | null;
    latestSentiment: string | null;
    channel: string;
  }> = [];

  if (userId) {
    const [membership] = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId))
      .limit(1);

    if (membership) {
      const raw = await db
        .select({
          threadId: emails.threadId,
          subject: sql<string>`COALESCE(MAX(${emails.subject}), '(no subject)')`.as("subject"),
          participants: sql<string[]>`ARRAY_AGG(DISTINCT ${emails.fromAddress})`.as("participants"),
          lastMessageAt: sql<string>`MAX(${emails.receivedAt})`.as("lastMessageAt"),
          messageCount: sql<number>`COUNT(*)::int`.as("messageCount"),
          latestSnippet: sql<string>`(ARRAY_AGG(${emails.snippet} ORDER BY ${emails.receivedAt} DESC))[1]`.as("latestSnippet"),
          latestSentiment: sql<string>`(ARRAY_AGG(${emails.aiSentiment} ORDER BY ${emails.receivedAt} DESC))[1]`.as("latestSentiment"),
        })
        .from(emails)
        .where(eq(emails.workspaceId, membership.workspaceId))
        .groupBy(emails.threadId)
        .orderBy(desc(sql`MAX(${emails.receivedAt})`))
        .limit(50);

      threads = raw.map((r) => ({
        threadId: r.threadId ?? r.threadId,
        subject: r.subject,
        participants: r.participants || [],
        lastMessageAt: r.lastMessageAt,
        messageCount: r.messageCount,
        latestSnippet: r.latestSnippet,
        latestSentiment: r.latestSentiment,
        channel: "email",
      }));
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Conversations</h1>
            <p className="text-muted-foreground mt-1">All your customer conversations in one place</p>
          </div>
          <SyncButton />
        </div>

        {!userId ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            Sign in to view your conversations.
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No conversations yet. Sync your Gmail to see email threads here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <ConversationCard key={thread.threadId} thread={thread} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ConversationCard({
  thread,
}: {
  thread: {
    threadId: string;
    subject: string;
    participants: string[];
    lastMessageAt: string;
    messageCount: number;
    latestSnippet: string | null;
    latestSentiment: string | null;
    channel: string;
  };
}) {
  const lastDate = new Date(thread.lastMessageAt);
  const timeAgo = formatTimeAgo(lastDate);

  const initials = thread.participants[0]
    ?.split("@")[0]
    .split(".")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <Card className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="shrink-0 h-10 w-10 rounded-full bg-linear-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white text-sm font-semibold">
            {initials}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm truncate">{thread.subject}</span>
              {thread.latestSentiment && (
                <Badge
                  variant={
                    thread.latestSentiment === "positive"
                      ? "success"
                      : thread.latestSentiment === "negative"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-[10px] px-1.5 py-0"
                >
                  {thread.latestSentiment}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {thread.participants.slice(0, 3).join(", ")}
                {thread.participants.length > 3 && ` +${thread.participants.length - 3} more`}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {thread.messageCount} {thread.messageCount === 1 ? "message" : "messages"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </span>
            </div>

            {thread.latestSnippet && (
              <p className="text-xs text-muted-foreground line-clamp-2">{thread.latestSnippet}</p>
            )}
          </div>

          {/* Channel badge */}
          <div className="shrink-0">
            <Badge variant="outline" className="text-[10px]">
              {thread.channel}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
