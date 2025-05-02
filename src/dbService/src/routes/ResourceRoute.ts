import { Router } from "express";

import {updateContainerResourceLimit} from "../controllers/ResourceController";
const app = Router();

app.post("/update", updateContainerResourceLimit);


export default app;