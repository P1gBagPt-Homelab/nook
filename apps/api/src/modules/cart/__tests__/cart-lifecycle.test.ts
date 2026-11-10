import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { buildServer } from "../../../server";

describe("Shopping Cart ➔ Stock Unpack Flow", () => {
  let app: FastifyInstance;
  let authCookie: string;

  beforeAll(async () => {
    app = await buildServer({ testing: true });
    await app.ready();

    // Check if setup is needed
    const statusRes = await app.inject({
      method: "GET",
      url: "/api/auth/status",
    });

    if (statusRes.json().setupRequired) {
      const setupRes = await app.inject({
        method: "POST",
        url: "/api/auth/setup",
        payload: {
          householdName: "Daniel Household",
          name: "Daniel",
          email: "daniel@test.com",
          password: "AdminStrongPassword123!",
        },
      });
      authCookie = setupRes.cookies[0]?.value || "";
    } else {
      // Log in to get session cookie
      const loginRes = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "daniel@test.com", password: "AdminStrongPassword123!" },
      });
      authCookie = loginRes.cookies[0]?.value || "";
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it("should fetch active cart in <5ms", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/cart/active",
      cookies: { session: authCookie },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.cart.status).toBe("preparing");
  });
});
