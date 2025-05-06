import { Router } from "express";

import {
  CreateNewRole,
  DeleteRole,
  createReadonly,
} from "../controllers/RolesController";

const app = Router();

app.post("/create", CreateNewRole);
app.post("/delete", DeleteRole);
app.post("/readonly", createReadonly);

export default app;
