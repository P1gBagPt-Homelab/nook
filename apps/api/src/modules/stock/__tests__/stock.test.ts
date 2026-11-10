import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { buildServer } from "../../../server";
import {
  households,
  users,
  sessions,
  productCatalog,
  stockItems,
} from "../../../lib/db/schema";
import { eq } from "drizzle-orm";

describe("Stock Module - Household Inventory Management", () => {
  let app: FastifyInstance;
  let sessionCookie: string;
  let householdId: string;
  let testProductId1: string;
  let testProductId2: string;

  beforeAll(async () => {
    app = await buildServer({ testing: true });
    await app.ready();

    // Clean DB
    await app.db.delete(stockItems);
    await app.db.delete(productCatalog);
    await app.db.delete(sessions);
    await app.db.delete(users);
    await app.db.delete(households);

    // Setup admin user
    const setupRes = await app.inject({
      method: "POST",
      url: "/api/auth/setup",
      payload: {
        householdName: "Stock Test Home",
        name: "Stock Admin",
        email: "stock@test.com",
        password: "StockPassword123!",
      },
    });

    const cookie = setupRes.cookies.find((c) => c.name === "session");
    sessionCookie = `session=${cookie?.value}`;

    const [adminUser] = await app.db.select().from(users);
    householdId = adminUser.householdId;

    // Create 2 test catalog products
    const [p1] = await app.db
      .insert(productCatalog)
      .values({
        householdId,
        barcode: "999111222",
        title: "Greek Yogurt",
        brand: "Fage",
        category: "Dairy",
        unit: "g",
      })
      .returning();

    const [p2] = await app.db
      .insert(productCatalog)
      .values({
        householdId,
        barcode: "999333444",
        title: "Basmati Rice",
        brand: "Tilda",
        category: "Pantry",
        unit: "kg",
      })
      .returning();

    testProductId1 = p1.id;
    testProductId2 = p2.id;
  });

  afterAll(async () => {
    await app.db.delete(stockItems);
    await app.db.delete(productCatalog);
    await app.db.delete(sessions);
    await app.db.delete(users);
    await app.db.delete(households);
    await app.close();
  });

  it("should reject unauthenticated request with 401 Unauthorized", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stock",
    });

    expect(res.statusCode).toBe(401);
  });

  it("should return empty list when no stock items exist", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stock",
      headers: { cookie: sessionCookie },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it("should add a product directly to stock via POST /api/stock", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/stock",
      headers: { cookie: sessionCookie },
      payload: {
        productId: testProductId1,
        location: "Fridge",
        status: "in_stock",
        quantity: 2,
        unit: "cups",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.productId).toBe(testProductId1);
    expect(body.location).toBe("Fridge");
    expect(body.status).toBe("in_stock");
    expect(parseFloat(body.quantity)).toBe(2);
  });

  it("should increment quantity when adding the same product again via POST /api/stock", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/stock",
      headers: { cookie: sessionCookie },
      payload: {
        productId: testProductId1,
        quantity: 3,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(parseFloat(body.quantity)).toBe(5);
    expect(body.location).toBe("Fridge");
  });

  it("should add a second product in Dry Pantry", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/stock",
      headers: { cookie: sessionCookie },
      payload: {
        productId: testProductId2,
        location: "Pantry",
        status: "in_stock",
        quantity: 1,
        unit: "kg",
      },
    });

    expect(res.statusCode).toBe(201);
  });

  it("should list stock items with productCatalog details", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stock",
      headers: { cookie: sessionCookie },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.length).toBe(2);

    const yogurt = body.find((i: any) => i.productId === testProductId1);
    expect(yogurt).toBeDefined();
    expect(yogurt.title).toBe("Greek Yogurt");
    expect(yogurt.brand).toBe("Fage");
    expect(yogurt.location).toBe("Fridge");
  });

  it("should filter stock by location", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stock?location=Fridge",
      headers: { cookie: sessionCookie },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.length).toBe(1);
    expect(body[0].productId).toBe(testProductId1);
  });

  it("should update stock status and quantity via PATCH /api/stock/:id", async () => {
    const listRes = await app.inject({
      method: "GET",
      url: "/api/stock",
      headers: { cookie: sessionCookie },
    });
    const yogurt = listRes.json().find((i: any) => i.productId === testProductId1);

    const updateRes = await app.inject({
      method: "PATCH",
      url: `/api/stock/${yogurt.id}`,
      headers: { cookie: sessionCookie },
      payload: {
        status: "running_low",
        quantity: 1,
      },
    });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.json().status).toBe("running_low");
    expect(parseFloat(updateRes.json().quantity)).toBe(1);

    // Filter by status running_low
    const filterRes = await app.inject({
      method: "GET",
      url: "/api/stock?status=running_low",
      headers: { cookie: sessionCookie },
    });
    expect(filterRes.json().length).toBe(1);
    expect(filterRes.json()[0].id).toBe(yogurt.id);
  });

  it("should delete stock item via DELETE /api/stock/:id", async () => {
    const listRes = await app.inject({
      method: "GET",
      url: "/api/stock",
      headers: { cookie: sessionCookie },
    });
    const itemToDelete = listRes.json()[0];

    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/stock/${itemToDelete.id}`,
      headers: { cookie: sessionCookie },
    });

    expect(delRes.statusCode).toBe(204);

    const verifyRes = await app.inject({
      method: "GET",
      url: "/api/stock",
      headers: { cookie: sessionCookie },
    });
    expect(verifyRes.json().length).toBe(1);
  });
});
