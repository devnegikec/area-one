import { db } from "@/db";
import { workspaces } from "@/db/schema/workspaces";
import { eq } from "drizzle-orm";

/**
 * Guardrail levels for autonomous actions:
 * 0 = Fully autonomous (categorize, extract entities)
 * 1 = Auto-draft, user approves (send email, share pricing)
 * 2 = Suggest, user initiates (schedule meeting, send proposal)
 * 3 = Never autonomous (change pricing, sign contracts)
 */
export type GuardrailLevel = 0 | 1 | 2 | 3;

const DEFAULT_RULES: AutonomyRules = {
  entityExtraction: 0, // Always auto
  memoryExtraction: 0,
  timelineGeneration: 0,
  recommendationGeneration: 0,
  draftGeneration: 1,
  emailSending: 2, // Never auto-send without approval
  meetingScheduling: 2,
  proposalSending: 3,
  pricingChanges: 3,
  followUpSending: 1, // Can auto-draft, still needs approval
};

export interface AutonomyRules {
  entityExtraction: GuardrailLevel;
  memoryExtraction: GuardrailLevel;
  timelineGeneration: GuardrailLevel;
  recommendationGeneration: GuardrailLevel;
  draftGeneration: GuardrailLevel;
  emailSending: GuardrailLevel;
  meetingScheduling: GuardrailLevel;
  proposalSending: GuardrailLevel;
  pricingChanges: GuardrailLevel;
  followUpSending: GuardrailLevel;
}

/**
 * Get autonomy rules for a workspace. Falls back to defaults.
 */
export async function getAutonomyRules(workspaceId: string): Promise<AutonomyRules> {
  const [ws] = await db
    .select({ settings: workspaces.settings })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  const saved = (ws?.settings as Record<string, unknown>)?.autonomyRules as Partial<AutonomyRules> | undefined;
  return { ...DEFAULT_RULES, ...saved };
}

/**
 * Update autonomy rules for a workspace.
 */
export async function updateAutonomyRules(
  workspaceId: string,
  rules: Partial<AutonomyRules>
): Promise<void> {
  const current = await getAutonomyRules(workspaceId);
  const merged = { ...current, ...rules };

  const [ws] = await db
    .select({ settings: workspaces.settings })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  const existingSettings = (ws?.settings as Record<string, unknown>) || {};
  await db
    .update(workspaces)
    .set({
      settings: { ...existingSettings, autonomyRules: merged },
    })
    .where(eq(workspaces.id, workspaceId));
}

/**
 * Check if an action can be auto-executed at a given guardrail level.
 * Level 0 = fully auto, Level 3 = never auto.
 */
export function canAutoExecute(action: keyof AutonomyRules, rules: AutonomyRules): boolean {
  return rules[action] === 0;
}

export function needsApproval(action: keyof AutonomyRules, rules: AutonomyRules): boolean {
  return rules[action] >= 1;
}
