import { Router, type IRouter } from "express";
import { eq, and, desc, inArray, isNull, isNotNull } from "drizzle-orm";
import {
  db,
  decisionsTable,
  optionsTable,
  criteriaTable,
  ratingsTable,
  commentsTable,
  auditLogTable,
  teamMembersTable,
} from "@workspace/db";
import {
  CreateDecisionBody,
  UpdateDecisionBody,
  UpdateDecisionParams,
  GetDecisionParams,
  DeleteDecisionParams,
  DecideDecisionParams,
  DecideDecisionBody,
  AddOptionParams,
  AddOptionBody,
  UpdateOptionParams,
  UpdateOptionBody,
  DeleteOptionParams,
  AddCriterionParams,
  AddCriterionBody,
  UpdateCriterionParams,
  UpdateCriterionBody,
  DeleteCriterionParams,
  UpsertRatingParams,
  UpsertRatingBody,
  GetDecisionScoresParams,
  ListCommentsParams,
  AddCommentParams,
  AddCommentBody,
  GetDecisionAuditParams,
  RestoreDecisionParams,
  PermanentlyDeleteDecisionParams,
} from "@workspace/api-zod";
import { requireAuth, findAccessibleDecision, isTeamMember, logAudit } from "./helpers";

const router: IRouter = Router();

function decisionShape(d: typeof decisionsTable.$inferSelect) {
  return {
    id: d.id,
    question: d.question,
    createdAt: d.createdAt,
    teamId: d.teamId,
    status: d.status,
    decidedOptionId: d.decidedOptionId,
    decidedAt: d.decidedAt,
    createdByName: d.createdByName,
    deletedAt: d.deletedAt,
  };
}

// GET /decisions — personal + team decisions
router.get("/decisions", requireAuth, async (req: any, res): Promise<void> => {
  const memberships = await db.select().from(teamMembersTable).where(eq(teamMembersTable.userId, req.userId));
  const teamIds = memberships.map((m) => m.teamId);
  const own = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.userId, req.userId), isNull(decisionsTable.deletedAt)));
  let teamDecisions: (typeof decisionsTable.$inferSelect)[] = [];
  if (teamIds.length > 0) {
    teamDecisions = await db
      .select()
      .from(decisionsTable)
      .where(and(inArray(decisionsTable.teamId, teamIds), isNull(decisionsTable.deletedAt)));
  }
  const seen = new Set<number>();
  const all = [...own, ...teamDecisions].filter((d) => (seen.has(d.id) ? false : (seen.add(d.id), true)));
  all.sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
  res.json(all.map(decisionShape));
});

// POST /decisions
router.post("/decisions", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateDecisionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.teamId !== undefined && !(await isTeamMember(parsed.data.teamId, req.userId))) {
    res.status(403).json({ error: "لست عضواً في هذا الفريق" });
    return;
  }
  const [decision] = await db
    .insert(decisionsTable)
    .values({
      userId: req.userId,
      question: parsed.data.question,
      teamId: parsed.data.teamId ?? null,
      createdByName: parsed.data.createdByName ?? "",
    })
    .returning();
  await logAudit({
    teamId: decision.teamId,
    decisionId: decision.id,
    userId: req.userId,
    actorName: decision.createdByName,
    action: "decision_created",
    detail: `أنشأ قرار «${decision.question}»`,
  });
  res.status(201).json(decisionShape(decision));
});

// GET /decisions/trash — the user's recycle bin (must be registered before /decisions/:id)
router.get("/decisions/trash", requireAuth, async (req: any, res): Promise<void> => {
  const trashed = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.userId, req.userId), isNotNull(decisionsTable.deletedAt)))
    .orderBy(desc(decisionsTable.deletedAt));
  res.json(trashed.map(decisionShape));
});

// POST /decisions/:id/restore — creator only
router.post("/decisions/:id/restore", requireAuth, async (req: any, res): Promise<void> => {
  const params = RestoreDecisionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [restored] = await db
    .update(decisionsTable)
    .set({ deletedAt: null })
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId), isNotNull(decisionsTable.deletedAt)))
    .returning();
  if (!restored) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  await logAudit({
    teamId: restored.teamId,
    decisionId: restored.id,
    userId: req.userId,
    actorName: restored.createdByName,
    action: "decision_restored",
    detail: `استعاد قرار «${restored.question}» من سلة المحذوفات`,
  });
  res.json(decisionShape(restored));
});

