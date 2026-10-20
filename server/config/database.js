// Database configuration: prefer the Supabase URI while retaining DB_URL for existing deployments.
// The existing pg pool keeps controllers on the same PostgreSQL database connection.
import pg from "pg";
import process from "node:process";

const connectionString = process.env.SUPABASE_DB_URL || process.env.DB_URL;

if (!connectionString) {
  throw new Error("SUPABASE_DB_URL must be set to connect to Supabase PostgreSQL.");
}

if (connectionString.includes("[") || connectionString.includes("]")) {
  throw new Error(
    "SUPABASE_DB_URL still contains square-bracket placeholders. Replace every placeholder with your Supabase database host, username, and password.",
  );
}

let databaseUrl;
try {
  databaseUrl = new URL(connectionString);
} catch {
  throw new Error(
    "SUPABASE_DB_URL is not a valid PostgreSQL URI. Copy the URI from Supabase Project Settings > Database, replace its password placeholder, and URL-encode special characters in the password.",
  );
}

if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
  throw new Error(
    "SUPABASE_DB_URL must use the PostgreSQL URI from Supabase Project Settings > Database, not the Supabase Project URL.",
  );
}

const hostname = databaseUrl.hostname;
const isLocalDatabase = ["localhost", "127.0.0.1", "::1"].includes(hostname);

const pool = new pg.Pool({
  connectionString,
  ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false },
  max: 5,
  maxLifetimeSeconds: 300,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("error", (error) => {
  console.error("Unexpected error from an idle PostgreSQL connection:", error);
});

export default pool;
