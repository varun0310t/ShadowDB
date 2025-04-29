import { Router } from "express";

import { UpdateConfiguration } from "../controllers/DatabaseConfigurationController";
const app = Router();

app.post("/update",UpdateConfiguration);


export default app;