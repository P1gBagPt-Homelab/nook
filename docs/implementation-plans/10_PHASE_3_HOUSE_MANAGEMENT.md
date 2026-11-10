# 10. Phase 3: House Management Module

> **Goal**: Implement the House Management domain: Appliance & asset registry with MinIO PDF manuals, recurring maintenance schedules, chore rotation checklists, printable QR labels, and cross-module maintenance-to-shopping cart triggers.  
> **Prerequisites**: Phases 1 & 2 completed.  

---

## 📋 Task 10.1: Fastify House Routes (`apps/api`)

Create `apps/api/src/modules/house/routes.ts`:
```typescript
import { FastifyPluginAsync } from "fastify";
import { db } from "../../lib/db";
import { assets, maintenanceTasks, chores, shoppingItems, shoppingLists } from "../../lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";

export const houseRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Assets List with PDF Manual Links
  fastify.get("/assets", { preHandler: fastify.authenticate }, async (request) => {
    const householdId = request.user!.householdId;
    const items = await db
      .select()
      .from(assets)
      .where(eq(assets.householdId, householdId));

    return items.map((a) => ({
      ...a,
      manualUrl: a.manualKey
        ? `${process.env.S3_PUBLIC_ENDPOINT}/${process.env.S3_BUCKET}/${a.manualKey}`
        : null,
    }));
  });

  // 2. Register New Asset
  fastify.post("/assets", { preHandler: fastify.authenticate }, async (request, reply) => {
    const householdId = request.user!.householdId;
    const body = request.body as any;

    const [newAsset] = await db
      .insert(assets)
      .values({
        householdId,
        name: body.name,
        roomLocation: body.roomLocation,
        brand: body.brand,
        model: body.model,
        serialNumber: body.serialNumber,
        warrantyUntil: body.warrantyUntil ? new Date(body.warrantyUntil) : null,
        manualKey: body.manualKey || null,
        qrCodeToken: `nook_asset_${randomUUID().slice(0, 8)}`,
      })
      .returning();

    return reply.status(201).send(newAsset);
  });

  // 3. Maintenance Tasks Due
  fastify.get("/maintenance/due", { preHandler: fastify.authenticate }, async (request) => {
    const tasks = await db
      .select({
        id: maintenanceTasks.id,
        title: maintenanceTasks.title,
        nextDueDate: maintenanceTasks.nextDueDate,
        assetName: assets.name,
      })
      .from(maintenanceTasks)
      .innerJoin(assets, eq(maintenanceTasks.assetId, assets.id))
      .where(lte(maintenanceTasks.nextDueDate, new Date()));

    return tasks;
  });

  // 4. Cross-Module Trigger: Queue Replacement Item in Shopping Cart
  fastify.post("/maintenance/:id/queue-replacement", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const householdId = request.user!.householdId;

    const [task] = await db
      .select()
      .from(maintenanceTasks)
      .where(eq(maintenanceTasks.id, id));

    if (!task) return reply.status(404).send({ error: "Task not found" });

    // Fetch active cart
    let [cart] = await db
      .select()
      .from(shoppingLists)
      .where(and(eq(shoppingLists.householdId, householdId), eq(shoppingLists.status, "preparing")));

    if (!cart) {
      [cart] = await db.insert(shoppingLists).values({ householdId, title: "Shopping Cart", status: "preparing" }).returning();
    }

    // Add replacement item to cart
    await db.insert(shoppingItems).values({
      listId: cart.id,
      customTitle: `Replacement: ${task.title}`,
      targetLocation: "Home",
      quantity: "1.0",
      unit: "pcs",
    });

    return reply.send({ success: true, message: "Queued on shopping cart" });
  });

  // 5. Household Chores
  fastify.get("/chores", { preHandler: fastify.authenticate }, async (request) => {
    const householdId = request.user!.householdId;
    return await db.select().from(chores).where(eq(chores.householdId, householdId));
  });
};
```

---

## 📋 Task 10.2: Mobile House UI (`apps/web`)

In `apps/web/src/pages/HousePage.tsx`:
* **Appliance Registry Cards**: Quick access to model number, serial number, and 1-tap view of the PDF manual directly on your phone.
* **Maintenance Radar**: Alerts when a water filter, HVAC filter, or machine descale is due, with a 1-tap `[+ Add to Shopping Cart]` button.
* **Chores Carousel**: Swipe-to-complete chore cards with joyful completion streaks and animations.
* **QR Sticker Generator**: 1-click printable label showing asset name and QR code.
