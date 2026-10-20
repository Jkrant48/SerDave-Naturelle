// Booking routes: define HTTP methods and URLs, then delegate behavior.
import { Router } from "express";
import {
  createBooking,
  verifyBookingPayment,
} from "../controllers/bookingController.js";

const router = Router();

router.post("/", createBooking);
router.get("/verify", verifyBookingPayment);

export default router;
