// Contact routes: map contact form requests to their controller actions.
import { Router } from "express";
import { createContactMessage } from "../controllers/contactController.js";

const router = Router();

router.post("/", createContactMessage);

export default router;
