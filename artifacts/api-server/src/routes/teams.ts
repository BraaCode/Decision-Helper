import { Router, type IRouter } from "express";
import { randomBytes } from "node:crypto";
import { eq, and, desc, inArray, isNull } from "drizzle-orm";
import { db, teamsTable, teamMembersTable, decisionsTable, auditLogTable } from "@workspace/db";
import { CreateTeamBody, JoinTeamBody, GetTeamParams, GetTeamAuditParams } from "@workspace/api-zod";
import { requireAuth, isTeamMember, logAudit } from "./helpers";

const router: IRouter = Router();

function teamShape(t: typeof teamsTable.$inferSelect, memberCount: number) {
  return { id: t.id, name: t.name, ownerId: t.ownerId, inviteCode: t.inviteCode, createdAt: t.createdAt, memberCount };
}

// GET /teams — teams I'm a member of
router.get("/teams", requireAuth, async (req: any, res): Promise<void> => {
  const memberships = await db.select().from(teamMembersTable).where(eq(teamMembersTable.userId, req.userId));
  if (memberships.length === 0) {
    res.json([]);
    return;
  }
  const teamIds = memberships.map((m) => m.teamId);
  const teams = await db.select().from(teamsTable).where(inArray(teamsTable.id, teamIds));
  const allMembers = await db.select().from(teamMembersTable).where(inArray(teamMembersTable.teamId, teamIds));
  res.json(teams.map((t) => teamShape(t, allMembers.filter((m) => m.teamId === t.id).length)));
});

// POST /teams
router.post("/teams", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const inviteCode = randomBytes(6).toString("base64url");
  const [team] = await db
    .insert(teamsTable)
    .values({ name: parsed.data.name, ownerId: req.userId, inviteCode })
    .returning();
  await db.insert(teamMembersTable).values({
    teamId: team.id,
    userId: req.userId,
    name: parsed.data.memberName || "",
    role: "owner",
  });
  await logAudit({
    teamId: team.id,
    userId: req.userId,
    actorName: parsed.data.memberName,
    action: "team_created",
    detail: `أنشأ فريق «${team.name}»`,
  });
  res.status(201).json(teamShape(team, 1));
});

// POST /teams/join
router.post("/teams/join", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = JoinTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.inviteCode, parsed.data.code.trim()));
  if (!team) {
    res.status(404).json({ error: "رمز الدعوة غير صالح" });
    return;
  }
  const already = await isTeamMember(team.id, req.userId);
  if (!already) {
    await db.insert(teamMembersTable).values({
      teamId: team.id,
      userId: req.userId,
      name: parsed.data.memberName || "",
      role: "member",
    });
    await logAudit({
      teamId: team.id,
      userId: req.userId,
      actorName: parsed.data.memberName,
      action: "member_joined",
      detail: `انضم إلى الفريق`,
    });
  }
  const members = await db.select().from(teamMembersTable).where(eq(teamMembersTable.teamId, team.id));
  res.json(teamShape(team, members.length));
});

// GET /teams/:id
router.get("/teams/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!(await isTeamMember(params.data.id, req.userId))) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, params.data.id));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  const members = await db.select().from(teamMembersTable).where(eq(teamMembersTable.teamId, team.id)).orderBy(teamMembersTable.joinedAt);
  const decisions = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.teamId, team.id), isNull(decisionsTable.deletedAt)))
    .orderBy(desc(decisionsTable.createdAt));
  res.json({
    id: team.id,
    name: team.name,
    ownerId: team.ownerId,
    inviteCode: team.inviteCode,
    createdAt: team.createdAt,
    members,
    decisions: decisions.map((d) => ({
      id: d.id,
      question: d.question,
      createdAt: d.createdAt,
      teamId: d.teamId,
      status: d.status,
      decidedOptionId: d.decidedOptionId,
      decidedAt: d.decidedAt,
      createdByName: d.createdByName,
    })),
  });
});

// GET /teams/:id/audit
router.get("/teams/:id/audit", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetTeamAuditParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!(await isTeamMember(params.data.id, req.userId))) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  const entries = await db
    .select()
    .from(auditLogTable)
    .where(eq(auditLogTable.teamId, params.data.id))
    .orderBy(desc(auditLogTable.createdAt))
    .limit(200);
  res.json(entries);
});

export default router;
