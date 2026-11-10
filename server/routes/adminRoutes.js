// Management routes require a database-backed staff session except login and logout.
import express, { Router } from "express";
import {
  createCategory,
  createEmployeeAccount,
  createPortfolioItem,
  createService,
  deleteAccount,
  deactivateService,
  deleteCategory,
  discardPortfolioImage,
  getAdminDashboard,
  getAdminMessages,
  markAdminMessageRead,
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
  requireStaff,
  requireSameOrigin,
} from "../config/adminSession.js";

const router = Router();

// First-admin creation is exposed only while the database has no Admin users.
router.get("/setup-status", getAdminSetupStatus);
router.post("/setup", requireSameOrigin, createFirstAdmin);
router.post("/login", requireSameOrigin, loginAdmin);
router.post("/logout", requireSameOrigin, logoutAdmin);
router.get("/session", requireStaff, getAdminSession);

router.use(requireStaff);
router.get("/", getAdminDashboard);
router.get("/messages", getAdminMessages);
router.patch("/messages/:id/read", markAdminMessageRead);

router.post("/employees", requireAdmin, createEmployeeAccount);
router.delete("/accounts/:id", requireAdmin, deleteAccount);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", requireAdmin, deleteCategory);

router.post("/services", createService);
router.put("/services/:id", updateService);
router.delete("/services/:id", requireAdmin, deactivateService);

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
