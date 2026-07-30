import { NextResponse } from "next/server";

/**
 * Slack event webhook receiver.
 * Handles incoming Slack events (new messages, etc.).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Slack URL verification challenge
    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge });
    }

    // Handle event callbacks
    if (body.type === "event_callback") {
      const event = body.event;

      // New message event
      if (event?.type === "message" && !event.subtype) {
        // In production: find workspace by team_id, fetch full message, store in DB
        console.log("Slack message event received:", event.ts);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Slack webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
