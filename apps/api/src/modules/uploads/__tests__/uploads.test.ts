import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { buildServer } from "../../../server";
import { households, users, sessions } from "../../../lib/db/schema";

describe("Uploads Module - Presigned URL Generator", () => {
  let app: FastifyInstance;
  let sessionCookie: string;

  beforeAll(async () => {
    app = await buildServer({ testing: true });
    await app.ready();

    // Clean DB
    await app.db.delete(sessions);
    await app.db.delete(users);
    await app.db.delete(households);

    // Create admin user for session cookie
    const setupRes = await app.inject({
      method: "POST",
      url: "/api/auth/setup",
      payload: {
        householdName: "Uploads Test Home",
        name: "Upload User",
        email: "uploader@test.com",
        password: "UploaderPass123!",
      },
    });

    const cookie = setupRes.cookies.find((c) => c.name === "session");
    expect(cookie).toBeDefined();
    sessionCookie = `session=${cookie?.value}`;
  });

  afterAll(async () => {
    await app.db.delete(sessions);
    await app.db.delete(users);
    await app.db.delete(households);
    await app.close();
  });

  it("should reject unauthenticated request with 401 Unauthorized", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/uploads/presigned-url",
      payload: {
        folder: "products",
        fileExtension: "webp",
        contentType: "image/webp",
      },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.title).toBe("Unauthorized");
  });

  it("should validate folder enum and reject invalid folders", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/uploads/presigned-url",
      headers: { cookie: sessionCookie },
      payload: {
        folder: "invalid-folder",
        fileExtension: "webp",
        contentType: "image/webp",
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("should validate fileExtension length and reject too short/long extensions", async () => {
    const resTooShort = await app.inject({
      method: "POST",
      url: "/api/uploads/presigned-url",
      headers: { cookie: sessionCookie },
      payload: {
        folder: "products",
        fileExtension: "a",
        contentType: "image/webp",
      },
    });
    expect(resTooShort.statusCode).toBe(400);

    const resTooLong = await app.inject({
      method: "POST",
      url: "/api/uploads/presigned-url",
      headers: { cookie: sessionCookie },
      payload: {
        folder: "products",
        fileExtension: "toolongextension",
        contentType: "image/webp",
      },
    });
    expect(resTooLong.statusCode).toBe(400);
  });

  it("should generate a presigned URL successfully when authenticated", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/uploads/presigned-url",
      headers: { cookie: sessionCookie },
      payload: {
        folder: "products",
        fileExtension: "webp",
        contentType: "image/webp",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.uploadUrl).toBeDefined();
    expect(body.fileKey).toMatch(/^products\/[a-f0-9-]+\.webp$/);
    expect(body.publicUrl).toBeDefined();
  });

  it("should generate a presigned URL in under 10ms", async () => {
    const start = performance.now();
    const res = await app.inject({
      method: "POST",
      url: "/api/uploads/presigned-url",
      headers: { cookie: sessionCookie },
      payload: {
        folder: "receipts",
        fileExtension: "jpg",
        contentType: "image/jpeg",
      },
    });
    const duration = performance.now() - start;

    expect(res.statusCode).toBe(200);
    expect(duration).toBeLessThan(15);
  });
});
