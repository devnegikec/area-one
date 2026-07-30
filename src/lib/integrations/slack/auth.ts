import { env } from "@/lib/shared/env";
import { createHash, randomBytes } from "crypto";

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || "";
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || "";
const REDIRECT_URI = `${env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`;

/**
 * Generate a PKCE code verifier (random URL-safe string, 43-128 chars).
 */
function generateCodeVerifier(): string {
  return randomBytes(48)
    .toString("base64url")
    .slice(0, 64);
}

/**
 * Create a PKCE code challenge from a verifier using SHA256.
 */
function createCodeChallenge(verifier: string): string {
  return createHash("sha256")
    .update(verifier)
    .digest("base64url");
}

/**
 * Generate the Slack OAuth URL with PKCE.
 * Returns the URL and the code_verifier (needed later for token exchange).
 */
export function getSlackAuthUrl(state: string): { url: string; codeVerifier: string } {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);

  const scope = [
    "channels:history",
    "channels:read",
    "chat:write",
    "users:read",
    "team:read",
  ].join(",");

  const query = [
    `client_id=${encodeURIComponent(SLACK_CLIENT_ID)}`,
    `scope=${encodeURIComponent(scope)}`,
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}`,
    `state=${encodeURIComponent(state)}`,
    `code_challenge=${encodeURIComponent(codeChallenge)}`,
    `code_challenge_method=S256`,
  ].join("&");

  return {
    url: `https://slack.com/oauth/v2/authorize?${query}`,
    codeVerifier,
  };
}

/**
 * Exchange the OAuth authorization code + PKCE code_verifier for an access token.
 */
export async function exchangeSlackCode(
  code: string,
  codeVerifier: string
): Promise<{
  accessToken: string;
  teamId: string;
  teamName: string;
  botUserId: string;
}> {
  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Slack OAuth error: ${data.error}`);
  }

  return {
    accessToken: data.access_token,
    teamId: data.team?.id || "",
    teamName: data.team?.name || "",
    botUserId: data.bot_user_id || "",
  };
}
