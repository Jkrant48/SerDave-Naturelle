// Health controller: confirm the API process and PostgreSQL connection are ready.
import pool from "../config/database.js";

export async function getHealth(req, res) {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "unavailable" });
  }
}
