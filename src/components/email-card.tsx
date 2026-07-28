"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, Star, Paperclip } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface EmailCardProps {
  id: string;
  from: string;
  fromName?: string;
  subject: string;
  preview: string;
  receivedAt: string;
  isUnread?: boolean;
  isStarred?: boolean;
  hasAttachments?: boolean;
  sentiment?: "positive" | "neutral" | "negative";
  customerName?: string;
  customerId?: string;
  onClick?: () => void;
}

export function EmailCard({
  from,
  fromName,
  subject,
  preview,
  receivedAt,
  isUnread,
  isStarred,
  hasAttachments,
  sentiment,
  customerName,
  customerId,
  onClick,
}: EmailCardProps) {
  const initials = (fromName || from)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const timeAgo = formatTimeAgo(receivedAt);

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30",
        isUnread && "border-l-2 border-l-primary bg-primary/[0.02]"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Sender Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 text-white text-sm font-semibold">
          {initials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-sm font-semibold truncate", isUnread && "text-foreground")}>
              {fromName || from}
            </span>
            {sentiment && (
              <Badge
                variant={
                  sentiment === "positive" ? "success" : sentiment === "negative" ? "destructive" : "secondary"
                }
                className="text-[10px] px-1.5 py-0"
              >
                {sentiment}
              </Badge>
            )}
            {customerName && (
              <Link
                href={`/dashboard/customers/${customerId}`}
                className="text-xs text-primary hover:underline ml-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {customerName}
              </Link>
            )}
          </div>

          <h3 className={cn("text-sm mb-1 truncate", isUnread && "font-semibold")}>{subject}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{preview}</p>
        </div>

        {/* Meta */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1">
            {isStarred && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
            {hasAttachments && <Paperclip className="h-3 w-3 text-muted-foreground" />}
            {isUnread && <div className="h-2 w-2 rounded-full bg-primary" />}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
        </div>
      </div>
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
