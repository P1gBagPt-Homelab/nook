import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { FastifyInstance } from "fastify";
import { buildServer } from "../../../server";
import { households, users, sessions, productCatalog } from "../../../lib/db/schema";
import * as offService from "../services/open-food-facts";

describe("Catalog Module - Barcode Scanner & Product Catalog", () => {
  let app: FastifyInstance;
  let sessionCookie: string;
  let householdId: string;

  beforeAll(async () => {
    app = await buildServer({ testing: true });
    await app.ready();

    // Clean DB
    await app.db.delete(productCatalog);
    await app.db.delete(sessions);
    await app.db.delete(users);
    await app.db.delete(households);

    // Create admin user for session cookie
    const setupRes = await app.inject({
      method: "POST",
      url: "/api/auth/setup",
      payload: {
        householdName: "Catalog Test Home",
        name: "Catalog User",
        email: "catalog@test.com",
        password: "CatalogPass123!",
      },
    });

    const cookie = setupRes.cookies.find((c) => c.name === "session");
    expect(cookie).toBeDefined();
    sessionCookie = `session=${cookie?.value}`;

    const [adminUser] = await app.db.select().from(users);
    householdId = adminUser.householdId;
  });

  afterAll(async () => {
    await app.db.delete(productCatalog);
    await app.db.delete(sessions);
    await app.db.delete(users);
    await app.db.delete(households);
    await app.close();
  });

  it("should reject unauthenticated request with 401 Unauthorized", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/catalog/scan/1234567890",
    });

    expect(res.statusCode).toBe(401);
  });

  it("should create a new product via POST /api/catalog/products", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/catalog/products",
      headers: { cookie: sessionCookie },
      payload: {
        barcode: "5601009941123",
        title: "Whole Milk 1L",
        brand: "Mimosa",
        category: "Dairy",
        unit: "L",
        defaultPrice: 1.19,
        imageKey: "products/test-milk.webp",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.barcode).toBe("5601009941123");
    expect(body.title).toBe("Whole Milk 1L");
    expect(body.brand).toBe("Mimosa");
    expect(body.category).toBe("Dairy");
    expect(body.defaultPrice).toBe("1.19");
    expect(body.imageKey).toBe("products/test-milk.webp");
  });

  it("should upsert existing product on conflict via POST /api/catalog/products", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/catalog/products",
      headers: { cookie: sessionCookie },
      payload: {
        barcode: "5601009941123",
        title: "Whole Milk 1L - Updated",
        brand: "Mimosa Premium",
        category: "Dairy",
        unit: "L",
        defaultPrice: 1.29,
        imageKey: "products/test-milk-new.webp",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.title).toBe("Whole Milk 1L - Updated");
    expect(body.brand).toBe("Mimosa Premium");
    expect(body.defaultPrice).toBe("1.29");
  });

  it("should find local product in database in ultra-fast time (<10ms)", async () => {
    const start = performance.now();
    const res = await app.inject({
      method: "GET",
      url: "/api/catalog/scan/5601009941123",
      headers: { cookie: sessionCookie },
    });
    const duration = performance.now() - start;

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.source).toBe("local");
    expect(body.product.title).toBe("Whole Milk 1L - Updated");
    expect(body.product.imageUrl).toContain("products/test-milk-new.webp");
    expect(duration).toBeLessThan(10);
  });

  it("should query Open Food Facts when product is not in local catalog", async () => {
    const mockResolve = vi.spyOn(offService, "resolveOpenFoodFacts").mockResolvedValueOnce({
      barcode: "3017620422003",
      title: "Nutella Hazelnut Spread",
      brand: "Ferrero",
      category: "Spreads",
      unit: "400g",
      imageUrl: "https://images.openfoodfacts.org/nutella.jpg",
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/catalog/scan/3017620422003",
      headers: { cookie: sessionCookie },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.source).toBe("openfoodfacts");
    expect(body.product.title).toBe("Nutella Hazelnut Spread");
    expect(body.product.brand).toBe("Ferrero");
    expect(body.product.imageUrl).toBe("https://images.openfoodfacts.org/nutella.jpg");

    mockResolve.mockRestore();
  });

  it("should return 404 when product is neither local nor on Open Food Facts", async () => {
    const mockResolve = vi.spyOn(offService, "resolveOpenFoodFacts").mockResolvedValueOnce(null);

    const res = await app.inject({
      method: "GET",
      url: "/api/catalog/scan/0000000000000",
      headers: { cookie: sessionCookie },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.source).toBe("not_found");
    expect(body.barcode).toBe("0000000000000");
    expect(body.message).toContain("Product not in catalog");

    mockResolve.mockRestore();
  });

  it("should list products for the household via GET /api/catalog/products", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/catalog/products",
      headers: { cookie: sessionCookie },
    });

    expect(res.statusCode).toBe(200);
    const list = res.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0].barcode).toBe("5601009941123");
  });

  it("should validate product input and reject invalid payload with 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/catalog/products",
      headers: { cookie: sessionCookie },
      payload: {
        barcode: "", // Invalid: min 4
        title: "", // Invalid: min 1
      },
    });

    expect(res.statusCode).toBe(400);
  });
});
