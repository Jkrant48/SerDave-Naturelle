// App setup: shared middleware and API route registration live here.
import express from "express";
import cors from "cors";
import process from "node:process";
import bookingRoutes from "./routes/bookingRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// Admin sessions are HTTP-only cookies, so the frontend origin must allow credentials.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" }));

// Routes connect public API URLs to their route/controller modules.
app.use("/api/health", healthRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/portfolio", portfolioRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error middleware handles errors passed from controllers and routes.
app.use(errorHandler);

export default app;