// DELETE /decisions/:id/permanent — creator only, must already be in trash
router.delete("/decisions/:id/permanent", requireAuth, async (req: any, res): Promise<void> => {
  const params = PermanentlyDeleteDecisionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId), isNotNull(decisionsTable.deletedAt)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  await logAudit({
    teamId: deleted.teamId,
    decisionId: deleted.id,
    userId: req.userId,
    actorName: deleted.createdByName,
    action: "decision_permanently_deleted",
    detail: `حذف قرار «${deleted.question}» نهائياً`,
  });
  res.sendStatus(204);
});

// GET /decisions/:id
router.get("/decisions/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetDecisionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const decision = await findAccessibleDecision(params.data.id, req.userId);
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  const options = await db.select().from(optionsTable).where(eq(optionsTable.decisionId, decision.id)).orderBy(optionsTable.sortOrder);
  const criteria = await db.select().from(criteriaTable).where(eq(criteriaTable.decisionId, decision.id)).orderBy(criteriaTable.sortOrder);
  const optionIds = options.map((o) => o.id);
  let ratings: (typeof ratingsTable.$inferSelect)[] = [];
  if (optionIds.length > 0) {
    ratings = await db.select().from(ratingsTable).where(inArray(ratingsTable.optionId, optionIds));
  }
  res.json({
    ...decisionShape(decision),
    isCreator: decision.userId === req.userId,
    options,
    criteria,
    ratings,
    myRatings: ratings.filter((r) => r.userId === req.userId),
  });
});

// PATCH /decisions/:id
router.patch("/decisions/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = UpdateDecisionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDecisionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId), isNull(decisionsTable.deletedAt)));
  if (!existing) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  const [updated] = await db
    .update(decisionsTable)
    .set({ question: parsed.data.question })
    .where(eq(decisionsTable.id, params.data.id))
    .returning();
  res.json(decisionShape(updated));
});

// DELETE /decisions/:id — creator only
router.delete("/decisions/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = DeleteDecisionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId), isNull(decisionsTable.deletedAt)));
  if (!existing) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  await db.update(decisionsTable).set({ deletedAt: new Date() }).where(eq(decisionsTable.id, params.data.id));
  await logAudit({
    teamId: existing.teamId,
    decisionId: existing.id,
    userId: req.userId,
    actorName: existing.createdByName,
    action: "decision_deleted",
    detail: `نقل قرار «${existing.question}» إلى سلة المحذوفات`,
  });
  res.sendStatus(204);
});

// POST /decisions/:id/decide — creator marks the final choice
router.post("/decisions/:id/decide", requireAuth, async (req: any, res): Promise<void> => {
  const params = DecideDecisionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = DecideDecisionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const decision = await findAccessibleDecision(params.data.id, req.userId);
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  if (decision.userId !== req.userId) {
    res.status(403).json({ error: "فقط صاحب القرار يمكنه اعتماده" });
    return;
  }
  if (decision.status === "decided") {
    res.status(400).json({ error: "هذا القرار معتمد نهائياً بالفعل" });
    return;
  }
  const [option] = await db
    .select()
    .from(optionsTable)
    .where(and(eq(optionsTable.id, parsed.data.optionId), eq(optionsTable.decisionId, decision.id)));
  if (!option) {
    res.status(404).json({ error: "Option not found in this decision" });
    return;
  }
  const [updated] = await db
    .update(decisionsTable)
    .set({ status: "decided", decidedOptionId: option.id, decidedAt: new Date() })
    .where(eq(decisionsTable.id, decision.id))
    .returning();
  await logAudit({
    teamId: decision.teamId,
    decisionId: decision.id,
    userId: req.userId,
    actorName: decision.createdByName,
    action: "decision_finalized",
    detail: `اعتمد الخيار «${option.label}» كقرار نهائي`,
  });
  res.json(decisionShape(updated));
});

// GET /decisions/:id/comments
router.get("/decisions/:id/comments", requireAuth, async (req: any, res): Promise<void> => {
  const params = ListCommentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const decision = await findAccessibleDecision(params.data.id, req.userId);
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.decisionId, decision.id))
    .orderBy(commentsTable.createdAt);
  res.json(comments);
});

// POST /decisions/:id/comments
router.post("/decisions/:id/comments", requireAuth, async (req: any, res): Promise<void> => {
  const params = AddCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const decision = await findAccessibleDecision(params.data.id, req.userId);
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  if (parsed.data.optionId !== undefined) {
    const [option] = await db
      .select()
      .from(optionsTable)
      .where(and(eq(optionsTable.id, parsed.data.optionId), eq(optionsTable.decisionId, decision.id)));
    if (!option) {
      res.status(404).json({ error: "Option not found in this decision" });
      return;
    }
  }
  const [comment] = await db
    .insert(commentsTable)
    .values({
      decisionId: decision.id,
      optionId: parsed.data.optionId ?? null,
      userId: req.userId,
      authorName: parsed.data.authorName ?? "",
      body: parsed.data.body,
    })
    .returning();
  await logAudit({
    teamId: decision.teamId,
    decisionId: decision.id,
    userId: req.userId,
    actorName: parsed.data.authorName,
    action: "comment_added",
    detail: `علّق على القرار`,
  });
  res.status(201).json(comment);
});

