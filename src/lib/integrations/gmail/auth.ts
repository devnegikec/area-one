import { google } from "googleapis";
import { env } from "@/lib/shared/env";

const REDIRECT_URI = `${env.NEXT_PUBLIC_APP_URL}/api/integrations/gmail/callback`;

/**
 * Generate the Google OAuth URL for Gmail connection.
 */
export function getAuthUrl(): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
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

  // Auto-refresh on expiry
  oauth2Client.on("tokens", () => {
    // In production, update stored tokens in DB
    console.log("Gmail token refreshed");
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}
