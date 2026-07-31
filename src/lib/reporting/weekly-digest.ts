import { db } from "@/db";
import { emails, recommendations, timelineEvents, customers } from "@/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const deepseek = createOpenAICompatible({
  name: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export interface WeeklyDigest {
  summary: string;
  stats: {
    totalEmails: number;
    newCustomers: number;
    pendingRecommendations: number;
    dealsProgressed: number;
    dealsStalled: number;
    overdueFollowUps: number;
  };
  highlights: string[];
}

export async function generateWeeklyDigest(workspaceId: string): Promise<WeeklyDigest> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Gather stats
  const [emailCount] = await db
    .select({ count: db.$count(emails) })
    .from(emails)
    .where(and(eq(emails.workspaceId, workspaceId), gte(emails.receivedAt, weekAgo)));

  const [newCustomersCount] = await db
    .select({ count: db.$count(customers) })
    .from(customers)
    .where(and(eq(customers.workspaceId, workspaceId), gte(customers.createdAt, weekAgo)));

  const [pendingRecs] = await db
    .select({ count: db.$count(recommendations) })
    .from(recommendations)
    .where(and(eq(recommendations.workspaceId, workspaceId), eq(recommendations.status, "pending")));

  const recentEvents = await db
    .select({ type: timelineEvents.type, title: timelineEvents.title, occurredAt: timelineEvents.occurredAt })
    .from(timelineEvents)
    .where(and(eq(timelineEvents.workspaceId, workspaceId), gte(timelineEvents.occurredAt, weekAgo)))
    .orderBy(desc(timelineEvents.occurredAt))
    .limit(30);

  const dealsProgressed = recentEvents.filter((e) => e.type === "deal_progressed" || e.type === "commitment_made").length;
  const dealsStalled = recentEvents.filter((e) => e.type === "deal_stalled" || e.type === "objection_raised").length;
  const overdueFollowUps = pendingRecs.count;

  // AI-generated summary
  const context = [
    `Period: Last 7 days`,
    `Emails: ${emailCount.count}`,
    `New Customers: ${newCustomersCount.count}`,
    `Pending Actions: ${pendingRecs.count}`,
    `Deals Progressed: ${dealsProgressed}`,
    `Deals Stalled: ${dealsStalled}`,
    "",
    "Recent Activity:",
    ...recentEvents.slice(0, 15).map((e) => `  ${new Date(e.occurredAt).toLocaleDateString()} - ${e.title}`),
  ].join("\n");

  const { text } = await generateText({
    model: deepseek("deepseek-chat"),
    system: "You are an executive assistant. Write a concise weekly summary (3-5 sentences) highlighting key activity, wins, risks, and what needs attention. Be specific and actionable.",
    prompt: context,
    temperature: 0.5,
  });

  return {
    summary: text.trim(),
    stats: {
      totalEmails: emailCount.count,
      newCustomers: newCustomersCount.count,
      pendingRecommendations: pendingRecs.count,
      dealsProgressed,
      dealsStalled,
      overdueFollowUps,
    },
    highlights: recentEvents.slice(0, 5).map((e) => e.title),
  };
}
