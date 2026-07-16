import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, decisionsTable, optionsTable, criteriaTable, ratingsTable } from "@workspace/db";
import {
  CreateDecisionBody,
  UpdateDecisionBody,
  UpdateDecisionParams,
  GetDecisionParams,
  DeleteDecisionParams,
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
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

// GET /decisions
router.get("/decisions", requireAuth, async (req: any, res): Promise<void> => {
  const decisions = await db
    .select()
    .from(decisionsTable)
    .where(eq(decisionsTable.userId, req.userId))
    .orderBy(decisionsTable.createdAt);
  res.json(decisions.map((d) => ({ id: d.id, question: d.question, createdAt: d.createdAt })));
});

// POST /decisions
router.post("/decisions", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateDecisionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [decision] = await db
    .insert(decisionsTable)
    .values({ userId: req.userId, question: parsed.data.question })
    .returning();
  res.status(201).json({ id: decision.id, question: decision.question, createdAt: decision.createdAt });
});

// GET /decisions/:id
router.get("/decisions/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetDecisionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [decision] = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId)));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  const options = await db.select().from(optionsTable).where(eq(optionsTable.decisionId, decision.id)).orderBy(optionsTable.sortOrder);
  const criteria = await db.select().from(criteriaTable).where(eq(criteriaTable.decisionId, decision.id)).orderBy(criteriaTable.sortOrder);
  const optionIds = options.map((o) => o.id);
  let ratings: (typeof ratingsTable.$inferSelect)[] = [];
  if (optionIds.length > 0) {
    for (const optId of optionIds) {
      const rs = await db.select().from(ratingsTable).where(eq(ratingsTable.optionId, optId));
      ratings.push(...rs);
    }
  }
  res.json({ id: decision.id, question: decision.question, createdAt: decision.createdAt, options, criteria, ratings });
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
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId)));
  if (!existing) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  const [updated] = await db
    .update(decisionsTable)
    .set({ question: parsed.data.question })
    .where(eq(decisionsTable.id, params.data.id))
    .returning();
  res.json({ id: updated.id, question: updated.question, createdAt: updated.createdAt });
});

// DELETE /decisions/:id
router.delete("/decisions/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = DeleteDecisionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId)));
  if (!existing) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  await db.delete(decisionsTable).where(eq(decisionsTable.id, params.data.id));
  res.sendStatus(204);
});

// POST /decisions/:id/options
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
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId)));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
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

// PATCH /decisions/:id/options/:optionId
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
  // Verify ownership
  const [decision] = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId)));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
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

// DELETE /decisions/:id/options/:optionId
router.delete("/decisions/:id/options/:optionId", requireAuth, async (req: any, res): Promise<void> => {
  const params = DeleteOptionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [decision] = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId)));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
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

// POST /decisions/:id/criteria
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
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId)));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  const existing = await db.select().from(criteriaTable).where(eq(criteriaTable.decisionId, params.data.id));
  const [criterion] = await db
    .insert(criteriaTable)
    .values({ decisionId: params.data.id, label: parsed.data.label, weight: parsed.data.weight, sortOrder: existing.length })
    .returning();
  res.status(201).json(criterion);
});

// PATCH /decisions/:id/criteria/:criterionId
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
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId)));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
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

// DELETE /decisions/:id/criteria/:criterionId
router.delete("/decisions/:id/criteria/:criterionId", requireAuth, async (req: any, res): Promise<void> => {
  const params = DeleteCriterionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [decision] = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId)));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
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

// PUT /decisions/:id/ratings
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
  const [decision] = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId)));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  // Verify optionId belongs to this decision
  const [option] = await db
    .select()
    .from(optionsTable)
    .where(and(eq(optionsTable.id, parsed.data.optionId), eq(optionsTable.decisionId, params.data.id)));
  if (!option) {
    res.status(404).json({ error: "Option not found in this decision" });
    return;
  }
  // Verify criterionId belongs to this decision
  const [criterion] = await db
    .select()
    .from(criteriaTable)
    .where(and(eq(criteriaTable.id, parsed.data.criterionId), eq(criteriaTable.decisionId, params.data.id)));
  if (!criterion) {
    res.status(404).json({ error: "Criterion not found in this decision" });
    return;
  }
  const existing = await db
    .select()
    .from(ratingsTable)
    .where(and(eq(ratingsTable.optionId, parsed.data.optionId), eq(ratingsTable.criterionId, parsed.data.criterionId)));
  let rating;
  if (existing.length > 0) {
    const [updated] = await db
      .update(ratingsTable)
      .set({ score: parsed.data.score })
      .where(eq(ratingsTable.id, existing[0].id))
      .returning();
    rating = updated;
  } else {
    const [created] = await db
      .insert(ratingsTable)
      .values({ optionId: parsed.data.optionId, criterionId: parsed.data.criterionId, score: parsed.data.score })
      .returning();
    rating = created;
  }
  res.json(rating);
});

// GET /decisions/:id/scores
router.get("/decisions/:id/scores", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetDecisionScoresParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [decision] = await db
    .select()
    .from(decisionsTable)
    .where(and(eq(decisionsTable.id, params.data.id), eq(decisionsTable.userId, req.userId)));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  const options = await db.select().from(optionsTable).where(eq(optionsTable.decisionId, params.data.id)).orderBy(optionsTable.sortOrder);
  const criteria = await db.select().from(criteriaTable).where(eq(criteriaTable.decisionId, params.data.id));
  const totalMaxScore = criteria.reduce((sum, c) => sum + c.weight * 5, 0);

  const scores = await Promise.all(
    options.map(async (opt) => {
      const ratings = await db.select().from(ratingsTable).where(eq(ratingsTable.optionId, opt.id));
      const totalScore = ratings.reduce((sum, r) => {
        const criterion = criteria.find((c) => c.id === r.criterionId);
        return sum + (criterion ? r.score * criterion.weight : 0);
      }, 0);
      const percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
      return { optionId: opt.id, label: opt.label, totalScore, maxScore: totalMaxScore, percentage };
    }),
  );

  const maxPercentage = Math.max(...scores.map((s) => s.percentage), 0);
  const result = scores.map((s) => ({ ...s, isWinner: s.percentage === maxPercentage && maxPercentage > 0 }));
  res.json(result);
});

export default router;
