# 06. Step 6: Grocery Module (My Stock & Shopping Cart Submodules)

> **Goal**: Implement the two submodules of the Grocery domain: **My Stock** (household pantry inventory) and the 3-phase **Shopping Cart** (Prepare ➔ In-Store Collect ➔ "Arrived Home" Unpack to Stock).  
> **Prerequisites**: Step 5 completed (Product catalog and barcode scanner ready).  

---

## 📋 Task 6.1: Fastify Routes for Shopping Cart (`apps/api`)

Create `apps/api/src/modules/cart/routes.ts`:
```typescript
import { FastifyPluginAsync } from "fastify";
import { db } from "../../lib/db";
import { shoppingLists, shoppingItems, stockItems, productCatalog, expenses, expenseCategories } from "../../lib/db/schema";
import { unpackCartSchema } from "@nook/shared";
import { eq, and } from "drizzle-orm";

export const cartRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Get or Create Active Shopping Cart
  fastify.get("/active", { preHandler: fastify.authenticate }, async (request) => {
    const householdId = request.user!.householdId;

    let [cart] = await db
      .select()
      .from(shoppingLists)
      .where(and(eq(shoppingLists.householdId, householdId), eq(shoppingLists.status, "preparing")));

    if (!cart) {
      [cart] = await db
        .insert(shoppingLists)
        .values({
          householdId,
          title: "Weekly Groceries",
          status: "preparing",
        })
        .returning();
    }

    // Join with catalog products
    const items = await db
      .select({
        id: shoppingItems.id,
        productId: shoppingItems.productId,
        customTitle: shoppingItems.customTitle,
        quantity: shoppingItems.quantity,
        unit: shoppingItems.unit,
        estimatedPrice: shoppingItems.estimatedPrice,
        isCollected: shoppingItems.isCollected,
        targetLocation: shoppingItems.targetLocation,
        productTitle: productCatalog.title,
        brand: productCatalog.brand,
        category: productCatalog.category,
        imageKey: productCatalog.imageKey,
      })
      .from(shoppingItems)
      .leftJoin(productCatalog, eq(shoppingItems.productId, productCatalog.id))
      .where(eq(shoppingItems.listId, cart.id));

    return { cart, items };
  });

  // 2. Add Item to Cart
  fastify.post("/items", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { listId, productId, customTitle, quantity = 1, estimatedPrice, targetLocation = "Pantry" } = request.body as any;

    const [item] = await db
      .insert(shoppingItems)
      .values({
        listId,
        productId,
        customTitle,
        quantity: quantity.toString(),
        estimatedPrice: estimatedPrice ? estimatedPrice.toString() : null,
        targetLocation,
        isCollected: false,
      })
      .returning();

    return reply.status(201).send(item);
  });

  // 3. Toggle Item Collected (In-Store Collect)
  fastify.patch("/items/:id/collect", { preHandler: fastify.authenticate }, async (request) => {
    const { id } = request.params as { id: string };
    const { isCollected } = request.body as { isCollected: boolean };

    const [updated] = await db
      .update(shoppingItems)
      .set({
        isCollected,
        collectedAt: isCollected ? new Date() : null,
      })
      .where(eq(shoppingItems.id, id))
      .returning();

    return updated;
  });

  // 4. "Arrived Home" Unpack to Stock
  fastify.post("/:id/unpack", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id: listId } = request.params as { id: string };
    const householdId = request.user!.householdId;
    const body = unpackCartSchema.parse(request.body);

    // Fetch items to unpack
    const itemsToUnpack = await db
      .select()
      .from(shoppingItems)
      .where(
        and(
          eq(shoppingItems.listId, listId),
          eq(shoppingItems.isCollected, true)
        )
      );

    // Batch transfer into Stock in a single atomic transaction
    await db.transaction(async (tx) => {
      for (const item of itemsToUnpack) {
        if (!item.productId) continue;

        // Check if item exists in stock
        const [existing] = await tx
          .select()
          .from(stockItems)
          .where(
            and(
              eq(stockItems.householdId, householdId),
              eq(stockItems.productId, item.productId)
            )
          );

        if (existing) {
          // Increment existing stock
          const newQty = (parseFloat(existing.quantity) + parseFloat(item.quantity)).toString();
          await tx
            .update(stockItems)
            .set({ quantity: newQty, status: "in_stock", updatedAt: new Date() })
            .where(eq(stockItems.id, existing.id));
        } else {
          // Create new stock entry
          await tx.insert(stockItems).values({
            householdId,
            productId: item.productId,
            location: item.targetLocation || "Pantry",
            status: "in_stock",
            quantity: item.quantity,
            unit: item.unit,
          });
        }

        // Mark shopping item as transferred
        await tx
          .update(shoppingItems)
          .set({ isTransferredToStock: true, transferredAt: new Date() })
          .where(eq(shoppingItems.id, item.id));
      }

      // Mark shopping list as completed/unpacked
      await tx
        .update(shoppingLists)
        .set({ status: "completed", completedAt: new Date(), unpackedAt: new Date() })
        .where(eq(shoppingLists.id, listId));

      // Optional: Log trip expense into Finance module
      if (body.logExpense && body.totalAmount) {
        const [groceriesCat] = await tx
          .select()
          .from(expenseCategories)
          .where(and(eq(expenseCategories.householdId, householdId), eq(expenseCategories.name, "Groceries")));

        await tx.insert(expenses).values({
          householdId,
          paidByUserId: request.user!.id,
          categoryId: groceriesCat?.id || null,
          title: "Supermarket Trip",
          amount: body.totalAmount.toString(),
          date: new Date(),
        });
      }
    });

    return reply.send({ success: true, unpackedCount: itemsToUnpack.length });
  });
};
```

