import { NextResponse } from "next/server";
import { getSlackAuthUrl } from "@/lib/integrations/slack/auth";
import { env } from "@/lib/shared/env";

export async function GET() {
  const state = Buffer.from(JSON.stringify({ workspaceId: "debug", ts: Date.now() })).toString("base64");
  const { url, codeVerifier } = getSlackAuthUrl(state);

  return NextResponse.json({
    nextPublicAppUrl: env.NEXT_PUBLIC_APP_URL,
    slackClientId: (process.env.SLACK_CLIENT_ID || "").slice(0, 10) + "...",
    redirectUri: `${env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`,
    generatedUrl: url,
    codeVerifierLength: codeVerifier.length,
    codeChallengeInUrl: url.includes("code_challenge="),
    pkceMethodInUrl: url.includes("code_challenge_method=S256"),
  });
}
