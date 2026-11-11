import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { buildServer } from "../../../server";
import {
  expenseCategories,
  expenses,
  expenseSettlements,
  households,
  sessions,
  subscriptions,
  users,
} from "../../../lib/db/schema";

describe("Finance Module - Budgets, Expenses, Subscriptions & Split Ledger", () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let memberCookie: string;
  let adminId: string;
  let memberId: string;
  let householdId: string;

  async function cleanDb() {
    await app.db.delete(expenseSettlements);
    await app.db.delete(expenses);
    await app.db.delete(subscriptions);
    await app.db.delete(expenseCategories);
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
        householdName: "Finance Test Home",
        name: "Daniel",
        email: "daniel-fin@test.com",
        password: "FinancePassword123!",
      },
    });
    expect(setupRes.statusCode).toBe(201);
    adminId = setupRes.json().user.id;
    householdId = setupRes.json().user.householdId;
    adminCookie = `session=${setupRes.cookies.find((c) => c.name === "session")?.value}`;

    // Invite second household member Sarah
    const inviteRes = await app.inject({
      method: "POST",
      url: "/api/auth/invite",
      headers: { cookie: adminCookie },
      payload: {
        name: "Sarah",
        email: "sarah-fin@test.com",
        role: "member",
      },
    });
    expect(inviteRes.statusCode).toBe(201);
    memberId = inviteRes.json().userId;
    const inviteToken = inviteRes.json().inviteToken;

    const joinRes = await app.inject({
      method: "POST",
      url: "/api/auth/set-password",
      payload: {
        token: inviteToken,
        password: "SarahPassword123!",
      },
    });
    expect(joinRes.statusCode).toBe(200);
    memberCookie = `session=${joinRes.cookies.find((c) => c.name === "session")?.value}`;
  });

  afterAll(async () => {
    await cleanDb();
    await app.close();
  });

  it("should reject unauthenticated requests with 401", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/finance/overview",
    });
    expect(res.statusCode).toBe(401);
  });

  it("should list household members via GET /api/auth/members", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/members",
      headers: { cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().members.length).toBe(2);
  });

  it("should configure household monthly budget cap", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/finance/budget",
      headers: { cookie: adminCookie },
      payload: { monthlyBudget: 500, currency: "EUR" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().monthlyBudget).toBe(500);
    expect(res.json().currency).toBe("EUR");
  });

  let groceriesCatId = "";

  it("should auto-seed and list default expense categories", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/finance/categories",
      headers: { cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const cats = res.json();
    expect(cats.length).toBeGreaterThanOrEqual(4);
    groceriesCatId = cats.find((c: any) => c.name === "Groceries").id;
  });

  let expenseId = "";

  it("should log a split expense with a MinIO receiptKey", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/finance/expenses",
      headers: { cookie: adminCookie },
      payload: {
        title: "Organic Market Run",
        amount: 60.0,
        categoryId: groceriesCatId,
        receiptKey: "receipts/test-receipt.webp",
        isSplit: true,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expenseId = body.id;
    expect(body.receiptKey).toBe("receipts/test-receipt.webp");
    expect(body.receiptUrl).toContain("receipts/test-receipt.webp");
    expect(body.isSplit).toBe(true);
    expect(body.paidByUserId).toBe(adminId);
  });

  it("should log a second split expense paid by member Sarah", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/finance/expenses",
      headers: { cookie: memberCookie },
      payload: {
        title: "Electricity Top-up",
        amount: 20.0,
        isSplit: true,
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().paidByUserId).toBe(memberId);
  });

  let subId = "";

  it("should create, list, and update recurring subscriptions", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: "/api/finance/subscriptions",
      headers: { cookie: adminCookie },
      payload: {
        title: "Fiber Internet",
        amount: 40.0,
        billingCycle: "monthly",
        nextBillingDate: new Date().toISOString(),
        isActive: true,
      },
    });
    expect(createRes.statusCode).toBe(201);
    subId = createRes.json().id;
    expect(createRes.json().monthlyEquivalent).toBe(40);

    const yearlyRes = await app.inject({
      method: "POST",
      url: "/api/finance/subscriptions",
      headers: { cookie: adminCookie },
      payload: {
        title: "Home Insurance",
        amount: 120.0,
        billingCycle: "yearly",
        nextBillingDate: new Date().toISOString(),
        isActive: true,
      },
    });
    expect(yearlyRes.statusCode).toBe(201);
    expect(yearlyRes.json().monthlyEquivalent).toBe(10);

    const listRes = await app.inject({
      method: "GET",
      url: "/api/finance/subscriptions",
      headers: { cookie: adminCookie },
    });
    expect(listRes.statusCode).toBe(200);
    expect(listRes.json().length).toBe(2);

    const patchRes = await app.inject({
      method: "PATCH",
      url: `/api/finance/subscriptions/${subId}`,
      headers: { cookie: adminCookie },
      payload: { amount: 45.0 },
    });
    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.json().monthlyEquivalent).toBe(45);
  });

  it("should compute accurate monthly overview with budget percent and burn rate", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/finance/overview",
      headers: { cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.totalSpentThisMonth).toBe(80);
    expect(body.monthlyBudget).toBe(500);
    expect(body.budgetPercent).toBe(16);
    expect(body.recurringMonthlyBurn).toBe(55);
    expect(body.activeSubscriptionCount).toBe(2);
    expect(body.unsettledSplitTotal).toBe(20);
  });

  it("should compute shared split balances (Sarah owes Daniel €20.00) and settle cleanly", async () => {
    const splitRes = await app.inject({
      method: "GET",
      url: "/api/finance/splits",
      headers: { cookie: adminCookie },
    });
    expect(splitRes.statusCode).toBe(200);
    const splitBody = splitRes.json();
    expect(splitBody.balances.length).toBe(1);
    expect(splitBody.balances[0].fromUserId).toBe(memberId);
    expect(splitBody.balances[0].toUserId).toBe(adminId);
    expect(splitBody.balances[0].amount).toBe(20);

    // 1-tap settle
    const settleRes = await app.inject({
      method: "POST",
      url: "/api/finance/splits/settle",
      headers: { cookie: memberCookie },
      payload: {
        fromUserId: memberId,
        toUserId: adminId,
        amount: 20,
      },
    });
    expect(settleRes.statusCode).toBe(200);
    expect(settleRes.json().success).toBe(true);
    expect(settleRes.json().balances).toEqual([]);
    expect(settleRes.json().unsettledTotal).toBe(0);

    // Verify open balances remain zero
    const afterRes = await app.inject({
      method: "GET",
      url: "/api/finance/splits",
      headers: { cookie: adminCookie },
    });
    expect(afterRes.json().balances).toEqual([]);
    expect(afterRes.json().settlements.length).toBe(1);
    expect(afterRes.json().splitExpenses.every((e: any) => e.isSettled)).toBe(true);
  });

  it("should update and delete an expense and a subscription", async () => {
    const patchExp = await app.inject({
      method: "PATCH",
      url: `/api/finance/expenses/${expenseId}`,
      headers: { cookie: adminCookie },
      payload: { title: "Updated Market Run" },
    });
    expect(patchExp.statusCode).toBe(200);
    expect(patchExp.json().title).toBe("Updated Market Run");

    const delExp = await app.inject({
      method: "DELETE",
      url: `/api/finance/expenses/${expenseId}`,
      headers: { cookie: adminCookie },
    });
    expect(delExp.statusCode).toBe(204);

    const delSub = await app.inject({
      method: "DELETE",
      url: `/api/finance/subscriptions/${subId}`,
      headers: { cookie: adminCookie },
    });
    expect(delSub.statusCode).toBe(204);
  });
});
