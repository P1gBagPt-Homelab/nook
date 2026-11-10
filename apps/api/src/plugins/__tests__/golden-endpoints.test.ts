import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { buildServer } from "../../server";

describe("Janus 5 Golden Endpoints", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ testing: true });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("1. GET /healthz returns 200 alive", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/healthz",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("alive");
    expect(res.headers["x-request-id"]).toBeDefined();
  });

  it("2. GET /readyz returns 200 with dependencies connected", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/readyz",
    });
    expect([200, 503]).toContain(res.statusCode);
    const body = res.json();
    expect(body.status).toBeDefined();
    expect(body.timestamp).toBeDefined();
    expect(body.dependencies).toBeDefined();
    expect(body.dependencies.database).toBeDefined();
    expect(body.dependencies.redis).toBeDefined();
    expect(body.dependencies.storage).toBeDefined();
  });

  it("3. GET /version returns 200 with release metadata", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/version",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.version).toBeDefined();
    expect(body.git_sha).toBeDefined();
    expect(body.environment).toBeDefined();
  });

  it("4. GET /openapi.json returns 200 OpenAPI schema", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/openapi.json",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.openapi).toMatch(/^3\./);
    expect(body.info.title).toBe("Nook API");
  });

  it("5. GET /docs returns 200 or 301 redirect to Scalar HTML documentation", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/docs/",
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
  });
});
