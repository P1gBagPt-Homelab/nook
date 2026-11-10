# 09. Phase 2: Personal & Household Finance Module

> **Goal**: Implement the Finance domain: Category-based budgeting, receipt photo capture, recurring subscription calendar with monthly burn rate projection, and shared household split ledger ("Who owes whom").  
> **Prerequisites**: Phase 1 MVP (Steps 1–8) deployed and operational.  

---

## 📋 Task 9.1: Fastify Finance Routes (`apps/api`)

Create `apps/api/src/modules/finance/routes.ts`:
```typescript
import { FastifyPluginAsync } from "fastify";
import { db } from "../../lib/db";
import { expenses, expenseCategories, subscriptions, users } from "../../lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { z } from "zod";

const createExpenseSchema = z.object({
  title: z.string().min(1).max(128),
  amount: z.number().positive(),
  categoryId: z.string().uuid().optional(),
  receiptKey: z.string().optional(),
  date: z.string().datetime().optional(),
  isSplit: z.boolean().default(false),
});

export const financeRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Monthly Financial Overview
  fastify.get("/overview", { preHandler: fastify.authenticate }, async (request) => {
    const householdId = request.user!.householdId;

    // Monthly total spent
    const [totalSpent] = await db
      .select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.householdId, householdId));

    // Active subscriptions monthly burn
    const subs = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.householdId, householdId), eq(subscriptions.isActive, true)));

    const monthlyBurn = subs.reduce((acc, sub) => acc + parseFloat(sub.amount), 0);

    return {
      totalSpentThisMonth: parseFloat(totalSpent.total),
      recurringMonthlyBurn: monthlyBurn,
      activeSubscriptionCount: subs.length,
    };
  });

  // 2. Log New Expense
  fastify.post("/expenses", { preHandler: fastify.authenticate }, async (request, reply) => {
    const householdId = request.user!.householdId;
    const body = createExpenseSchema.parse(request.body);

    const [expense] = await db
      .insert(expenses)
      .values({
        householdId,
        paidByUserId: request.user!.id,
        categoryId: body.categoryId || null,
        title: body.title,
        amount: body.amount.toString(),
        receiptKey: body.receiptKey || null,
        date: body.date ? new Date(body.date) : new Date(),
        isSplit: body.isSplit,
      })
      .returning();

    return reply.status(201).send(expense);
  });

  // 3. Subscriptions Radar
  fastify.get("/subscriptions", { preHandler: fastify.authenticate }, async (request) => {
    const householdId = request.user!.householdId;
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.householdId, householdId))
      .orderBy(subscriptions.nextBillingDate);
  });
};
```

---

## 📋 Task 9.2: Mobile Finance UI (`apps/web`)

In `apps/web/src/pages/FinancePage.tsx`:
* **Burn Rate Radar Card**: Visual gauge showing fixed baseline subscriptions vs discretionary spending.
* **1-Tap Expense Logger with Receipt Snap**: Uses `usePhotoUpload` to upload receipt directly to MinIO and attach to expense.
* **Recent Transactions List**: Clean scrollable card list with category chips (peach, amber, sage).
* **Shared Expense Balance Bar**: "Sarah owes you €24.50" with 1-tap "Settle" button.
