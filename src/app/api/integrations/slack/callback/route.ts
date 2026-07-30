import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { handleSlackCallback } from "@/lib/integrations/slack/service";

/**
 * Build the correct base URL using forwarded headers (for tunnels/proxies).
 * Falls back to NEXT_PUBLIC_APP_URL, then req.url.
 */
function getBaseUrl(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  // Fallback: use env var for tunnel scenarios where headers aren't forwarded
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return new URL(req.url).origin;
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", getBaseUrl(req)));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  let workspaceId = "";
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
      workspaceId = decoded.workspaceId || "";
    } catch {
      // fall through
    }
  }

  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspace context" }, { status: 400 });
  }

  try {
    const result = await handleSlackCallback(workspaceId, code);
    const baseUrl = getBaseUrl(req);
    const redirectUrl = new URL("/dashboard", baseUrl);
    redirectUrl.searchParams.set("slack_connected", "true");
    redirectUrl.searchParams.set("messages_synced", String(result.messagesSynced));
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Slack callback error:", error);
    const baseUrl = getBaseUrl(req);
    const redirectUrl = new URL("/dashboard/settings", baseUrl);
    redirectUrl.searchParams.set("error", "slack_connection_failed");
    return NextResponse.redirect(redirectUrl);
  }
}
