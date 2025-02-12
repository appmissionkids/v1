import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["parent", "child"] }).notNull(),
  parentId: integer("parent_id"),
  coins: integer("coins").default(0),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  reward: integer("reward").notNull(),
  childId: integer("child_id").notNull(),
  parentId: integer("parent_id"),
  goalId: integer("goal_id"),
  completed: boolean("completed").default(false),
  validated: boolean("validated").default(false),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["weekly", "monthly"] }).notNull(),
  objective: text("objective").notNull(),
  reward: integer("reward").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  targetTasks: integer("target_tasks").notNull(),
  completedTasks: integer("completed_tasks").default(0),
  childId: integer("child_id").notNull(),
  parentId: integer("parent_id"),
  completed: boolean("completed").default(false),
  validated: boolean("validated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  children: many(users),
  tasksAssigned: many(tasks),
  tasksToComplete: many(tasks),
  goalsAssigned: many(goals),
  goalsToComplete: many(goals),
}));

export const taskRelations = relations(tasks, ({ one }) => ({
  child: one(users, {
    fields: [tasks.childId],
    references: [users.id],
  }),
  parent: one(users, {
    fields: [tasks.parentId],
    references: [users.id],
  }),
  goal: one(goals, {
    fields: [tasks.goalId],
    references: [goals.id],
  }),
}));

export const goalRelations = relations(goals, ({ one, many }) => ({
  child: one(users, {
    fields: [goals.childId],
    references: [users.id],
  }),
  parent: one(users, {
    fields: [goals.parentId],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

// Base schemas
export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["parent", "child"]),
  parentId: z.number().optional(),
});

export const insertTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  reward: z.number().min(1, "Reward must be at least 1 coin"),
  childId: z.number(),
  goalId: z.number().optional(),
  dueDate: z.string().nullable().transform((val) => val ? new Date(val) : null),
});

export const insertGoalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  objective: z.string().min(1, "Objective is required"),
  type: z.enum(["weekly", "monthly"]),
  reward: z.number().min(1, "Reward must be at least 1 coin"),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  targetTasks: z.number().min(1, "Target tasks must be at least 1"),
  childId: z.number(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;