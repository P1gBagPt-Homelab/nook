import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { buildServer } from "../../server";
import { households } from "../../lib/db/schema";
import { sql } from "drizzle-orm";

describe("Database Plugin & Drizzle ORM", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ testing: true });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should register db and pgPool on Fastify instance", () => {
    expect(app.db).toBeDefined();
    expect(app.pgPool).toBeDefined();
  });

  it("should verify health check endpoint responds alive", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/healthz",
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "alive" });
  });

  it("should query households via Drizzle with high performance", async () => {
    // Warm-up query
    await app.db.select().from(households).limit(1);

    // Timed performance test
    const start = performance.now();
    const rows = await app.db.select().from(households);
    const duration = performance.now() - start;

    expect(Array.isArray(rows)).toBe(true);
    console.log(`Drizzle SELECT execution time: ${duration.toFixed(3)}ms`);
    expect(duration).toBeLessThan(50); // Generous assertion for CI / local virtualization
  });

  it("should verify all core tables exist in database schema", async () => {
    const result = await app.db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tableNames = result.rows.map((r: any) => r.table_name);
    expect(tableNames).toContain("households");
    expect(tableNames).toContain("users");
    expect(tableNames).toContain("sessions");
    expect(tableNames).toContain("product_catalog");
    expect(tableNames).toContain("shopping_lists");
    expect(tableNames).toContain("shopping_items");
    expect(tableNames).toContain("stock_items");
    expect(tableNames).toContain("expenses");
    expect(tableNames).toContain("expense_categories");
  });
});
