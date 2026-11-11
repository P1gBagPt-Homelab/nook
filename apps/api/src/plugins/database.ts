import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Pool } from "pg";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import fs from "fs";
import * as schema from "../lib/db/schema";
import { db, pool } from "../lib/db";

declare module "fastify" {
  interface FastifyInstance {
    db: NodePgDatabase<typeof schema>;
    pgPool: Pool;
  }
}

export const databasePlugin: FastifyPluginAsync = fp(async (fastify) => {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://nook_user:NookSecretPass2026@localhost:5432/nook_db";
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is missing!");
  }

  // Verify connection immediately
  const client = await pool.connect();
  client.release();
  fastify.log.info("🐘 Connected to PostgreSQL 18 successfully");

  // Auto-apply Drizzle migrations on boot in non-test environments
  if (process.env.NODE_ENV !== "test") {
    const candidates = [
      path.resolve(__dirname, "../lib/db/migrations"),
      path.resolve(__dirname, "../../src/lib/db/migrations"),
      path.resolve(process.cwd(), "apps/api/src/lib/db/migrations"),
      path.resolve(process.cwd(), "dist/lib/db/migrations"),
      path.resolve(process.cwd(), "apps/api/dist/lib/db/migrations"),
    ];
    const migrationsFolder = candidates.find((dir) => fs.existsSync(dir));
    if (migrationsFolder) {
      fastify.log.info(`⏳ Applying migrations from ${migrationsFolder}...`);
      try {
        await migrate(db, { migrationsFolder });
        fastify.log.info("✅ Database migrations applied successfully");
      } catch (migrationErr) {
        fastify.log.error(migrationErr, "❌ Failed to apply migrations automatically");
      }
    } else {
      fastify.log.warn("⚠️ No migrations folder found, skipping auto-migration");
    }
  }

  fastify.decorate("db", db);
  fastify.decorate("pgPool", pool);

  fastify.addHook("onClose", async () => {
    await pool.end();
    fastify.log.info("PostgreSQL pool closed cleanly");
  });
});

export default databasePlugin;
