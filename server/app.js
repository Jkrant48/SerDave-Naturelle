// App setup: shared middleware and API route registration live here.
import express from "express";
import cors from "cors";
import process from "node:process";
import bookingRoutes from "./routes/bookingRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "10kb" }));

// Routes connect public API URLs to their route/controller modules.
app.use("/api/health", healthRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/contact", contactRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error middleware handles errors passed from controllers and routes.
app.use(errorHandler);

export default app;
