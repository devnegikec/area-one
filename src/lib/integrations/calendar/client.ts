import { db } from "@/db";
import { integrations } from "@/db/schema/integrations";
import { eq, and } from "drizzle-orm";
import { decryptToken, encryptToken } from "@/lib/security/token-vault";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendees?: string[];
}

/**
 * Refresh the Google Calendar access token using the refresh token.
 */
async function refreshCalendarToken(
  refreshToken: string
): Promise<{ accessToken: string; expiryDate: number } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    console.error("Calendar token refresh failed:", await res.text().catch(() => ""));
    return null;
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiryDate: Date.now() + (data.expires_in || 3600) * 1000,
  };
}

/**
 * Get a valid access token, refreshing if needed.
 */
async function getValidTokens(integration: typeof integrations.$inferSelect): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiryDate: number | null;
} | null> {
  if (!integration.credentials) return null;

  const decrypted = decryptToken(
    integration.credentials as { encrypted: string; iv: string; tag: string }
  );
  const tokens = JSON.parse(decrypted);

  // If token is still valid (with 5 min buffer), use it
  if (tokens.expiryDate && Date.now() < tokens.expiryDate - 5 * 60 * 1000) {
    return tokens;
  }

  // Token expired — refresh it
  if (!tokens.refreshToken) return null;

  const refreshed = await refreshCalendarToken(tokens.refreshToken);
  if (!refreshed) return null;

  // Persist updated tokens
  const updated = {
    ...tokens,
    accessToken: refreshed.accessToken,
    expiryDate: refreshed.expiryDate,
    updatedAt: new Date().toISOString(),
  };

  const encrypted = encryptToken(JSON.stringify(updated));
  await db
    .update(integrations)
    .set({
      credentials: encrypted as unknown as typeof integrations.$inferInsert.credentials,
      updatedAt: new Date(),
    })
    .where(eq(integrations.id, integration.id));

  return updated;
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

  if (!integration) return [];

  const tokens = await getValidTokens(integration);
  if (!tokens) return [];

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
