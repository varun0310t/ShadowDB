import "../config/psqlConfig";
import { Router, Request, Response } from "express";
import { startPgpool,createPgpool,stopPgpool,deletePgpool } from "../controllers/PgpoolController";

const router = Router();

// Regular routes - Fix the route handler type signatures
router.get("/", (req: Request, res: Response) => {
  res.send("Database Route");
});

// Create a new database instance
router.post("/create", createPgpool);
router.delete("/delete", deletePgpool);
router.post("/stop", stopPgpool);
router.post("/start", startPgpool);

// Updated to check Patroni status instead of just PostgreSQL

export default router;