// GET /decisions/:id/audit
router.get("/decisions/:id/audit", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetDecisionAuditParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const decision = await findAccessibleDecision(params.data.id, req.userId);
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  const entries = await db
    .select()
    .from(auditLogTable)
    .where(eq(auditLogTable.decisionId, decision.id))
    .orderBy(desc(auditLogTable.createdAt))
    .limit(200);
  res.json(entries);
});

// POST /decisions/:id/options — creator only, max 5
router.post("/decisions/:id/options", requireAuth, async (req: any, res): Promise<void> => {
  const params = AddOptionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddOptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [decision] = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId), isNull(decisionsTable.deletedAt)));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  if (decision.status === "decided") {
    res.status(400).json({ error: "هذا القرار معتمد نهائياً — لا يمكن تعديل بنيته" });
    return;
  }
  const existing = await db.select().from(optionsTable).where(eq(optionsTable.decisionId, params.data.id));
  if (existing.length >= 5) {
    res.status(400).json({ error: "لا يمكن إضافة أكثر من 5 خيارات" });
    return;
  }
  const [option] = await db
    .insert(optionsTable)
    .values({ decisionId: params.data.id, label: parsed.data.label, sortOrder: existing.length })
    .returning();
  res.status(201).json(option);
});

// PATCH /decisions/:id/options/:optionId — creator only
router.patch("/decisions/:id/options/:optionId", requireAuth, async (req: any, res): Promise<void> => {
  const params = UpdateOptionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [decision] = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId), isNull(decisionsTable.deletedAt)));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  if (decision.status === "decided") {
    res.status(400).json({ error: "هذا القرار معتمد نهائياً — لا يمكن تعديل بنيته" });
    return;
  }
  const [updated] = await db
    .update(optionsTable)
    .set({ label: parsed.data.label })
    .where(and(eq(optionsTable.id, params.data.optionId), eq(optionsTable.decisionId, params.data.id)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Option not found" });
    return;
  }
  res.json(updated);
});

// DELETE /decisions/:id/options/:optionId — creator only
router.delete("/decisions/:id/options/:optionId", requireAuth, async (req: any, res): Promise<void> => {
  const params = DeleteOptionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [decision] = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId), isNull(decisionsTable.deletedAt)));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  if (decision.status === "decided") {
    res.status(400).json({ error: "هذا القرار معتمد نهائياً — لا يمكن تعديل بنيته" });
    return;
  }
  const [deleted] = await db
    .delete(optionsTable)
    .where(and(eq(optionsTable.id, params.data.optionId), eq(optionsTable.decisionId, params.data.id)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Option not found" });
    return;
  }
  res.sendStatus(204);
});

// POST /decisions/:id/criteria — creator only
router.post("/decisions/:id/criteria", requireAuth, async (req: any, res): Promise<void> => {
  const params = AddCriterionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddCriterionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [decision] = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId), isNull(decisionsTable.deletedAt)));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  if (decision.status === "decided") {
    res.status(400).json({ error: "هذا القرار معتمد نهائياً — لا يمكن تعديل بنيته" });
    return;
  }
  const existing = await db.select().from(criteriaTable).where(eq(criteriaTable.decisionId, params.data.id));
  const [criterion] = await db
    .insert(criteriaTable)
    .values({ decisionId: params.data.id, label: parsed.data.label, weight: parsed.data.weight, sortOrder: existing.length })
    .returning();
  res.status(201).json(criterion);
});

// PATCH /decisions/:id/criteria/:criterionId — creator only
router.patch("/decisions/:id/criteria/:criterionId", requireAuth, async (req: any, res): Promise<void> => {
  const params = UpdateCriterionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCriterionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [decision] = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId), isNull(decisionsTable.deletedAt)));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  if (decision.status === "decided") {
    res.status(400).json({ error: "هذا القرار معتمد نهائياً — لا يمكن تعديل بنيته" });
    return;
  }
  const updateFields: Partial<{ label: string; weight: number }> = {};
  if (parsed.data.label !== undefined) updateFields.label = parsed.data.label;
  if (parsed.data.weight !== undefined) updateFields.weight = parsed.data.weight;
  const [updated] = await db
    .update(criteriaTable)
    .set(updateFields)
    .where(and(eq(criteriaTable.id, params.data.criterionId), eq(criteriaTable.decisionId, params.data.id)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Criterion not found" });
    return;
  }
  res.json(updated);
});

