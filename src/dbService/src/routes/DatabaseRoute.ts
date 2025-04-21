
import "../config/psqlConfig";
import  { Router, Request, Response } from "express";
import { initializeService } from "../Services/DatabaseRouteService";
import { AddReplica, CreateDatabase } from "../controllers/DatabasesController";


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
