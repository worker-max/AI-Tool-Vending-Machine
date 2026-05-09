// VEND/AI — Drizzle client (Neon serverless)
//
// `db` is null when DATABASE_URL is unset. All callers check `if (!db)` and
// degrade gracefully (route handlers return 500, pages render empty state).
// We do NOT throw at module load — that breaks `next build` page-data
// collection in environments without DATABASE_URL set.

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

const sql = databaseUrl ? neon(databaseUrl) : null;

export const db = sql ? drizzle(sql, { schema }) : null;

export { schema };
