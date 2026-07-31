import { NextResponse } from "next/server";
import { db } from "@/db";
import { emails, timelineEvents } from "@/db/schema";
import { generateTimelineEvent } from "@/lib/timeline/event-generator";
import { eq } from "drizzle-orm";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "area-one-internal";

export async function POST(req: Request) {
  const secret = req.headers.get("x-internal-secret");
  if (secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let emailId: string;
  try {
    const body = await req.json();
    emailId = body.emailId;
  } catch {
    return NextResponse.json({ error: "Missing emailId" }, { status: 400 });
  }

  const [email] = await db.select().from(emails).where(eq(emails.id, emailId)).limit(1);
  if (!email) return NextResponse.json({ error: "Email not found" }, { status: 404 });
  if (!email.customerId) {
    return NextResponse.json(
      { error: "Email not linked to a customer yet" }, { status: 400 }
    );
  }

  try {
    const event = await generateTimelineEvent({
      subject: email.subject,
      snippet: email.snippet,
      bodyText: email.bodyText,
      direction: email.direction,
      fromName: email.fromName,
      fromAddress: email.fromAddress,
    });

    await db.insert(timelineEvents).values({
      workspaceId: email.workspaceId,
      customerId: email.customerId!,
      sourceEmailId: email.id,
      type: event.type,
      title: event.title,
      description: event.description,
      occurredAt: email.receivedAt,
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Timeline generation failed:", error);
    return NextResponse.json(
      { error: "Timeline generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
