// Admin routes require a database-backed admin session except login and logout.
import express, { Router } from "express";
import {
  createCategory,
  createEmployeeAccount,
  createPortfolioItem,
  createService,
  deactivateService,
  deleteCategory,
  discardPortfolioImage,
  getAdminDashboard,
  updateCategory,
  updateService,
  uploadPortfolioImage,
} from "../controllers/adminController.js";
import {
  createFirstAdmin,
  getAdminSetupStatus,
  getAdminSession,
  loginAdmin,
  logoutAdmin,
} from "../controllers/adminAuthController.js";
import {
  requireAdmin,
  requireSameOrigin,
} from "../config/adminSession.js";

const router = Router();

// First-admin creation is exposed only while the database has no Admin users.
router.get("/setup-status", getAdminSetupStatus);
router.post("/setup", requireSameOrigin, createFirstAdmin);
router.post("/login", requireSameOrigin, loginAdmin);
router.post("/logout", requireSameOrigin, logoutAdmin);
router.get("/session", requireAdmin, getAdminSession);

router.use(requireAdmin);
router.get("/", getAdminDashboard);

// Employee creation is protected by the Admin-only middleware above.
router.post("/employees", createEmployeeAccount);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

router.post("/services", createService);
router.put("/services/:id", updateService);
router.delete("/services/:id", deactivateService);

router.post(
  "/portfolio-image",
  express.raw({
    type: ["image/jpeg", "image/png", "image/webp"],
    limit: "5mb",
  }),
  uploadPortfolioImage,
);
router.delete("/portfolio-image/:path", discardPortfolioImage);
router.post("/portfolio", createPortfolioItem);

export default router;
