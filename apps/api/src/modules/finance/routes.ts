import { FastifyPluginAsync } from "fastify";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "../../lib/db";
import {
  expenseCategories,
  expenses,
  expenseSettlements,
  households,
  subscriptions,
  users,
} from "../../lib/db/schema";
import {
  createExpenseCategorySchema,
  createExpenseSchema,
  createSubscriptionSchema,
  settleSplitSchema,
  updateBudgetSchema,
  updateExpenseCategorySchema,
  updateExpenseSchema,
  updateSubscriptionSchema,
} from "@nook/shared";
import {
  buildS3PublicUrl,
  parseMonthRange,
  sendNotFoundError,
  sendValidationError,
} from "../../lib/http-helpers";
import { computeSplitLedger, normalizeMonthlyBurn } from "./split-ledger";

const DEFAULT_CATEGORIES = [
  { name: "Groceries", color: "#15803D" },
  { name: "Utilities", color: "#0284C7" },
  { name: "Household", color: "#7C3AED" },
  { name: "Dining", color: "#D97706" },
];

export const financeRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Monthly Financial Overview
  fastify.get(
    "/overview",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Get monthly finance overview, budget progress, category spend, and subscription burn rate",
        tags: ["Finance"],
        operationId: "getFinanceOverview",
        querystring: {
          type: "object",
          properties: {
            month: { type: "string", description: "Month filter in YYYY-MM format" },
          },
        },
      },
    },
    async (request) => {
      const householdId = request.user!.householdId;
      const { month } = request.query as { month?: string };
      const { start, end, monthKey } = parseMonthRange(month);

      const [household] = await db
        .select()
        .from(households)
        .where(eq(households.id, householdId));

      const monthExpenses = await db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.householdId, householdId),
            gte(expenses.date, start),
            lt(expenses.date, end)
          )
        );

      const totalSpentThisMonth = monthExpenses.reduce(
        (acc, e) => acc + parseFloat(e.amount),
        0
      );

      const categories = await db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.householdId, householdId));

      const spentByCategory = new Map<string, number>();
      for (const exp of monthExpenses) {
        if (!exp.categoryId) continue;
        spentByCategory.set(
          exp.categoryId,
          (spentByCategory.get(exp.categoryId) || 0) + parseFloat(exp.amount)
        );
      }

      const categoryBreakdown = categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        monthlyBudget: cat.monthlyBudget ? parseFloat(cat.monthlyBudget) : null,
        spentThisMonth: Math.round((spentByCategory.get(cat.id) || 0) * 100) / 100,
      }));

      const subs = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.householdId, householdId),
            eq(subscriptions.isActive, true)
          )
        );

      const recurringMonthlyBurn =
        Math.round(
          subs.reduce(
            (acc, sub) => acc + normalizeMonthlyBurn(parseFloat(sub.amount), sub.billingCycle),
            0
          ) * 100
        ) / 100;

      const monthlyBudget = household?.monthlyBudget
        ? parseFloat(household.monthlyBudget)
        : null;

      const budgetPercent =
        monthlyBudget && monthlyBudget > 0
          ? Math.min(100, Math.round((totalSpentThisMonth / monthlyBudget) * 100))
          : 0;

      const ledger = await computeSplitLedger(db, householdId);

      return {
        month: monthKey,
        currency: household?.currency || "EUR",
        monthlyBudget,
        budgetPercent,
        totalSpentThisMonth: Math.round(totalSpentThisMonth * 100) / 100,
        expenseCountThisMonth: monthExpenses.length,
        recurringMonthlyBurn,
        activeSubscriptionCount: subs.length,
        unsettledSplitTotal: ledger.unsettledTotal,
        categoryBreakdown,
      };
    }
  );

  // 2. Update Household Monthly Budget Cap
  fastify.patch(
    "/budget",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Configure household monthly spending cap and currency",
        tags: ["Finance"],
        operationId: "updateHouseholdBudget",
      },
    },
    async (request, reply) => {
      const parseResult = updateBudgetSchema.safeParse(request.body);
      if (!parseResult.success) {
        return sendValidationError(reply, parseResult.error);
      }

      const householdId = request.user!.householdId;
      const { monthlyBudget, currency } = parseResult.data;

      const [updated] = await db
        .update(households)
        .set({
          monthlyBudget: monthlyBudget !== null ? monthlyBudget.toFixed(2) : null,
          ...(currency && { currency: currency.toUpperCase() }),
          updatedAt: new Date(),
        })
        .where(eq(households.id, householdId))
        .returning();

      return {
        monthlyBudget: updated.monthlyBudget ? parseFloat(updated.monthlyBudget) : null,
        currency: updated.currency,
      };
    }
  );

  // 3. Categories CRUD
  fastify.get(
    "/categories",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "List household expense categories, seeding defaults if none exist",
        tags: ["Finance"],
        operationId: "listExpenseCategories",
      },
    },
    async (request) => {
      const householdId = request.user!.householdId;
      let rows = await db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.householdId, householdId));

      if (rows.length === 0) {
        rows = await db
          .insert(expenseCategories)
          .values(
            DEFAULT_CATEGORIES.map((c) => ({
              householdId,
              name: c.name,
              color: c.color,
            }))
          )
          .returning();
      }

      return rows;
    }
  );

  fastify.post(
    "/categories",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Create a new household expense category",
        tags: ["Finance"],
        operationId: "createExpenseCategory",
      },
    },
    async (request, reply) => {
      const parseResult = createExpenseCategorySchema.safeParse(request.body);
      if (!parseResult.success) {
        return sendValidationError(reply, parseResult.error);
      }

      const { name, color, monthlyBudget } = parseResult.data;
      const [created] = await db
        .insert(expenseCategories)
        .values({
          householdId: request.user!.householdId,
          name,
          color,
          monthlyBudget: monthlyBudget != null ? monthlyBudget.toFixed(2) : null,
        })
        .returning();

      return reply.status(201).send(created);
    }
  );

  fastify.patch(
    "/categories/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Update an expense category name, color, or monthly budget cap",
        tags: ["Finance"],
        operationId: "updateExpenseCategory",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parseResult = updateExpenseCategorySchema.safeParse(request.body);
      if (!parseResult.success) {
        return sendValidationError(reply, parseResult.error);
      }

      const { name, color, monthlyBudget } = parseResult.data;
      const [updated] = await db
        .update(expenseCategories)
        .set({
          ...(name !== undefined && { name }),
          ...(color !== undefined && { color }),
          ...(monthlyBudget !== undefined && {
            monthlyBudget: monthlyBudget != null ? monthlyBudget.toFixed(2) : null,
          }),
        })
        .where(
          and(
            eq(expenseCategories.id, id),
            eq(expenseCategories.householdId, request.user!.householdId)
          )
        )
        .returning();

      if (!updated) {
        return sendNotFoundError(reply, "Expense category not found.");
      }

      return updated;
    }
  );

  fastify.delete(
    "/categories/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Delete an expense category",
        tags: ["Finance"],
        operationId: "deleteExpenseCategory",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await db
        .delete(expenseCategories)
        .where(
          and(
            eq(expenseCategories.id, id),
            eq(expenseCategories.householdId, request.user!.householdId)
          )
        );
      return reply.status(204).send();
    }
  );

  // 4. Expenses CRUD
  fastify.get(
    "/expenses",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "List household expenses with optional month, category, and split filters",
        tags: ["Finance"],
        operationId: "listExpenses",
        querystring: {
          type: "object",
          properties: {
            month: { type: "string" },
            categoryId: { type: "string" },
            isSplit: { type: "string", enum: ["true", "false"] },
          },
        },
      },
    },
    async (request) => {
      const householdId = request.user!.householdId;
      const { month, categoryId, isSplit } = request.query as {
        month?: string;
        categoryId?: string;
        isSplit?: string;
      };

      const conditions = [eq(expenses.householdId, householdId)];
      if (month) {
        const { start, end } = parseMonthRange(month);
        conditions.push(gte(expenses.date, start), lt(expenses.date, end));
      }
      if (categoryId) {
        conditions.push(eq(expenses.categoryId, categoryId));
      }
      if (isSplit === "true" || isSplit === "false") {
        conditions.push(eq(expenses.isSplit, isSplit === "true"));
      }

      const rows = await db
        .select({
          id: expenses.id,
          householdId: expenses.householdId,
          paidByUserId: expenses.paidByUserId,
          paidByName: users.name,
          categoryId: expenses.categoryId,
          categoryName: expenseCategories.name,
          categoryColor: expenseCategories.color,
          title: expenses.title,
          amount: expenses.amount,
          date: expenses.date,
          receiptKey: expenses.receiptKey,
          isSplit: expenses.isSplit,
          isSettled: expenses.isSettled,
          settledAt: expenses.settledAt,
          createdAt: expenses.createdAt,
        })
        .from(expenses)
        .leftJoin(users, eq(expenses.paidByUserId, users.id))
        .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
        .where(and(...conditions))
        .orderBy(desc(expenses.date), desc(expenses.createdAt));

      return rows.map((row) => ({
        ...row,
        receiptUrl: buildS3PublicUrl(row.receiptKey),
      }));
    }
  );

  fastify.post(
    "/expenses",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Log a new household expense with optional receipt attachment and split flag",
        tags: ["Finance"],
        operationId: "createExpense",
      },
    },
    async (request, reply) => {
      const parseResult = createExpenseSchema.safeParse(request.body);
      if (!parseResult.success) {
        return sendValidationError(reply, parseResult.error);
      }

      const householdId = request.user!.householdId;
      const body = parseResult.data;

      if (body.categoryId) {
        const [cat] = await db
          .select({ id: expenseCategories.id })
          .from(expenseCategories)
          .where(
            and(
              eq(expenseCategories.id, body.categoryId),
              eq(expenseCategories.householdId, householdId)
            )
          );
        if (!cat) {
          return sendNotFoundError(reply, "Expense category not found.");
        }
      }

      const [expense] = await db
        .insert(expenses)
        .values({
          householdId,
          paidByUserId: request.user!.id,
          categoryId: body.categoryId || null,
          title: body.title,
          amount: body.amount.toFixed(2),
          receiptKey: body.receiptKey || null,
          date: body.date ? new Date(body.date) : new Date(),
          isSplit: body.isSplit,
          isSettled: false,
        })
        .returning();

      return reply.status(201).send({
        ...expense,
        receiptUrl: buildS3PublicUrl(expense.receiptKey),
      });
    }
  );

  fastify.patch(
    "/expenses/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Update an existing household expense",
        tags: ["Finance"],
        operationId: "updateExpense",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parseResult = updateExpenseSchema.safeParse(request.body);
      if (!parseResult.success) {
        return sendValidationError(reply, parseResult.error);
      }

      const body = parseResult.data;
      const [updated] = await db
        .update(expenses)
        .set({
          ...(body.title !== undefined && { title: body.title }),
          ...(body.amount !== undefined && { amount: body.amount.toFixed(2) }),
          ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
          ...(body.receiptKey !== undefined && { receiptKey: body.receiptKey || null }),
          ...(body.date !== undefined && { date: new Date(body.date) }),
          ...(body.isSplit !== undefined && { isSplit: body.isSplit }),
        })
        .where(
          and(
            eq(expenses.id, id),
            eq(expenses.householdId, request.user!.householdId)
          )
        )
        .returning();

      if (!updated) {
        return sendNotFoundError(reply, "Expense not found.");
      }

      return {
        ...updated,
        receiptUrl: buildS3PublicUrl(updated.receiptKey),
      };
    }
  );

  fastify.delete(
    "/expenses/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Delete a household expense",
        tags: ["Finance"],
        operationId: "deleteExpense",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await db
        .delete(expenses)
        .where(
          and(
            eq(expenses.id, id),
            eq(expenses.householdId, request.user!.householdId)
          )
        );
      return reply.status(204).send();
    }
  );

  // 5. Subscriptions CRUD
  fastify.get(
    "/subscriptions",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "List recurring household subscriptions and utilities",
        tags: ["Finance"],
        operationId: "listSubscriptions",
      },
    },
    async (request) => {
      const rows = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.householdId, request.user!.householdId))
        .orderBy(subscriptions.nextBillingDate);

      return rows.map((sub) => ({
        ...sub,
        monthlyEquivalent:
          Math.round(
            normalizeMonthlyBurn(parseFloat(sub.amount), sub.billingCycle) * 100
          ) / 100,
      }));
    }
  );

  fastify.post(
    "/subscriptions",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Create a recurring household subscription or fixed utility bill",
        tags: ["Finance"],
        operationId: "createSubscription",
      },
    },
    async (request, reply) => {
      const parseResult = createSubscriptionSchema.safeParse(request.body);
      if (!parseResult.success) {
        return sendValidationError(reply, parseResult.error);
      }

      const body = parseResult.data;
      const [created] = await db
        .insert(subscriptions)
        .values({
          householdId: request.user!.householdId,
          categoryId: body.categoryId || null,
          title: body.title,
          amount: body.amount.toFixed(2),
          billingCycle: body.billingCycle,
          nextBillingDate: new Date(body.nextBillingDate),
          isActive: body.isActive,
        })
        .returning();

      return reply.status(201).send({
        ...created,
        monthlyEquivalent:
          Math.round(
            normalizeMonthlyBurn(parseFloat(created.amount), created.billingCycle) * 100
          ) / 100,
      });
    }
  );

  fastify.patch(
    "/subscriptions/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Update a recurring subscription or toggle active status",
        tags: ["Finance"],
        operationId: "updateSubscription",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parseResult = updateSubscriptionSchema.safeParse(request.body);
      if (!parseResult.success) {
        return sendValidationError(reply, parseResult.error);
      }

      const body = parseResult.data;
      const [updated] = await db
        .update(subscriptions)
        .set({
          ...(body.title !== undefined && { title: body.title }),
          ...(body.amount !== undefined && { amount: body.amount.toFixed(2) }),
          ...(body.billingCycle !== undefined && { billingCycle: body.billingCycle }),
          ...(body.nextBillingDate !== undefined && {
            nextBillingDate: new Date(body.nextBillingDate),
          }),
          ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(subscriptions.id, id),
            eq(subscriptions.householdId, request.user!.householdId)
          )
        )
        .returning();

      if (!updated) {
        return sendNotFoundError(reply, "Subscription not found.");
      }

      return {
        ...updated,
        monthlyEquivalent:
          Math.round(
            normalizeMonthlyBurn(parseFloat(updated.amount), updated.billingCycle) * 100
          ) / 100,
      };
    }
  );

  fastify.delete(
    "/subscriptions/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Delete a recurring subscription",
        tags: ["Finance"],
        operationId: "deleteSubscription",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.id, id),
            eq(subscriptions.householdId, request.user!.householdId)
          )
        );
      return reply.status(204).send();
    }
  );

  // 6. Household Shared Split Ledger & Settle
  fastify.get(
    "/splits",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Get household shared split ledger balances and recent split transactions",
        tags: ["Finance"],
        operationId: "getSplitLedger",
      },
    },
    async (request) => {
      const householdId = request.user!.householdId;
      const ledger = await computeSplitLedger(db, householdId);

      const splitExpenses = await db
        .select({
          id: expenses.id,
          title: expenses.title,
          amount: expenses.amount,
          date: expenses.date,
          paidByUserId: expenses.paidByUserId,
          paidByName: users.name,
          isSettled: expenses.isSettled,
          settledAt: expenses.settledAt,
          receiptKey: expenses.receiptKey,
        })
        .from(expenses)
        .leftJoin(users, eq(expenses.paidByUserId, users.id))
        .where(and(eq(expenses.householdId, householdId), eq(expenses.isSplit, true)))
        .orderBy(desc(expenses.date), desc(expenses.createdAt));

      const recentSettlements = await db
        .select({
          id: expenseSettlements.id,
          fromUserId: expenseSettlements.fromUserId,
          toUserId: expenseSettlements.toUserId,
          amount: expenseSettlements.amount,
          note: expenseSettlements.note,
          settledAt: expenseSettlements.settledAt,
        })
        .from(expenseSettlements)
        .where(eq(expenseSettlements.householdId, householdId))
        .orderBy(desc(expenseSettlements.settledAt))
        .limit(20);

      const memberNameById = new Map(ledger.members.map((m) => [m.id, m.name]));

      return {
        ...ledger,
        splitExpenses: splitExpenses.map((e) => ({
          ...e,
          receiptUrl: buildS3PublicUrl(e.receiptKey),
        })),
        settlements: recentSettlements.map((s) => ({
          ...s,
          fromUserName: memberNameById.get(s.fromUserId) || "Member",
          toUserName: memberNameById.get(s.toUserId) || "Member",
        })),
      };
    }
  );

  fastify.post(
    "/splits/settle",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Settle a specific shared balance or all open household split balances",
        tags: ["Finance"],
        operationId: "settleSplitBalances",
      },
    },
    async (request, reply) => {
      const parseResult = settleSplitSchema.safeParse(request.body || {});
      if (!parseResult.success) {
        return sendValidationError(reply, parseResult.error);
      }

      const householdId = request.user!.householdId;
      const body = parseResult.data;

      const currentLedger = await computeSplitLedger(db, householdId);
      let settledCount = 0;

      if (body.fromUserId && body.toUserId) {
        const matchingEdge = currentLedger.balances.find(
          (b) => b.fromUserId === body.fromUserId && b.toUserId === body.toUserId
        );
        const amountToSettle = body.amount ?? matchingEdge?.amount;

        if (!amountToSettle || amountToSettle <= 0) {
          return {
            success: true,
            settledCount: 0,
            balances: currentLedger.balances,
            unsettledTotal: currentLedger.unsettledTotal,
          };
        }

        await db.insert(expenseSettlements).values({
          householdId,
          fromUserId: body.fromUserId,
          toUserId: body.toUserId,
          amount: amountToSettle.toFixed(2),
          note: body.note || "1-Tap Settlement",
          isCleared: false,
        });
        settledCount = 1;
      } else if (currentLedger.balances.length > 0) {
        await db.insert(expenseSettlements).values(
          currentLedger.balances.map((edge) => ({
            householdId,
            fromUserId: edge.fromUserId,
            toUserId: edge.toUserId,
            amount: edge.amount.toFixed(2),
            note: body.note || "Full Household Settlement",
            isCleared: false,
          }))
        );
        settledCount = currentLedger.balances.length;
      }

      const nextLedger = await computeSplitLedger(db, householdId);

      // When all net balances reach zero, archive open split cycle cleanly
      if (nextLedger.balances.length === 0) {
        const now = new Date();
        await db.transaction(async (tx) => {
          await tx
            .update(expenses)
            .set({ isSettled: true, settledAt: now })
            .where(
              and(
                eq(expenses.householdId, householdId),
                eq(expenses.isSplit, true),
                eq(expenses.isSettled, false)
              )
            );
          await tx
            .update(expenseSettlements)
            .set({ isCleared: true })
            .where(
              and(
                eq(expenseSettlements.householdId, householdId),
                eq(expenseSettlements.isCleared, false)
              )
            );
        });
      }

      return {
        success: true,
        settledCount,
        balances: nextLedger.balances,
        unsettledTotal: nextLedger.unsettledTotal,
      };
    }
  );
};

export default financeRoutes;
