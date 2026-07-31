import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateProposal } from "@/lib/drafting/proposal-generator";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const customerId = body.customerId as string;
  if (!customerId) return NextResponse.json({ error: "Missing customerId" }, { status: 400 });

  try {
    const proposal = await generateProposal(customerId, "");
    return NextResponse.json(proposal);
  } catch (error) {
    console.error("Proposal generation failed:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
