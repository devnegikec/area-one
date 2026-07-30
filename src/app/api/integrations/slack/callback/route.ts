import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { handleSlackCallback } from "@/lib/integrations/slack/service";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
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
    const redirectUrl = new URL("/dashboard", req.url);
    redirectUrl.searchParams.set("slack_connected", "true");
    redirectUrl.searchParams.set("messages_synced", String(result.messagesSynced));
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Slack callback error:", error);
    const redirectUrl = new URL("/dashboard/settings", req.url);
    redirectUrl.searchParams.set("error", "slack_connection_failed");
    return NextResponse.redirect(redirectUrl);
  }
}
