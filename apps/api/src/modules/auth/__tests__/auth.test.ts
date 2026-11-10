import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { buildServer } from "../../../server";
import { households, users, sessions } from "../../../lib/db/schema";
import { eq } from "drizzle-orm";

describe("Auth & Admin Setup Flow", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ testing: true });
    await app.ready();

    // Clean DB before tests
    await app.db.delete(sessions);
    await app.db.delete(users);
    await app.db.delete(households);
  });

  afterAll(async () => {
    // Clean up
    await app.db.delete(sessions);
    await app.db.delete(users);
    await app.db.delete(households);
    await app.close();
  });

  it("1. GET /api/auth/status should report setupRequired = true on fresh DB", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/status",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.initialized).toBe(false);
    expect(body.setupRequired).toBe(true);
  });

  let adminSessionCookie = "";
  let householdId = "";
  let adminId = "";

  it("2. POST /api/auth/setup should create Admin + Household and issue session cookie", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/setup",
      payload: {
        householdName: "Janus Penthouse",
        name: "Daniel Admin",
        email: "admin@janus.test",
        password: "AdminPassword123!",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user.email).toBe("admin@janus.test");
    expect(body.user.name).toBe("Daniel Admin");
    expect(body.user.role).toBe("admin");
    expect(body.user.householdId).toBeDefined();

    householdId = body.user.householdId;
    adminId = body.user.id;

    // Cookie header verification
    const cookies = res.cookies;
    const sessionCookie = cookies.find((c) => c.name === "session");
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).toBeTruthy();
    expect(sessionCookie?.httpOnly).toBe(true);
    adminSessionCookie = `session=${sessionCookie?.value}`;
  });

  it("3. GET /api/auth/status should now report initialized = true and setupRequired = false", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/status",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.initialized).toBe(true);
    expect(body.setupRequired).toBe(false);
  });

  it("4. POST /api/auth/setup second call should be blocked with 403 Forbidden", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/setup",
      payload: {
        householdName: "Intruder Nook",
        name: "Hacker",
        email: "hacker@test.com",
        password: "SomePassword123!",
      },
    });

    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.type).toBe("https://nook.app/errors/already-initialized");
  });

  it("5. GET /api/auth/me should return admin profile with valid session", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: {
        cookie: adminSessionCookie,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.id).toBe(adminId);
    expect(body.user.email).toBe("admin@janus.test");
    expect(body.user.role).toBe("admin");
  });

  it("6. GET /api/auth/me should reject request without session cookie", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/me",
    });

    expect(res.statusCode).toBe(401);
  });

  it("7. POST /api/auth/login should authenticate admin and issue a new session", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "admin@janus.test",
        password: "AdminPassword123!",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.email).toBe("admin@janus.test");
    expect(body.user.role).toBe("admin");

    const sessionCookie = res.cookies.find((c) => c.name === "session");
    expect(sessionCookie).toBeDefined();
  });

  it("8. POST /api/auth/login should reject invalid password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "admin@janus.test",
        password: "WrongPassword999!",
      },
    });

    expect(res.statusCode).toBe(401);
  });

  let inviteToken = "";

  it("9. POST /api/auth/invite should allow Admin to invite a new household member", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/invite",
      headers: {
        cookie: adminSessionCookie,
      },
      payload: {
        email: "member@janus.test",
        name: "Sarah Member",
        role: "member",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.userId).toBeDefined();
    expect(body.inviteToken).toMatch(/^act_/);
    expect(body.inviteUrl).toContain(body.inviteToken);
    inviteToken = body.inviteToken;
  });

  it("10. POST /api/auth/invite should reject non-admin users or unauthenticated calls", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/invite",
      payload: {
        email: "other@janus.test",
        name: "Other User",
      },
    });

    expect(res.statusCode).toBe(401);
  });

  let memberSessionCookie = "";

  it("11. POST /api/auth/set-password should set password for invited member and log them in", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/set-password",
      payload: {
        token: inviteToken,
        password: "MemberSecretPassword123!",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);

    const sessionCookie = res.cookies.find((c) => c.name === "session");
    expect(sessionCookie).toBeDefined();
    memberSessionCookie = `session=${sessionCookie?.value}`;

    // Verify member can now fetch /me
    const meRes = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: {
        cookie: memberSessionCookie,
      },
    });

    expect(meRes.statusCode).toBe(200);
    const meBody = meRes.json();
    expect(meBody.user.email).toBe("member@janus.test");
    expect(meBody.user.role).toBe("member");
    expect(meBody.user.mustSetPassword).toBe(false);
  });

  it("12. Member with role 'member' should be forbidden from calling POST /api/auth/invite", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/invite",
      headers: {
        cookie: memberSessionCookie,
      },
      payload: {
        email: "intruder@janus.test",
        name: "Intruder",
      },
    });

    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.type).toBe("https://nook.app/errors/forbidden");
  });

  it("13. POST /api/auth/logout should clear session and revoke token", async () => {
    const logoutRes = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: {
        cookie: memberSessionCookie,
      },
    });

    expect(logoutRes.statusCode).toBe(200);

    // Verify old session no longer works
    const meRes = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: {
        cookie: memberSessionCookie,
      },
    });

    expect(meRes.statusCode).toBe(401);
  });
});
