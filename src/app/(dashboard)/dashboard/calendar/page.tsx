import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { workspaceMembers } from "@/db/schema/workspaces";
import { eq } from "drizzle-orm";
import { fetchUpcomingEvents } from "@/lib/integrations/calendar/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendees?: string[];
}

export default async function CalendarPage() {
  const { userId } = await auth();

  let events: CalendarEvent[] = [];
  let hasConnection = false;

  if (userId) {
    const [membership] = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId))
      .limit(1);

    if (membership) {
      events = await fetchUpcomingEvents(membership.workspaceId, 20);
      hasConnection = true;
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">View and manage your scheduled meetings</p>
        </div>

        {!userId ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            Sign in to view your calendar.
          </div>
        ) : !hasConnection ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="mb-2">Connect your Google Calendar to see your events.</p>
            <a
              href="/dashboard/settings"
              className="text-sm text-primary hover:underline font-medium"
            >
              Go to Settings →
            </a>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No upcoming events. Enjoy your free time!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <CalendarEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function CalendarEventCard({ event }: { event: CalendarEvent }) {
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  const isAllDay = event.start.length <= 10;

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Date badge */}
          <div className="shrink-0 w-14 text-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase">
              {startDate.toLocaleDateString("en-US", { month: "short" })}
            </div>
            <div className="text-2xl font-bold text-primary">
              {startDate.getDate()}
            </div>
            <div className="text-xs text-muted-foreground">
              {startDate.toLocaleDateString("en-US", { weekday: "short" })}
            </div>
          </div>

          {/* Event details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-2">{event.summary}</h3>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {!isAllDay && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(startDate)} – {formatTime(endDate)}
                </span>
              )}
              {isAllDay && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  All day · {formatDate(startDate)}
                </span>
              )}
              {event.attendees && event.attendees.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {event.attendees.length} {event.attendees.length === 1 ? "attendee" : "attendees"}
                </span>
              )}
            </div>

            {event.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {event.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
