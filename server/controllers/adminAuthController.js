// The admin login validates only Admin rows and places a signed session in an HTTP-only cookie.
import pool from "../config/database.js";
import {
  assertAdminSessionConfigured,
  clearAdminCookie,
  createAdminToken,
  setAdminCookie,
} from "../config/adminSession.js";
import { hashPassword, verifyPassword } from "../utils/passwords.js";

const loginAttempts = new Map();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const ADMIN_BOOTSTRAP_LOCK_ID = 73190412;

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

function allowAttempt(address, attempts, res, action) {
  const now = Date.now();
  const attempt = attempts.get(address);
  if (attempt && now - attempt.startedAt < ATTEMPT_WINDOW_MS) {
    if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
      res.status(429).json({ message: `Too many ${action} attempts. Try again later.` });
      return false;
    }
    attempt.count += 1;
    return true;
  }

  if (attempts.size > 1000) {
    for (const [key, entry] of attempts) {
      if (now - entry.startedAt >= ATTEMPT_WINDOW_MS) attempts.delete(key);
    }
  }
  attempts.set(address, { startedAt: now, count: 1 });
  return true;
}

export async function getAdminSetupStatus(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT EXISTS (
         SELECT 1 FROM public.users WHERE user_role = 'Admin'
       ) AS "adminExists"`,
    );
    return res.json({ setupRequired: !rows[0].adminExists });
  } catch (error) {
    return next(error);
  }
}

export async function createFirstAdmin(req, res, next) {
  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";
  if (!validEmail(email)) {
    return res.status(400).json({ message: "Enter a valid admin email address." });
  }
  if (password.length < 12 || password.length > 1024) {
    return res.status(400).json({
      message: "The admin password must be between 12 and 1024 characters.",
    });
  }

  const clientAddress = req.ip;
  if (!allowAttempt(clientAddress, loginAttempts, res, "setup")) return;

  let client;
  try {
    assertAdminSessionConfigured();
    const passwordHash = await hashPassword(password);
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [ADMIN_BOOTSTRAP_LOCK_ID]);

    const { rows: existingAdmins } = await client.query(
      `SELECT 1 FROM public.users WHERE user_role = 'Admin' LIMIT 1`,
    );
    if (existingAdmins.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Admin setup is already complete. Sign in instead.",
      });
    }

    const { rows } = await client.query(
      `INSERT INTO public.users (user_role, user_email, user_password_hash)
       VALUES ('Admin', $1, $2)
       RETURNING users_id, user_email`,
      [email, passwordHash],
    );
    await client.query("COMMIT");

    loginAttempts.delete(clientAddress);
    setAdminCookie(res, createAdminToken(rows[0].users_id));
    return res.status(201).json({ admin: { email: rows[0].user_email } });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Could not roll back first-admin setup:", rollbackError);
      }
    }
    if (error.code === "23505") {
      return res.status(409).json({ message: "An account with that email already exists." });
    }
    return next(error);
  } finally {
    client?.release();
  }
}

export async function loginAdmin(req, res, next) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password || email.length > 255 || password.length > 1024) {
    return res.status(400).json({ message: "Enter your admin email and password." });
  }

  const clientAddress = req.ip;
  if (!allowAttempt(clientAddress, loginAttempts, res, "sign-in")) return;

  try {
    const { rows } = await pool.query(
      `SELECT users_id, user_email, user_password_hash
       FROM public.users
       WHERE lower(user_email) = lower($1) AND user_role = 'Admin'`,
      [email],
    );

    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.user_password_hash))) {
      return res.status(401).json({ message: "Invalid admin email or password." });
    }

    loginAttempts.delete(clientAddress);
    setAdminCookie(res, createAdminToken(user.users_id));
    return res.json({ admin: { email: user.user_email } });
  } catch (error) {
    return next(error);
  }
}

export function logoutAdmin(req, res) {
  clearAdminCookie(res);
  return res.status(204).end();
}

export function getAdminSession(req, res) {
  return res.json({ admin: { email: req.admin.email } });
}
