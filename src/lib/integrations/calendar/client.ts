import { db } from "@/db";
import { integrations } from "@/db/schema/integrations";
import { eq, and } from "drizzle-orm";
import { decryptToken } from "@/lib/security/token-vault";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendees?: string[];
}

/**
 * Fetch upcoming calendar events from Google Calendar API.
 */
export async function fetchUpcomingEvents(workspaceId: string, maxResults = 10): Promise<CalendarEvent[]> {
  const [integration] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.workspaceId, workspaceId),
        eq(integrations.provider, "google_calendar"),
        eq(integrations.status, "active")
      )
    )
    .limit(1);

  if (!integration?.credentials) return [];

  const decrypted = decryptToken(
    integration.credentials as { encrypted: string; iv: string; tag: string }
  );
  const tokens = JSON.parse(decrypted);

  const now = new Date().toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    new URLSearchParams({
      timeMin: now,
      maxResults: String(maxResults),
      singleEvents: "true",
      orderBy: "startTime",
    }),
    {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  return (data.items || []).map((item: Record<string, unknown>) => ({
    id: item.id as string,
    summary: (item.summary as string) || "Untitled",
    description: item.description as string | undefined,
    start: (item.start as Record<string, string>)?.dateTime || (item.start as Record<string, string>)?.date || "",
    end: (item.end as Record<string, string>)?.dateTime || (item.end as Record<string, string>)?.date || "",
    attendees: (item.attendees as Array<{ email: string }>)?.map((a) => a.email) || [],
  }));
}
