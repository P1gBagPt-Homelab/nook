import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { buildServer } from "../../../server";
import {
  households,
  users,
  sessions,
  productCatalog,
  shoppingLists,
  shoppingItems,
  stockItems,
  expenses,
  expenseCategories,
} from "../../../lib/db/schema";
import { eq } from "drizzle-orm";

describe("Cart Module - Shopping Cart Lifecycle", () => {
  let app: FastifyInstance;
  let sessionCookie: string;
  let householdId: string;
  let testProductId: string;

  beforeAll(async () => {
    app = await buildServer({ testing: true });
    await app.ready();

    // Clean DB in dependency order
    await app.db.delete(expenses);
    await app.db.delete(expenseCategories);
    await app.db.delete(stockItems);
    await app.db.delete(shoppingItems);
    await app.db.delete(shoppingLists);
    await app.db.delete(productCatalog);
    await app.db.delete(sessions);
    await app.db.delete(users);
    await app.db.delete(households);

    // Setup admin user
    const setupRes = await app.inject({
      method: "POST",
      url: "/api/auth/setup",
      payload: {
        householdName: "Cart Test Home",
        name: "Cart User",
        email: "cart@test.com",
        password: "CartPassword123!",
      },
    });

    const cookie = setupRes.cookies.find((c) => c.name === "session");
    expect(cookie).toBeDefined();
    sessionCookie = `session=${cookie?.value}`;

    const [adminUser] = await app.db.select().from(users);
    householdId = adminUser.householdId;

    // Create a catalog product for tests
    const [product] = await app.db
      .insert(productCatalog)
      .values({
        householdId,
        barcode: "111222333444",
        title: "Organic Oat Milk",
        brand: "Oatly",
        category: "Dairy",
        unit: "L",
        defaultPrice: "2.49",
      })
      .returning();

    testProductId = product.id;
  });

  afterAll(async () => {
    await app.db.delete(expenses);
    await app.db.delete(expenseCategories);
    await app.db.delete(stockItems);
    await app.db.delete(shoppingItems);
    await app.db.delete(shoppingLists);
    await app.db.delete(productCatalog);
    await app.db.delete(sessions);
    await app.db.delete(users);
    await app.db.delete(households);
    await app.close();
  });

  it("should reject unauthenticated request with 401 Unauthorized", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/cart/active",
    });

    expect(res.statusCode).toBe(401);
  });

  it("should get or automatically create active shopping cart", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/cart/active",
      headers: { cookie: sessionCookie },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.cart).toBeDefined();
    expect(body.cart.status).toBe("preparing");
    expect(body.cart.householdId).toBe(householdId);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBe(0);
  });

  it("should add a product item to the cart", async () => {
    const activeRes = await app.inject({
      method: "GET",
      url: "/api/cart/active",
      headers: { cookie: sessionCookie },
    });
    const cartId = activeRes.json().cart.id;

    const res = await app.inject({
      method: "POST",
      url: "/api/cart/items",
      headers: { cookie: sessionCookie },
      payload: {
        listId: cartId,
        productId: testProductId,
        quantity: 2,
        estimatedPrice: 2.49,
        targetLocation: "Fridge",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.productId).toBe(testProductId);
    expect(parseFloat(body.quantity)).toBe(2);
    expect(body.targetLocation).toBe("Fridge");
    expect(body.isCollected).toBe(false);
  });

  it("should add a custom title item without productId to the cart", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/cart/items",
      headers: { cookie: sessionCookie },
      payload: {
        customTitle: "Fresh Sourdough Bread",
        quantity: 1,
        unit: "loaf",
        estimatedPrice: 3.5,
        targetLocation: "Pantry",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.customTitle).toBe("Fresh Sourdough Bread");
    expect(body.productId).toBeNull();
  });

  it("should list added items in GET /api/cart/active with catalog details", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/cart/active",
      headers: { cookie: sessionCookie },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBe(2);

    const catalogItem = body.items.find((i: any) => i.productId === testProductId);
    expect(catalogItem).toBeDefined();
    expect(catalogItem.productTitle).toBe("Organic Oat Milk");
    expect(catalogItem.brand).toBe("Oatly");
  });

  it("should toggle item collected status via PATCH /api/cart/items/:id/collect", async () => {
    const activeRes = await app.inject({
      method: "GET",
      url: "/api/cart/active",
      headers: { cookie: sessionCookie },
    });
    const item = activeRes.json().items.find((i: any) => i.productId === testProductId);

    const collectRes = await app.inject({
      method: "PATCH",
      url: `/api/cart/items/${item.id}/collect`,
      headers: { cookie: sessionCookie },
      payload: { isCollected: true },
    });

    expect(collectRes.statusCode).toBe(200);
    expect(collectRes.json().isCollected).toBe(true);
    expect(collectRes.json().collectedAt).toBeDefined();
  });

  it("should update item quantity via PATCH /api/cart/items/:id", async () => {
    const activeRes = await app.inject({
      method: "GET",
      url: "/api/cart/active",
      headers: { cookie: sessionCookie },
    });
    const item = activeRes.json().items.find((i: any) => i.productId === testProductId);

    const updateRes = await app.inject({
      method: "PATCH",
      url: `/api/cart/items/${item.id}`,
      headers: { cookie: sessionCookie },
      payload: { quantity: 3 },
    });

    expect(updateRes.statusCode).toBe(200);
    expect(parseFloat(updateRes.json().quantity)).toBe(3);
  });

  it("should delete an item via DELETE /api/cart/items/:id", async () => {
    const activeRes = await app.inject({
      method: "GET",
      url: "/api/cart/active",
      headers: { cookie: sessionCookie },
    });
    const customItem = activeRes.json().items.find((i: any) => i.productId === null);

    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/cart/items/${customItem.id}`,
      headers: { cookie: sessionCookie },
    });

    expect(delRes.statusCode).toBe(204);

    const verifyRes = await app.inject({
      method: "GET",
      url: "/api/cart/active",
      headers: { cookie: sessionCookie },
    });
    expect(verifyRes.json().items.length).toBe(1);
  });

  it("should unpack collected items into stock via POST /api/cart/:id/unpack", async () => {
    const activeRes = await app.inject({
      method: "GET",
      url: "/api/cart/active",
      headers: { cookie: sessionCookie },
    });
    const cartId = activeRes.json().cart.id;

    const unpackRes = await app.inject({
      method: "POST",
      url: `/api/cart/${cartId}/unpack`,
      headers: { cookie: sessionCookie },
      payload: {
        transferAll: true,
        logExpense: true,
        totalAmount: 7.47,
      },
    });

    expect(unpackRes.statusCode).toBe(200);
    expect(unpackRes.json().success).toBe(true);
    expect(unpackRes.json().unpackedCount).toBe(1);

    // Verify stock item created
    const stock = await app.db
      .select()
      .from(stockItems)
      .where(eq(stockItems.householdId, householdId));
    expect(stock.length).toBe(1);
    expect(stock[0].productId).toBe(testProductId);
    expect(parseFloat(stock[0].quantity)).toBe(3);
    expect(stock[0].status).toBe("in_stock");
    expect(stock[0].location).toBe("Fridge");

    // Verify expense logged
    const loggedExpenses = await app.db
      .select()
      .from(expenses)
      .where(eq(expenses.householdId, householdId));
    expect(loggedExpenses.length).toBe(1);
    expect(loggedExpenses[0].title).toBe("Supermarket Trip");
    expect(loggedExpenses[0].amount).toBe("7.47");

    // Verify active cart is now completed and calling GET /api/cart/active creates a fresh cart
    const newCartRes = await app.inject({
      method: "GET",
      url: "/api/cart/active",
      headers: { cookie: sessionCookie },
    });
    expect(newCartRes.json().cart.id).not.toBe(cartId);
    expect(newCartRes.json().items.length).toBe(0);
  });

  it("should increment existing stock item quantity on subsequent unpack", async () => {
    // Add same product again to new active cart
    const activeRes = await app.inject({
      method: "GET",
      url: "/api/cart/active",
      headers: { cookie: sessionCookie },
    });
    const newCartId = activeRes.json().cart.id;

    const addRes = await app.inject({
      method: "POST",
      url: "/api/cart/items",
      headers: { cookie: sessionCookie },
      payload: {
        listId: newCartId,
        productId: testProductId,
        quantity: 2,
        targetLocation: "Fridge",
      },
    });
    const itemId = addRes.json().id;

    // Collect it
    await app.inject({
      method: "PATCH",
      url: `/api/cart/items/${itemId}/collect`,
      headers: { cookie: sessionCookie },
      payload: { isCollected: true },
    });

    // Unpack it
    await app.inject({
      method: "POST",
      url: `/api/cart/${newCartId}/unpack`,
      headers: { cookie: sessionCookie },
      payload: {},
    });

    // Check stock was incremented from 3.00 to 5
    const stock = await app.db
      .select()
      .from(stockItems)
      .where(eq(stockItems.householdId, householdId));
    expect(stock.length).toBe(1);
    expect(parseFloat(stock[0].quantity)).toBe(5);
  });
});
