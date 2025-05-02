import { Router } from "express";

import {updateContainerResourceLimit} from "../controllers/Resourcecontroller";
const app = Router();

app.post("/update", updateContainerResourceLimit);


export default app;