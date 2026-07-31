import { db } from "@/db";
import { auditLogs } from "@/db/schema/audit-logs";

export interface AuditEntry {
  workspaceId: string;
  userId: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an auditable action. Fire-and-forget — never throws.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values(entry);
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}
