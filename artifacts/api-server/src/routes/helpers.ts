import { eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, decisionsTable, teamMembersTable, auditLogTable } from "@workspace/db";

export function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

/** A user can access a decision if they created it OR belong to its team. */
export async function findAccessibleDecision(decisionId: number, userId: string) {
  const [decision] = await db.select().from(decisionsTable).where(eq(decisionsTable.id, decisionId));
  if (!decision) return null;
  if (decision.userId === userId) return decision;
  if (decision.teamId) {
    const [membership] = await db
      .select()
      .from(teamMembersTable)
      .where(and(eq(teamMembersTable.teamId, decision.teamId), eq(teamMembersTable.userId, userId)));
    if (membership) return decision;
  }
  return null;
}

export async function isTeamMember(teamId: number, userId: string) {
  const [membership] = await db
    .select()
    .from(teamMembersTable)
    .where(and(eq(teamMembersTable.teamId, teamId), eq(teamMembersTable.userId, userId)));
  return !!membership;
}

export async function logAudit(entry: {
  teamId?: number | null;
  decisionId?: number | null;
  userId: string;
  actorName?: string;
  action: string;
  detail?: string;
}) {
  try {
    await db.insert(auditLogTable).values({
      teamId: entry.teamId ?? null,
      decisionId: entry.decisionId ?? null,
      userId: entry.userId,
      actorName: entry.actorName ?? "",
      action: entry.action,
      detail: entry.detail ?? "",
    });
  } catch (err) {
    // Audit failures must never break the main operation, but should be visible in logs
    console.error("audit log failed", err);
  }
}
