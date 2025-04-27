import "../config/psqlConfig";
import { Router, Request, Response } from "express";
import { initializeService } from "../Services/DatabaseRouteService";
import { CreateBackup } from "../controllers/DatabaseBackupController";

const router = Router();



// Create a new database instance
router.post("/create", CreateBackup);


export default router;
