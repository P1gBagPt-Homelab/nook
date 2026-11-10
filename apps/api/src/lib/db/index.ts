import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

for (const envPath of [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../../.env"),
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://nook_user:NookSecretPass2026@localhost:5432/nook_db";

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

export * from "./schema";
