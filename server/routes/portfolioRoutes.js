// Portfolio images are publicly listed on the home page; uploads remain admin-only.
import { Router } from "express";
import { listPortfolio } from "../controllers/adminController.js";

const router = Router();

router.get("/", listPortfolio);

export default router;
