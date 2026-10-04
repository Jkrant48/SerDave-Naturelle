// Database configuration: one shared PostgreSQL pool is reused by controllers.
import pg from "pg";
import process from "node:process";

const connectionString = process.env.DB_URL;

if (!connectionString) {
  throw new Error("DB_URL must be set to connect to PostgreSQL.");
}

const hostname = new URL(connectionString).hostname;
const isLocalDatabase = ["localhost", "127.0.0.1", "::1"].includes(hostname);

const pool = new pg.Pool({
  connectionString,
  ssl: isLocalDatabase ? undefined : { rejectUnauthorized: true },
  connectionTimeoutMillis: 10000,
});

export default pool;
