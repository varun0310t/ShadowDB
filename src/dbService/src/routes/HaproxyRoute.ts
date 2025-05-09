import "../config/psqlConfig";
import { Router, Request, Response } from "express";
import {
  CreateHaproxy,
  stopHaproxy,
  startHaproxy,
  deleteHaproxy,
} from "../controllers/Haproxycontroller";

const router = Router();


// Create a new database instance
router.post("/create", CreateHaproxy);
router.delete("/delete", deleteHaproxy);
router.post("/stop", stopHaproxy);
router.post("/start", startHaproxy);

// Updated to check Patroni status instead of just PostgreSQL

export default router;
