import { Router } from "express";
import {
  UpdateDatabaseMaxSize,
  OffReadOnlyMode,
  GetStorageInfo,
} from "../controllers/StorageController";
import { startStorageMonitoring } from "../lib/StorageChecker";
const app = Router();

startStorageMonitoring(15); // Start monitoring every 15 minutes

app.post("/updateSize", UpdateDatabaseMaxSize);
app.post("/offReadOnlyMode/:databaseId", OffReadOnlyMode);
app.get("/checkdatabaseinfo/:databaseId", GetStorageInfo);

export default app;
