import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { emails } from "@/db/schema/emails";
import { workspaceMembers } from "@/db/schema/workspaces";
import { desc, eq } from "drizzle-orm";
import { DashboardLayout } from "@/components/dashboard-layout";
import { EmailCard } from "@/components/email-card";
import { Mail } from "lucide-react";

export default async function EmailsPage() {
  const { userId } = await auth();

  let emailList: typeof emails.$inferSelect[] = [];

  if (userId) {
    const [membership] = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId))
      .limit(1);

    if (membership) {
      emailList = await db
        .select()
        .from(emails)
        .where(eq(emails.workspaceId, membership.workspaceId))
        .orderBy(desc(emails.receivedAt))
        .limit(50);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emails</h1>
          <p className="text-muted-foreground mt-1">Browse and search your email conversations</p>
        </div>

        {!userId ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            Sign in to view your emails.
          </div>
        ) : emailList.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No emails yet. Click "Sync Gmail" from the Dashboard to pull in your emails.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {emailList.map((email) => (
              <EmailCard
                key={email.id}
                id={email.id}
                from={email.fromAddress}
                fromName={email.fromName ?? undefined}
                subject={email.subject ?? "(no subject)"}
                preview={email.snippet ?? ""}
                receivedAt={email.receivedAt.toISOString()}
                sentiment={email.aiSentiment as "positive" | "neutral" | "negative" | undefined}
                hasAttachments={!!email.attachments?.length}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
