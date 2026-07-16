import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { decisionsTable, optionsTable } from "./decisions";
import { teamsTable } from "./teams";

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  decisionId: integer("decision_id").notNull().references(() => decisionsTable.id, { onDelete: "cascade" }),
  optionId: integer("option_id").references(() => optionsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  authorName: text("author_name").notNull().default(""),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(commentsTable).omit({ id: true, createdAt: true });
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;

export const auditLogTable = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teamsTable.id, { onDelete: "cascade" }),
  decisionId: integer("decision_id"),
  userId: text("user_id").notNull(),
  actorName: text("actor_name").notNull().default(""),
  action: text("action").notNull(),
  detail: text("detail").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogTable).omit({ id: true, createdAt: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLogEntry = typeof auditLogTable.$inferSelect;
