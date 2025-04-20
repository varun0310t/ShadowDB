import { exec } from "child_process";
import { promisify } from "util";
import "../config/psqlConfig";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { getDefaultReaderPool, getDefaultWriterPool } from "../lib/Getpools";
import express, { Router, Request, Response } from "express";
import * as net from "net";
import { DB_CONFIG } from "../config/DatabaseRouteConfig";
import { initializeService } from "../Services/DatabaseRouteService";
import { IsPatroniReady } from "../lib/PatroniUitlity/Uitls";
import { isPortInUse, findAvailablePort } from "../lib/PortUitlity/utils";
import { AddReplica, CreateDatabase } from "../controllers/DatabasesController";
const execAsync = promisify(exec);

const router = Router();

// Updated configuration with Patroni support
(async () => {
  try {
    // Initialize the service and recover instances
    await initializeService();
  } catch (error) {
    console.error("Failed to initialize database service:", error);
  }
})();

// Regular routes - Fix the route handler type signatures
router.get("/", (req: Request, res: Response) => {
  res.send("Database Route");
});

// Create a new database instance
router.post("/create", CreateDatabase);

// New endpoint to add a replica to an existing database
router.post("/addReplica", AddReplica);

// Updated to check Patroni status instead of just PostgreSQL

export default router;
