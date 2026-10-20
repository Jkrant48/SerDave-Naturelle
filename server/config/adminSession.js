// Admin endpoints use a signed, HTTP-only cookie instead of browser-stored tokens.
import { createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import process from "node:process";
import pool from "./database.js";

export const ADMIN_COOKIE_NAME = "serdave_admin";
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

function cookieSameSite() {
  return process.env.ADMIN_COOKIE_SAME_SITE ||
    (process.env.NODE_ENV === "production" ? "none" : "lax");
}

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

export function assertAdminSessionConfigured() {
  sessionSecret();
  const sameSite = cookieSameSite();
  const secure =
    process.env.NODE_ENV === "production" ||
    process.env.ADMIN_COOKIE_SECURE === "true";
  if (!["lax", "strict", "none"].includes(sameSite)) {
    throw new Error("ADMIN_COOKIE_SAME_SITE must be lax, strict, or none.");
  }
  if (sameSite === "none" && !secure) {
    throw new Error("SameSite=None admin cookies require NODE_ENV=production.");
  }
}

function sign(payload) {
  return createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
}

export function createAdminToken(userId) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function getCookie(req, cookieName) {
  const cookieHeader = req.headers.cookie || "";
  const prefix = `${cookieName}=`;
  const item = cookieHeader.split(";").map((part) => part.trim()).find((part) =>
    part.startsWith(prefix),
  );
  if (!item) {
    return null;
  }
  try {
    return decodeURIComponent(item.slice(prefix.length));
  } catch {
    return null;
  }
}

function verifyAdminToken(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = Buffer.from(sign(payload));
  const actualSignature = Buffer.from(signature);
  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    return null;
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (
      !Number.isInteger(claims.sub) ||
      !Number.isInteger(claims.exp) ||
      claims.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

export function setAdminCookie(res, token) {
  const secure =
    process.env.NODE_ENV === "production" ||
    process.env.ADMIN_COOKIE_SECURE === "true";
  const sameSite = cookieSameSite();
  assertAdminSessionConfigured();
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: ADMIN_SESSION_SECONDS * 1000,
    path: "/api/admin",
  });
}

export function clearAdminCookie(res) {
  res.clearCookie(ADMIN_COOKIE_NAME, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" ||
      process.env.ADMIN_COOKIE_SECURE === "true",
    sameSite: cookieSameSite(),
    path: "/api/admin",
  });
}

export function requireSameOrigin(req, res, next) {
  const origin = req.get("origin");
  if (
    origin &&
    origin !== (process.env.CLIENT_URL || "http://localhost:5173")
  ) {
    return res.status(403).json({ message: "Request origin is not allowed." });
  }
  return next();
}

export async function requireAdmin(req, res, next) {
  try {
    if (req.method !== "GET") {
      const origin = req.get("origin");
      if (
        origin &&
        origin !== (process.env.CLIENT_URL || "http://localhost:5173")
      ) {
        return res.status(403).json({ message: "Request origin is not allowed." });
      }
    }

    const token = getCookie(req, ADMIN_COOKIE_NAME);
    const claims = token && verifyAdminToken(token);
    if (!claims) {
      return res.status(401).json({ message: "Admin login required." });
    }

    const { rows } = await pool.query(
      `SELECT users_id, user_email
       FROM public.users
       WHERE users_id = $1 AND user_role = 'Admin'`,
      [claims.sub],
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: "Admin login required." });
    }

    req.admin = { id: rows[0].users_id, email: rows[0].user_email };
    return next();
  } catch (error) {
    return next(error);
  }
}
