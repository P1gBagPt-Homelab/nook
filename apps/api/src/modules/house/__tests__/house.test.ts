import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { buildServer } from "../../../server";
import {
  assets,
  chores,
  households,
  maintenanceTasks,
  sessions,
  shoppingItems,
  shoppingLists,
  users,
} from "../../../lib/db/schema";

describe("House Management Module - Assets, Maintenance & Chores", () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let adminId: string;

  async function cleanDb() {
    await app.db.delete(chores);
    await app.db.delete(maintenanceTasks);
    await app.db.delete(assets);
    await app.db.delete(shoppingItems);
    await app.db.delete(shoppingLists);
    await app.db.delete(sessions);
    await app.db.delete(users);
    await app.db.delete(households);
  }

  beforeAll(async () => {
    app = await buildServer({ testing: true });
    await app.ready();
    await cleanDb();

    const setupRes = await app.inject({
      method: "POST",
      url: "/api/auth/setup",
      payload: {
        householdName: "House Test Home",
        name: "Daniel",
        email: "daniel-house@test.com",
        password: "HousePassword123!",
      },
    });
    expect(setupRes.statusCode).toBe(201);
    adminId = setupRes.json().user.id;
    adminCookie = `session=${setupRes.cookies.find((c) => c.name === "session")?.value}`;
  });

  afterAll(async () => {
    await cleanDb();
    await app.close();
  });

  it("should reject unauthenticated requests with 401", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/house/assets",
    });
    expect(res.statusCode).toBe(401);
  });

  let assetId = "";

  it("should register an appliance asset with PDF manualKey and QR token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/house/assets",
      headers: { cookie: adminCookie },
      payload: {
        name: "Bosch Dishwasher",
        roomLocation: "Kitchen",
        brand: "Bosch",
        model: "SMS6ZCI49E",
        serialNumber: "SN-998877",
        manualKey: "manuals/bosch-dishwasher.pdf",
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    assetId = body.id;
    expect(body.qrCodeToken).toMatch(/^nook_asset_/);
    expect(body.manualUrl).toContain("manuals/bosch-dishwasher.pdf");

    const listRes = await app.inject({
      method: "GET",
      url: "/api/house/assets",
      headers: { cookie: adminCookie },
    });
    expect(listRes.statusCode).toBe(200);
    expect(listRes.json().length).toBe(1);
    expect(listRes.json()[0].id).toBe(assetId);
  });

  let taskId = "";

  it("should create a due maintenance timer and surface it in /maintenance/due", async () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    const createRes = await app.inject({
      method: "POST",
      url: "/api/house/maintenance",
      headers: { cookie: adminCookie },
      payload: {
        assetId,
        title: "Replace Water Filter",
        intervalDays: 90,
        nextDueDate: yesterday,
        replacementPartTitle: "Bosch UltraClarity Filter",
      },
    });
    expect(createRes.statusCode).toBe(201);
    taskId = createRes.json().id;
    expect(createRes.json().isDue).toBe(true);

    const dueRes = await app.inject({
      method: "GET",
      url: "/api/house/maintenance/due",
      headers: { cookie: adminCookie },
    });
    expect(dueRes.statusCode).toBe(200);
    expect(dueRes.json().length).toBe(1);
    expect(dueRes.json()[0].assetName).toBe("Bosch Dishwasher");
  });

  it("should queue replacement part directly into the active shopping cart", async () => {
    const queueRes = await app.inject({
      method: "POST",
      url: `/api/house/maintenance/${taskId}/queue-replacement`,
      headers: { cookie: adminCookie },
    });
    expect(queueRes.statusCode).toBe(201);
    expect(queueRes.json().success).toBe(true);
    expect(queueRes.json().item.customTitle).toBe("Bosch UltraClarity Filter");

    const cartRes = await app.inject({
      method: "GET",
      url: "/api/cart/active",
      headers: { cookie: adminCookie },
    });
    expect(cartRes.statusCode).toBe(200);
    const items = cartRes.json().items;
    expect(items.some((i: any) => i.customTitle === "Bosch UltraClarity Filter")).toBe(true);
  });

  it("should log maintenance completion and advance nextDueDate", async () => {
    const completeRes = await app.inject({
      method: "POST",
      url: `/api/house/maintenance/${taskId}/complete`,
      headers: { cookie: adminCookie },
    });
    expect(completeRes.statusCode).toBe(200);
    expect(completeRes.json().lastCompletedAt).toBeDefined();
    expect(completeRes.json().isDue).toBe(false);
    expect(completeRes.json().daysUntilDue).toBeGreaterThanOrEqual(89);

    const dueRes = await app.inject({
      method: "GET",
      url: "/api/house/maintenance/due",
      headers: { cookie: adminCookie },
    });
    expect(dueRes.json().length).toBe(0);
  });

  let choreId = "";

  it("should create, toggle (with streak), and delete a household chore", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: "/api/house/chores",
      headers: { cookie: adminCookie },
      payload: {
        title: "Take out recycling",
        cadence: "weekly",
        assignedToUserId: adminId,
      },
    });
    expect(createRes.statusCode).toBe(201);
    choreId = createRes.json().id;
    expect(createRes.json().assignedToName).toBe("Daniel");
    expect(createRes.json().streakCount).toBe(0);

    const toggleOn = await app.inject({
      method: "PATCH",
      url: `/api/house/chores/${choreId}/toggle`,
      headers: { cookie: adminCookie },
      payload: {},
    });
    expect(toggleOn.statusCode).toBe(200);
    expect(toggleOn.json().isCompleted).toBe(true);
    expect(toggleOn.json().streakCount).toBe(1);

    const toggleOff = await app.inject({
      method: "PATCH",
      url: `/api/house/chores/${choreId}/toggle`,
      headers: { cookie: adminCookie },
      payload: {},
    });
    expect(toggleOff.statusCode).toBe(200);
    expect(toggleOff.json().isCompleted).toBe(false);
    expect(toggleOff.json().streakCount).toBe(0);

    const delChore = await app.inject({
      method: "DELETE",
      url: `/api/house/chores/${choreId}`,
      headers: { cookie: adminCookie },
    });
    expect(delChore.statusCode).toBe(204);
  });

  it("should delete appliance asset cleanly", async () => {
    const delAsset = await app.inject({
      method: "DELETE",
      url: `/api/house/assets/${assetId}`,
      headers: { cookie: adminCookie },
    });
    expect(delAsset.statusCode).toBe(204);

    const maintList = await app.inject({
      method: "GET",
      url: "/api/house/maintenance",
      headers: { cookie: adminCookie },
    });
    expect(maintList.json().length).toBe(0);
  });
});
