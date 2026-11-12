import { FastifyPluginAsync } from "fastify";
import { and, desc, eq, gte, inArray, like, lt } from "drizzle-orm";
import { db } from "../../lib/db";
import {
  expenseCategories,
  expenses,
  expenseSettlements,
  financeDocuments,
  households,
  subscriptionPayments,
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
  upsertSubscriptionPaymentSchema,
} from "@nook/shared";
import {
  buildS3PublicUrl,
  parseMonthRange,
  sendNotFoundError,
  sendValidationError,
} from "../../lib/http-helpers";
import {
  buildDocumentList,
  formatFinanceDocument,
  normalizeDocumentInputs,
  syncFinanceDocuments,
} from "./documents";
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

      const expenseIds = rows.map((r) => r.id);
      const docsByExpense = new Map<string, ReturnType<typeof formatFinanceDocument>[]>();
      if (expenseIds.length > 0) {
        const docs = await db
          .select()
          .from(financeDocuments)
          .where(inArray(financeDocuments.expenseId, expenseIds));
        for (const doc of docs) {
          if (!doc.expenseId) continue;
          const list = docsByExpense.get(doc.expenseId) || [];
          list.push(formatFinanceDocument(doc));
          docsByExpense.set(doc.expenseId, list);
        }
      }

      return rows.map((row) => {
        const documents =
          docsByExpense.get(row.id) || buildDocumentList([], row.receiptKey);
        return {
          ...row,
          receiptUrl: documents[0]?.url ?? buildS3PublicUrl(row.receiptKey),
          documents,
        };
      });
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

      const normalizedDocs =
        normalizeDocumentInputs(body.documents, body.receiptKey) ?? [];
      const primaryReceiptKey = normalizedDocs[0]?.fileKey ?? body.receiptKey ?? null;

      const { expense, insertedDocs } = await db.transaction(async (tx) => {
        const [createdExpense] = await tx
          .insert(expenses)
          .values({
            householdId,
            paidByUserId: request.user!.id,
            categoryId: body.categoryId || null,
            title: body.title,
            amount: body.amount.toFixed(2),
            receiptKey: primaryReceiptKey,
            date: body.date ? new Date(body.date) : new Date(),
            isSplit: body.isSplit,
            isSettled: false,
          })
          .returning();

        const docs =
          normalizedDocs.length > 0
            ? await syncFinanceDocuments(
                tx,
                householdId,
                { expenseId: createdExpense.id },
                normalizedDocs
              )
            : [];

        return { expense: createdExpense, insertedDocs: docs };
      });

      const documents = buildDocumentList(insertedDocs, expense.receiptKey);
      return reply.status(201).send({
        ...expense,
        receiptUrl: documents[0]?.url ?? buildS3PublicUrl(expense.receiptKey),
        documents,
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
      const householdId = request.user!.householdId;
      const normalizedDocs = normalizeDocumentInputs(body.documents, body.receiptKey);
      const nextReceiptKey =
        normalizedDocs !== undefined ? (normalizedDocs[0]?.fileKey ?? null) : undefined;

      const result = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(expenses)
          .set({
            ...(body.title !== undefined && { title: body.title }),
            ...(body.amount !== undefined && { amount: body.amount.toFixed(2) }),
            ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
            ...(nextReceiptKey !== undefined && { receiptKey: nextReceiptKey }),
            ...(body.date !== undefined && { date: new Date(body.date) }),
            ...(body.isSplit !== undefined && { isSplit: body.isSplit }),
          })
          .where(and(eq(expenses.id, id), eq(expenses.householdId, householdId)))
          .returning();

        if (!updated) return null;

        const docs =
          normalizedDocs !== undefined
            ? await syncFinanceDocuments(
                tx,
                householdId,
                { expenseId: updated.id },
                normalizedDocs
              )
            : await tx
                .select()
                .from(financeDocuments)
                .where(eq(financeDocuments.expenseId, updated.id));

        return { updated, docs };
      });

      if (!result) {
        return sendNotFoundError(reply, "Expense not found.");
      }

      const documents = buildDocumentList(result.docs, result.updated.receiptKey);
      return {
        ...result.updated,
        receiptUrl: documents[0]?.url ?? buildS3PublicUrl(result.updated.receiptKey),
        documents,
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

  // 5. Subscriptions CRUD & Monthly Payments
  fastify.get(
    "/subscriptions",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "List recurring household subscriptions and utilities with monthly payment status",
        tags: ["Finance"],
        operationId: "listSubscriptions",
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
      const { monthKey } = parseMonthRange(month);
      const yearPrefix = `${monthKey.slice(0, 4)}-`;

      const rows = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.householdId, householdId))
        .orderBy(subscriptions.nextBillingDate);

      const yearPaymentRows = await db
        .select()
        .from(subscriptionPayments)
        .where(
          and(
            eq(subscriptionPayments.householdId, householdId),
            like(subscriptionPayments.periodKey, `${yearPrefix}%`)
          )
        );

      const paymentIds = yearPaymentRows.map((p) => p.id);
      const docsByPayment = new Map<string, ReturnType<typeof formatFinanceDocument>[]>();
      if (paymentIds.length > 0) {
        const docRows = await db
          .select()
          .from(financeDocuments)
          .where(inArray(financeDocuments.subscriptionPaymentId, paymentIds));
        for (const doc of docRows) {
          if (!doc.subscriptionPaymentId) continue;
          const list = docsByPayment.get(doc.subscriptionPaymentId) || [];
          list.push(formatFinanceDocument(doc));
          docsByPayment.set(doc.subscriptionPaymentId, list);
        }
      }

      const paymentsBySub = new Map<string, typeof yearPaymentRows>();
      for (const payment of yearPaymentRows) {
        const list = paymentsBySub.get(payment.subscriptionId) || [];
        list.push(payment);
        paymentsBySub.set(payment.subscriptionId, list);
      }

      return rows.map((sub) => {
        const subPayments = paymentsBySub.get(sub.id) || [];
        const current = subPayments.find((p) => p.periodKey === monthKey) || null;
        return {
          ...sub,
          receiptUrl: buildS3PublicUrl(sub.receiptKey),
          monthlyEquivalent:
            Math.round(
              normalizeMonthlyBurn(parseFloat(sub.amount), sub.billingCycle) * 100
            ) / 100,
          currentPayment: current
            ? {
                id: current.id,
                periodKey: current.periodKey,
                amount: current.amount,
                isPaid: current.isPaid,
                paidAt: current.paidAt,
                expenseId: current.expenseId,
                documents: docsByPayment.get(current.id) || [],
              }
            : null,
          yearPayments: subPayments.map((p) => ({
            periodKey: p.periodKey,
            isPaid: p.isPaid,
            amount: p.amount,
            documentCount: (docsByPayment.get(p.id) || []).length,
          })),
        };
      });
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
          receiptKey: body.receiptKey || null,
          isActive: body.isActive,
        })
        .returning();

      return reply.status(201).send({
        ...created,
        receiptUrl: buildS3PublicUrl(created.receiptKey),
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
          ...(body.receiptKey !== undefined && { receiptKey: body.receiptKey || null }),
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
        receiptUrl: buildS3PublicUrl(updated.receiptKey),
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

  fastify.put(
    "/subscriptions/:id/payments/:periodKey",
    {
      preHandler: fastify.authenticate,
      schema: {
        description:
          "Record or update a monthly payment and proof-of-payment documents for a fixed bill",
        tags: ["Finance"],
        operationId: "upsertSubscriptionPayment",
        params: {
          type: "object",
          required: ["id", "periodKey"],
          properties: {
            id: { type: "string" },
            periodKey: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id, periodKey } = request.params as { id: string; periodKey: string };
      if (!/^\d{4}-\d{2}$/.test(periodKey)) {
        return reply.status(400).send({
          type: "https://nook.app/errors/validation-error",
          title: "Bad Request",
          status: 400,
          detail: "periodKey must be in YYYY-MM format",
        });
      }

      const parseResult = upsertSubscriptionPaymentSchema.safeParse(request.body || {});
      if (!parseResult.success) {
        return sendValidationError(reply, parseResult.error);
      }

      const householdId = request.user!.householdId;
      const body = parseResult.data;

      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.id, id), eq(subscriptions.householdId, householdId)));

      if (!sub) {
        return sendNotFoundError(reply, "Subscription not found.");
      }

      const result = await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(subscriptionPayments)
          .where(
            and(
              eq(subscriptionPayments.subscriptionId, sub.id),
              eq(subscriptionPayments.periodKey, periodKey)
            )
          );

        const nextIsPaid = body.isPaid ?? existing?.isPaid ?? true;
        const nextAmount =
          body.amount !== undefined
            ? body.amount.toFixed(2)
            : (existing?.amount ?? sub.amount);
        const nextPaidAt = nextIsPaid
          ? body.paidAt
            ? new Date(body.paidAt)
            : (existing?.paidAt ?? new Date())
          : null;
        const shouldSyncToBudget =
          body.logToBudget !== undefined
            ? body.logToBudget && nextIsPaid
            : nextIsPaid && (existing ? existing.expenseId !== null : true);

        let paymentId: string;
        let linkedExpenseId: string | null = existing?.expenseId ?? null;

        if (existing) {
          const [updatedPayment] = await tx
            .update(subscriptionPayments)
            .set({
              amount: nextAmount,
              isPaid: nextIsPaid,
              paidAt: nextPaidAt,
              paidByUserId: nextIsPaid ? request.user!.id : null,
              updatedAt: new Date(),
            })
            .where(eq(subscriptionPayments.id, existing.id))
            .returning();
          paymentId = updatedPayment.id;
        } else {
          const [createdPayment] = await tx
            .insert(subscriptionPayments)
            .values({
              householdId,
              subscriptionId: sub.id,
              periodKey,
              amount: nextAmount,
              isPaid: nextIsPaid,
              paidAt: nextPaidAt,
              paidByUserId: nextIsPaid ? request.user!.id : null,
            })
            .returning();
          paymentId = createdPayment.id;
        }

        const paymentDocs =
          body.documents !== undefined
            ? await syncFinanceDocuments(
                tx,
                householdId,
                { subscriptionPaymentId: paymentId },
                body.documents
              )
            : await tx
                .select()
                .from(financeDocuments)
                .where(eq(financeDocuments.subscriptionPaymentId, paymentId));

        const docInputsForExpense = paymentDocs.map((d) => ({
          fileKey: d.fileKey,
          fileName: d.fileName,
          mimeType: d.mimeType,
        }));
        const primaryReceiptKey = docInputsForExpense[0]?.fileKey ?? null;

        if (shouldSyncToBudget) {
          const paidDateMatchesPeriod =
            nextPaidAt && nextPaidAt.toISOString().slice(0, 7) === periodKey;
          const expenseDate = paidDateMatchesPeriod
            ? nextPaidAt!
            : new Date(`${periodKey}-01T12:00:00.000Z`);

          if (linkedExpenseId) {
            const [updatedExp] = await tx
              .update(expenses)
              .set({
                title: sub.title,
                amount: nextAmount,
                categoryId: sub.categoryId,
                date: expenseDate,
                receiptKey: primaryReceiptKey,
              })
              .where(and(eq(expenses.id, linkedExpenseId), eq(expenses.householdId, householdId)))
              .returning();

            if (updatedExp) {
              await syncFinanceDocuments(
                tx,
                householdId,
                { expenseId: updatedExp.id },
                docInputsForExpense
              );
            } else {
              linkedExpenseId = null;
            }
          }

          if (!linkedExpenseId) {
            const [createdExp] = await tx
              .insert(expenses)
              .values({
                householdId,
                paidByUserId: request.user!.id,
                categoryId: sub.categoryId,
                title: sub.title,
                amount: nextAmount,
                date: expenseDate,
                receiptKey: primaryReceiptKey,
                isSplit: false,
                isSettled: false,
              })
              .returning();
            linkedExpenseId = createdExp.id;
            if (docInputsForExpense.length > 0) {
              await syncFinanceDocuments(
                tx,
                householdId,
                { expenseId: createdExp.id },
                docInputsForExpense
              );
            }
            await tx
              .update(subscriptionPayments)
              .set({ expenseId: linkedExpenseId })
              .where(eq(subscriptionPayments.id, paymentId));
          }
        } else if (linkedExpenseId) {
          await tx
            .delete(expenses)
            .where(and(eq(expenses.id, linkedExpenseId), eq(expenses.householdId, householdId)));
          await tx
            .update(subscriptionPayments)
            .set({ expenseId: null })
            .where(eq(subscriptionPayments.id, paymentId));
          linkedExpenseId = null;
        }

        const [finalPayment] = await tx
          .select()
          .from(subscriptionPayments)
          .where(eq(subscriptionPayments.id, paymentId));

        return {
          ...finalPayment,
          documents: paymentDocs.map(formatFinanceDocument),
        };
      });

      return result;
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

      const splitIds = splitExpenses.map((e) => e.id);
      const docsBySplit = new Map<string, ReturnType<typeof formatFinanceDocument>[]>();
      if (splitIds.length > 0) {
        const docs = await db
          .select()
          .from(financeDocuments)
          .where(inArray(financeDocuments.expenseId, splitIds));
        for (const doc of docs) {
          if (!doc.expenseId) continue;
          const list = docsBySplit.get(doc.expenseId) || [];
          list.push(formatFinanceDocument(doc));
          docsBySplit.set(doc.expenseId, list);
        }
      }

      return {
        ...ledger,
        splitExpenses: splitExpenses.map((e) => {
          const documents = docsBySplit.get(e.id) || buildDocumentList([], e.receiptKey);
          return {
            ...e,
            receiptUrl: documents[0]?.url ?? buildS3PublicUrl(e.receiptKey),
            documents,
          };
        }),
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
