import { randomBytes } from "crypto";
import { FastifyPluginAsync } from "fastify";
import { db } from "../../lib/db";
import {
  shoppingLists,
  shoppingItems,
  stockItems,
  productCatalog,
  expenses,
  expenseCategories,
} from "../../lib/db/schema";
import { unpackCartSchema } from "@nook/shared";
import { eq, and } from "drizzle-orm";

export const cartRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Get or Create Active Shopping Cart
  fastify.get(
    "/active",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Get or automatically create active shopping cart for current household",
        tags: ["Cart"],
        operationId: "getActiveCart",
      },
    },
    async (request) => {
      const householdId = request.user!.householdId;

      let [cart] = await db
        .select()
        .from(shoppingLists)
        .where(
          and(
            eq(shoppingLists.householdId, householdId),
            eq(shoppingLists.status, "preparing")
          )
        );

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
          listId: shoppingItems.listId,
          productId: shoppingItems.productId,
          customTitle: shoppingItems.customTitle,
          quantity: shoppingItems.quantity,
          unit: shoppingItems.unit,
          estimatedPrice: shoppingItems.estimatedPrice,
          isCollected: shoppingItems.isCollected,
          collectedAt: shoppingItems.collectedAt,
          isTransferredToStock: shoppingItems.isTransferredToStock,
          targetLocation: shoppingItems.targetLocation,
          notes: shoppingItems.notes,
          productTitle: productCatalog.title,
          brand: productCatalog.brand,
          category: productCatalog.category,
          imageKey: productCatalog.imageKey,
        })
        .from(shoppingItems)
        .leftJoin(productCatalog, eq(shoppingItems.productId, productCatalog.id))
        .where(eq(shoppingItems.listId, cart.id));

      return { cart, items };
    }
  );

  // 2. Add Item to Cart
  fastify.post(
    "/items",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Add an item to the shopping cart",
        tags: ["Cart"],
        operationId: "addCartItem",
      },
    },
    async (request, reply) => {
      const {
        listId,
        productId,
        customTitle,
        quantity = 1,
        unit = "pcs",
        estimatedPrice,
        targetLocation = "Pantry",
        notes,
      } = request.body as any;

      let targetListId = listId;

      // If listId not provided, fallback to household's active cart
      if (!targetListId) {
        const householdId = request.user!.householdId;
        let [cart] = await db
          .select()
          .from(shoppingLists)
          .where(
            and(
              eq(shoppingLists.householdId, householdId),
              eq(shoppingLists.status, "preparing")
            )
          );

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
        targetListId = cart.id;
      }

      const [item] = await db
        .insert(shoppingItems)
        .values({
          listId: targetListId,
          productId: productId || null,
          customTitle: customTitle || null,
          quantity: quantity ? quantity.toString() : "1.0",
          unit: unit || "pcs",
          estimatedPrice: estimatedPrice != null ? estimatedPrice.toString() : null,
          targetLocation: targetLocation || "Pantry",
          notes: notes || null,
          isCollected: false,
        })
        .returning();

      return reply.status(201).send(item);
    }
  );

  // 3. Toggle Item Collected (In-Store Collect)
  fastify.patch(
    "/items/:id/collect",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Toggle item collected status in shopping cart",
        tags: ["Cart"],
        operationId: "toggleItemCollected",
      },
    },
    async (request, reply) => {
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

      if (!updated) {
        return reply.status(404).send({
          type: "https://nook.app/errors/not-found",
          title: "Not Found",
          status: 404,
          detail: "Shopping item not found.",
        });
      }

      return updated;
    }
  );

  // 4. Update Cart Item Details / Quantity
  fastify.patch(
    "/items/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Update shopping item details or quantity",
        tags: ["Cart"],
        operationId: "updateCartItem",
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { quantity, estimatedPrice, targetLocation, notes, customTitle } = request.body as any;

      const [updated] = await db
        .update(shoppingItems)
        .set({
          ...(quantity != null && { quantity: quantity.toString() }),
          ...(estimatedPrice !== undefined && {
            estimatedPrice: estimatedPrice != null ? estimatedPrice.toString() : null,
          }),
          ...(targetLocation != null && { targetLocation }),
          ...(notes !== undefined && { notes }),
          ...(customTitle !== undefined && { customTitle }),
        })
        .where(eq(shoppingItems.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({
          type: "https://nook.app/errors/not-found",
          title: "Not Found",
          status: 404,
          detail: "Shopping item not found.",
        });
      }

      return updated;
    }
  );

  // 5. Delete Item from Cart
  fastify.delete(
    "/items/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Remove item from shopping cart",
        tags: ["Cart"],
        operationId: "deleteCartItem",
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await db.delete(shoppingItems).where(eq(shoppingItems.id, id));
      return reply.status(204).send();
    }
  );

  // 6. "Arrived Home" Unpack to Stock
  fastify.post(
    "/:id/unpack",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Batch transfer collected cart items to household stock inventory",
        tags: ["Cart"],
        operationId: "unpackCart",
      },
    },
    async (request, reply) => {
      const { id: listId } = request.params as { id: string };
      const householdId = request.user!.householdId;
      const body = unpackCartSchema.parse(request.body || {});

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
          let prodId = item.productId;
          if (!prodId) {
            const [existingProd] = await tx
              .select()
              .from(productCatalog)
              .where(
                and(
                  eq(productCatalog.householdId, householdId),
                  eq(productCatalog.title, item.customTitle || "Unnamed Item")
                )
              );
            if (existingProd) {
              prodId = existingProd.id;
            } else {
              const [newProduct] = await tx
                .insert(productCatalog)
                .values({
                  householdId,
                  barcode: `custom_${randomBytes(8).toString("hex")}`,
                  title: item.customTitle || "Unnamed Item",
                  category: "Pantry",
                  unit: item.unit || "pcs",
                })
                .returning();
              prodId = newProduct.id;
            }
          }

          // Check if item exists in stock
          const [existing] = await tx
            .select()
            .from(stockItems)
            .where(
              and(
                eq(stockItems.householdId, householdId),
                eq(stockItems.productId, prodId)
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
              productId: prodId,
              location: item.targetLocation || body.targetLocation || "Pantry",
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
          let [groceriesCat] = await tx
            .select()
            .from(expenseCategories)
            .where(
              and(
                eq(expenseCategories.householdId, householdId),
                eq(expenseCategories.name, "Groceries")
              )
            );

          if (!groceriesCat) {
            [groceriesCat] = await tx
              .insert(expenseCategories)
              .values({
                householdId,
                name: "Groceries",
                color: "#FF7A59",
              })
              .returning();
          }

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
    }
  );
};
