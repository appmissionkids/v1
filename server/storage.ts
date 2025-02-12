import { users, tasks, goals, type User, type Task, type Goal, type InsertUser, type InsertTask, type InsertGoal } from "@shared/schema";
import { db } from "./db";
import { eq, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getChildren(parentId: number): Promise<User[]>;

  createTask(task: InsertTask): Promise<Task>;
  getTasks(userId: number): Promise<Task[]>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  createGoal(goal: InsertGoal): Promise<Goal>;
  getGoals(userId: number): Promise<Goal[]>;
  updateGoal(id: number, updates: Partial<Goal>): Promise<Goal>;
  deleteGoal(id: number): Promise<void>;
  incrementGoalProgress(goalId: number): Promise<Goal>;

  updateUserCoins(userId: number, amount: number): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Existing user methods...
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getChildren(parentId: number): Promise<User[]> {
    return db.select()
      .from(users)
      .where(eq(users.parentId, parentId));
  }

  // Existing task methods...
  async createTask(insertTask: InsertTask): Promise<Task> {
    const child = await this.getUser(insertTask.childId);
    if (!child) throw new Error("Child not found");
    if (!child.parentId) throw new Error("Child has no parent assigned");

    const [task] = await db.insert(tasks)
      .values({
        ...insertTask,
        parentId: child.parentId,
      })
      .returning();
    return task;
  }

  async getTasks(userId: number): Promise<Task[]> {
    return db.select()
      .from(tasks)
      .where(or(eq(tasks.childId, userId), eq(tasks.parentId, userId)));
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const [task] = await db.update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // New goal methods
  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const child = await this.getUser(insertGoal.childId);
    if (!child) throw new Error("Child not found");
    if (!child.parentId) throw new Error("Child has no parent assigned");

    const [goal] = await db.insert(goals)
      .values({
        ...insertGoal,
        parentId: child.parentId,
      })
      .returning();
    return goal;
  }

  async getGoals(userId: number): Promise<Goal[]> {
    return db.select()
      .from(goals)
      .where(or(eq(goals.childId, userId), eq(goals.parentId, userId)));
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<Goal> {
    const [goal] = await db.update(goals)
      .set(updates)
      .where(eq(goals.id, id))
      .returning();
    return goal;
  }

  async deleteGoal(id: number): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  async incrementGoalProgress(goalId: number): Promise<Goal> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, goalId));
    if (!goal) throw new Error("Goal not found");

    const [updatedGoal] = await db.update(goals)
      .set({ 
        completedTasks: goal.completedTasks + 1,
        completed: goal.completedTasks + 1 >= goal.targetTasks
      })
      .where(eq(goals.id, goalId))
      .returning();
    return updatedGoal;
  }

  async updateUserCoins(userId: number, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const [updatedUser] = await db.update(users)
      .set({ coins: (user.coins || 0) + amount })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    // First delete all related tasks and goals
    await db.delete(tasks).where(eq(tasks.childId, id));
    await db.delete(goals).where(eq(goals.childId, id));
    // Then delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  async deleteChild(id: number): Promise<void> {
    return this.deleteUser(id);
  }

  async updateChild(id: number, updates: Partial<User>): Promise<User> {
    const [child] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    if (!child) throw new Error("Child not found");
    return child;
  }
}

export const storage = new DatabaseStorage();