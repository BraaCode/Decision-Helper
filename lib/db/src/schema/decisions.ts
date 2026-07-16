import { pgTable, text, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";

export const decisionsTable = pgTable("decisions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  question: text("question").notNull(),
  teamId: integer("team_id").references(() => teamsTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("open"),
  decidedOptionId: integer("decided_option_id"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdByName: text("created_by_name").notNull().default(""),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDecisionSchema = createInsertSchema(decisionsTable).omit({ id: true, createdAt: true });
export type InsertDecision = z.infer<typeof insertDecisionSchema>;
export type Decision = typeof decisionsTable.$inferSelect;

export const optionsTable = pgTable("options", {
  id: serial("id").primaryKey(),
  decisionId: integer("decision_id").notNull().references(() => decisionsTable.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertOptionSchema = createInsertSchema(optionsTable).omit({ id: true });
export type InsertOption = z.infer<typeof insertOptionSchema>;
export type Option = typeof optionsTable.$inferSelect;

export const criteriaTable = pgTable("criteria", {
  id: serial("id").primaryKey(),
  decisionId: integer("decision_id").notNull().references(() => decisionsTable.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  weight: integer("weight").notNull().default(3),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertCriterionSchema = createInsertSchema(criteriaTable).omit({ id: true });
export type InsertCriterion = z.infer<typeof insertCriterionSchema>;
export type Criterion = typeof criteriaTable.$inferSelect;

export const ratingsTable = pgTable("ratings", {
  id: serial("id").primaryKey(),
  optionId: integer("option_id").notNull().references(() => optionsTable.id, { onDelete: "cascade" }),
  criterionId: integer("criterion_id").notNull().references(() => criteriaTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  score: integer("score").notNull().default(3),
}, (t) => [
  unique("ratings_option_criterion_user_uniq").on(t.optionId, t.criterionId, t.userId),
]);

export const insertRatingSchema = createInsertSchema(ratingsTable).omit({ id: true });
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratingsTable.$inferSelect;
