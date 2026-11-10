import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Pool } from "pg";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../lib/db/schema";
import { db, pool } from "../lib/db";

declare module "fastify" {
  interface FastifyInstance {
    db: NodePgDatabase<typeof schema>;
    pgPool: Pool;
  }
}

export const databasePlugin: FastifyPluginAsync = fp(async (fastify) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is missing!");
  }

  // Verify connection immediately
  const client = await pool.connect();
  client.release();
  fastify.log.info("🐘 Connected to PostgreSQL 18 successfully");

  fastify.decorate("db", db);
  fastify.decorate("pgPool", pool);

  fastify.addHook("onClose", async () => {
    await pool.end();
    fastify.log.info("PostgreSQL pool closed cleanly");
  });
});

export default databasePlugin;
