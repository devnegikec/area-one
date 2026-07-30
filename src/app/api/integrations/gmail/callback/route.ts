import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { handleGmailCallback } from "@/lib/integrations/gmail/service";

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
  const state = searchParams.get("state"); // base64-encoded JSON with workspaceId

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  // Decode workspace context from the state parameter
  let workspaceId = "";
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
      workspaceId = decoded.workspaceId || "";
    } catch {
      // If state decoding fails, fall through
    }
  }

  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspace context" }, { status: 400 });
  }

  try {
    const result = await handleGmailCallback(workspaceId, code);
    // Redirect to dashboard with success
    const baseUrl = getBaseUrl(req);
    const redirectUrl = new URL("/dashboard", baseUrl);
    redirectUrl.searchParams.set("gmail_connected", "true");
    redirectUrl.searchParams.set("emails_synced", String(result.emailsSynced));
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Gmail callback error:", error);
    const baseUrl = getBaseUrl(req);
    const redirectUrl = new URL("/dashboard/settings", baseUrl);
    redirectUrl.searchParams.set("error", "gmail_connection_failed");
    return NextResponse.redirect(redirectUrl);
  }
}