---

## 📋 Task 6.2: Fastify Routes for Home Stock (`apps/api`)

Create `apps/api/src/modules/stock/routes.ts`:
```typescript
import { FastifyPluginAsync } from "fastify";
import { db } from "../../lib/db";
import { stockItems, productCatalog } from "../../lib/db/schema";
import { eq, and } from "drizzle-orm";

export const stockRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. List Home Stock
  fastify.get("/", { preHandler: fastify.authenticate }, async (request) => {
    const householdId = request.user!.householdId;
    const { location, status } = request.query as { location?: string; status?: string };

    let query = db
      .select({
        id: stockItems.id,
        productId: stockItems.productId,
        location: stockItems.location,
        status: stockItems.status,
        quantity: stockItems.quantity,
        unit: stockItems.unit,
        expiryDate: stockItems.expiryDate,
        title: productCatalog.title,
        brand: productCatalog.brand,
        category: productCatalog.category,
        imageKey: productCatalog.imageKey,
      })
      .from(stockItems)
      .innerJoin(productCatalog, eq(stockItems.productId, productCatalog.id))
      .where(eq(stockItems.householdId, householdId));

    const items = await query;
    return items;
  });

  // 2. Update Stock Status / Deplete
  fastify.patch("/:id", { preHandler: fastify.authenticate }, async (request) => {
    const { id } = request.params as { id: string };
    const { status, quantity, location } = request.body as any;

    const [updated] = await db
      .update(stockItems)
      .set({
        ...(status && { status }),
        ...(quantity && { quantity: quantity.toString() }),
        ...(location && { location }),
        updatedAt: new Date(),
      })
      .where(eq(stockItems.id, id))
      .returning();

    return updated;
  });
};
```

---

## 📋 Task 6.3: Frontend UI Components (`apps/web`)

### Segmented Switch & Main Grocery View (`apps/web/src/pages/GroceryPage.tsx`)
```tsx
import { useState } from "react";
import { ShoppingCartView } from "../components/groceries/ShoppingCartView";
import { StockInventoryView } from "../components/groceries/StockInventoryView";
import { ShoppingBag, Package } from "lucide-react";

export function GroceryPage() {
  const [activeTab, setActiveTab] = useState<"cart" | "stock">("cart");

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28">
      {/* Top Segmented Control */}
      <div className="flex bg-zinc-100 p-1 rounded-full shadow-inner mb-6">
        <button
          onClick={() => setActiveTab("cart")}
          className={`flex-1 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition ${
            activeTab === "cart" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-[#FF7A59]" />
          <span>Shopping Cart</span>
        </button>

        <button
          onClick={() => setActiveTab("stock")}
          className={`flex-1 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition ${
            activeTab === "stock" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Package className="w-4 h-4 text-[#10B981]" />
          <span>My Stock</span>
        </button>
      </div>

      {activeTab === "cart" ? <ShoppingCartView /> : <StockInventoryView />}
    </div>
  );
}
```

---

## 📋 Task 6.4: Bruno Tests for Cart & Stock

Create `bruno/05-Grocery/Cart-Lifecycle.bru`:
```text
meta {
  name: Cart Lifecycle Test
  type: http
  seq: 1
}

get {
  url: {{baseUrl}}/api/cart/active
  body: none
  auth: none
}

assert {
  res.status: eq 200
  res.body.cart: isDefined
  res.body.items: isArray
}
```

---

## ✅ Acceptance Criteria & Verification

1. Add 2 items to the active Shopping Cart.
2. Toggle items as "Collected" via `PATCH /api/cart/items/:id/collect`:
   * Items immediately move to "Collected in Cart".
3. Trigger `POST /api/cart/:id/unpack`:
   * Items are transferred into `stock_items` with status `in_stock`.
   * Shopping list is marked `status: completed`.
4. Inspect `GET /api/stock`:
   * The items are immediately visible in your Home Stock view.
