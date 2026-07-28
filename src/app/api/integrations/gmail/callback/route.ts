import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { handleGmailCallback } from "@/lib/integrations/gmail/service";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // workspaceId encoded in state

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  // In production, decode workspaceId from state parameter
  // For now, get it from query or use default
  const workspaceId = state || "";

  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspace context" }, { status: 400 });
  }

  try {
    const result = await handleGmailCallback(workspaceId, code);
    // Redirect to dashboard with success
    const redirectUrl = new URL("/dashboard", req.url);
    redirectUrl.searchParams.set("gmail_connected", "true");
    redirectUrl.searchParams.set("emails_synced", String(result.emailsSynced));
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Gmail callback error:", error);
    const redirectUrl = new URL("/dashboard/settings", req.url);
    redirectUrl.searchParams.set("error", "gmail_connection_failed");
    return NextResponse.redirect(redirectUrl);
  }
}
