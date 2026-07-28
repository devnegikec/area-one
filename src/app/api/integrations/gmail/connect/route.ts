import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectGmail } from "@/lib/integrations/gmail/service";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");

  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspace_id" }, { status: 400 });
  }

  try {
    const authUrl = await connectGmail(workspaceId);
    return NextResponse.redirect(authUrl);
  } catch {
    return NextResponse.json({ error: "Failed to initiate Gmail connection" }, { status: 500 });
  }
}
