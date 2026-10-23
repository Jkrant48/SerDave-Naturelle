import { Router } from "express";
import {
  createReview,
  getPublicReviews,
  verifyReviewAppointment,
} from "../controllers/reviewController.js";

const router = Router();

router.get("/", getPublicReviews);
router.post("/verify", verifyReviewAppointment);
router.post("/", createReview);

export default router;
