import { Router } from "express";

import { CreateNewRole } from "../controllers/RolesController";
const app = Router();

app.post("/create",CreateNewRole);


export default app;