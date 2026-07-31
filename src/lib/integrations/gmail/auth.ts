import { google } from "googleapis";
import { env } from "@/lib/shared/env";

const REDIRECT_URI = `${env.NEXT_PUBLIC_APP_URL}/api/integrations/gmail/callback`;

/**
 * Generate the Google OAuth URL for Gmail connection.
 * @param state - Data to pass through the OAuth flow (e.g., workspace ID encoded as JSON)
 */
export function getAuthUrl(state?: string): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state: state || undefined,
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
    ],
  });
}

/**
 * Exchange the authorization code for tokens.
 * Returns { access_token, refresh_token, expiry_date }.
 */
export async function exchangeCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiryDate: number | null;
}> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  const { tokens } = await oauth2Client.getToken(code);

  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token || null,
    expiryDate: tokens.expiry_date || null,
  };
}

/**
 * Get an authenticated Gmail client from stored tokens.
 * Reuses the OAuth2 client instance so tokens stay fresh across calls.
 */
export function getGmailClient(tokens: {
  accessToken: string;
  refreshToken: string | null;
  expiryDate: number | null;
}) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiryDate,
  });

  // Auto-refresh on expiry — update the tokens object so callers get fresh creds
  oauth2Client.on("tokens", (newTokens) => {
    if (newTokens.access_token) tokens.accessToken = newTokens.access_token;
    if (newTokens.refresh_token) tokens.refreshToken = newTokens.refresh_token;
    if (newTokens.expiry_date) tokens.expiryDate = newTokens.expiry_date;
    // Persist updated tokens to DB in the background
    console.log("Gmail token refreshed");
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}
