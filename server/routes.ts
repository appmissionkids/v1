import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTaskSchema, insertGoalSchema } from "@shared/schema";
import { hashPassword } from "./utils"; // Assuming this function exists for password hashing

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Task management routes
  app.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const taskData = insertTaskSchema.parse(req.body);
    const task = await storage.createTask(taskData);
    res.json(task);
  });

  app.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tasks = await storage.getTasks(req.user!.id);
    res.json(tasks);
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const task = await storage.updateTask(parseInt(req.params.id), req.body);

    if (req.body.validated && task.completed) {
      await storage.updateUserCoins(task.childId, task.reward);

      // If this task is part of a goal, increment the goal progress
      if (req.body.goalId) {
        await storage.incrementGoalProgress(req.body.goalId);
      }
    }

    res.json(task);
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteTask(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // Goal management routes
  app.post("/api/goals", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "parent") {
      return res.sendStatus(401);
    }

    const goalData = insertGoalSchema.parse(req.body);
    const goal = await storage.createGoal(goalData);
    res.json(goal);
  });

  app.get("/api/goals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const goals = await storage.getGoals(req.user!.id);
    res.json(goals);
  });

  app.patch("/api/goals/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const goal = await storage.updateGoal(parseInt(req.params.id), req.body);

    if (req.body.validated && goal.completed) {
      await storage.updateUserCoins(goal.childId, goal.reward);
    }

    res.json(goal);
  });

  app.delete("/api/goals/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "parent") {
      return res.sendStatus(401);
    }
    await storage.deleteGoal(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // Children management routes
  app.get("/api/children", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "parent") {
      return res.sendStatus(401);
    }
    const children = await storage.getChildren(req.user!.id);
    res.json(children);
  });

  app.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "parent") {
      return res.sendStatus(401);
    }
    try {
      const child = await storage.updateChild(parseInt(req.params.id), req.body);
      res.json(child);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "parent") {
      return res.sendStatus(401);
    }
    try {
      await storage.deleteChild(parseInt(req.params.id));
      res.sendStatus(200);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}