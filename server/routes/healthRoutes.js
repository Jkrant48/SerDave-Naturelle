// Health routes: lightweight endpoints for checking server and DB status.
import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";

const router = Router();

router.get("/", getHealth);

export default router;