// DELETE /decisions/:id/criteria/:criterionId — creator only
router.delete("/decisions/:id/criteria/:criterionId", requireAuth, async (req: any, res): Promise<void> => {
  const params = DeleteCriterionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [decision] = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId), isNull(decisionsTable.deletedAt)));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  if (decision.status === "decided") {
    res.status(400).json({ error: "هذا القرار معتمد نهائياً — لا يمكن تعديل بنيته" });
    return;
  }
  const [deleted] = await db
    .delete(criteriaTable)
    .where(and(eq(criteriaTable.id, params.data.criterionId), eq(criteriaTable.decisionId, params.data.id)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Criterion not found" });
    return;
  }
  res.sendStatus(204);
});

// PUT /decisions/:id/ratings — per-user vote, any member can rate
router.put("/decisions/:id/ratings", requireAuth, async (req: any, res): Promise<void> => {
  const params = UpsertRatingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpsertRatingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const decision = await findAccessibleDecision(params.data.id, req.userId);
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  if (decision.status === "decided") {
    res.status(400).json({ error: "هذا القرار معتمد نهائياً — لا يمكن تعديل التصويت" });
    return;
  }
  const [option] = await db
    .select()
    .from(optionsTable)
    .where(and(eq(optionsTable.id, parsed.data.optionId), eq(optionsTable.decisionId, params.data.id)));
  if (!option) {
    res.status(404).json({ error: "Option not found in this decision" });
    return;
  }
  const [criterion] = await db
    .select()
    .from(criteriaTable)
    .where(and(eq(criteriaTable.id, parsed.data.criterionId), eq(criteriaTable.decisionId, params.data.id)));
  if (!criterion) {
    res.status(404).json({ error: "Criterion not found in this decision" });
    return;
  }
  const [rating] = await db
    .insert(ratingsTable)
    .values({
      optionId: parsed.data.optionId,
      criterionId: parsed.data.criterionId,
      userId: req.userId,
      score: parsed.data.score,
    })
    .onConflictDoUpdate({
      target: [ratingsTable.optionId, ratingsTable.criterionId, ratingsTable.userId],
      set: { score: parsed.data.score },
    })
    .returning();
  res.json(rating);
});

// GET /decisions/:id/scores — aggregated across all voters
router.get("/decisions/:id/scores", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetDecisionScoresParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const decision = await findAccessibleDecision(params.data.id, req.userId);
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  const options = await db.select().from(optionsTable).where(eq(optionsTable.decisionId, params.data.id)).orderBy(optionsTable.sortOrder);
  const criteria = await db.select().from(criteriaTable).where(eq(criteriaTable.decisionId, params.data.id));
  const totalMaxScore = criteria.reduce((sum, c) => sum + c.weight * 5, 0);
  const optionIds = options.map((o) => o.id);
  let allRatings: (typeof ratingsTable.$inferSelect)[] = [];
  if (optionIds.length > 0) {
    allRatings = await db.select().from(ratingsTable).where(inArray(ratingsTable.optionId, optionIds));
  }
  const voters = new Set(allRatings.map((r) => r.userId));

  const scores = options.map((opt) => {
    // average score per criterion across all voters, then weight
    let totalScore = 0;
    for (const criterion of criteria) {
      const rs = allRatings.filter((r) => r.optionId === opt.id && r.criterionId === criterion.id);
      if (rs.length > 0) {
        const avg = rs.reduce((s, r) => s + r.score, 0) / rs.length;
        totalScore += avg * criterion.weight;
      }
    }
    totalScore = Math.round(totalScore * 10) / 10;
    const percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
    return { optionId: opt.id, label: opt.label, totalScore, maxScore: totalMaxScore, percentage };
  });

  const maxPercentage = Math.max(...scores.map((s) => s.percentage), 0);
  const result = scores.map((s) => ({ ...s, isWinner: s.percentage === maxPercentage && maxPercentage > 0 }));

  const myRatings = allRatings.filter((r) => r.userId === req.userId);
  const myVoteComplete = criteria.length > 0 && options.length > 0 && myRatings.length >= criteria.length * options.length;

  res.json({ scores: result, voterCount: voters.size, myVoteComplete });
});

export default router;
