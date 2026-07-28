import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserWorkspaces, createWorkspace as createWs } from "@/lib/workspace/service";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaces = await getUserWorkspaces();
  return NextResponse.json(workspaces);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
  }

  const workspace = await createWs(name);
  if (!workspace) {
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }

  return NextResponse.json(workspace, { status: 201 });
}
