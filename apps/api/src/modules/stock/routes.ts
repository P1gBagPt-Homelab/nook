import { FastifyPluginAsync } from "fastify";
import { db } from "../../lib/db";
import { stockItems, productCatalog } from "../../lib/db/schema";
import { eq, and } from "drizzle-orm";

export const stockRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. List Home Stock
  fastify.get(
    "/",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "List stock inventory items for household, with optional location and status filters",
        tags: ["Stock"],
        operationId: "listStock",
        querystring: {
          type: "object",
          properties: {
            location: { type: "string" },
            status: { type: "string", enum: ["in_stock", "running_low", "out_of_stock"] },
          },
        },
      },
    },
    async (request) => {
      const householdId = request.user!.householdId;
      const { location, status } = request.query as { location?: string; status?: string };

      const conditions = [eq(stockItems.householdId, householdId)];

      if (location) {
        conditions.push(eq(stockItems.location, location));
      }
      if (status) {
        conditions.push(eq(stockItems.status, status as any));
      }

      const items = await db
        .select({
          id: stockItems.id,
          householdId: stockItems.householdId,
          productId: stockItems.productId,
          location: stockItems.location,
          status: stockItems.status,
          quantity: stockItems.quantity,
          unit: stockItems.unit,
          expiryDate: stockItems.expiryDate,
          updatedAt: stockItems.updatedAt,
          title: productCatalog.title,
          brand: productCatalog.brand,
          category: productCatalog.category,
          imageKey: productCatalog.imageKey,
        })
        .from(stockItems)
        .innerJoin(productCatalog, eq(stockItems.productId, productCatalog.id))
        .where(and(...conditions));

      return items;
    }
  );

  // 2. Add Stock Item Manually
  fastify.post(
    "/",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Add an item directly to stock inventory",
        tags: ["Stock"],
        operationId: "addStockItem",
      },
    },
    async (request, reply) => {
      const householdId = request.user!.householdId;
      const {
        productId,
        location,
        status,
        quantity = 1,
        unit = "pcs",
        expiryDate,
      } = request.body as any;

      if (!productId) {
        return reply.status(400).send({
          type: "https://nook.app/errors/bad-request",
          title: "Bad Request",
          status: 400,
          detail: "productId is required to add stock.",
        });
      }

      // Check if product already exists in stock
      const [existing] = await db
        .select()
        .from(stockItems)
        .where(
          and(
            eq(stockItems.householdId, householdId),
            eq(stockItems.productId, productId)
          )
        );

      if (existing) {
        const newQty = (parseFloat(existing.quantity) + parseFloat(quantity.toString())).toString();
        const [updated] = await db
          .update(stockItems)
          .set({
            quantity: newQty,
            ...(status && { status }),
            ...(location && { location }),
            ...(expiryDate && { expiryDate: new Date(expiryDate) }),
            updatedAt: new Date(),
          })
          .where(eq(stockItems.id, existing.id))
          .returning();

        return reply.status(200).send(updated);
      }

      const [item] = await db
        .insert(stockItems)
        .values({
          householdId,
          productId,
          location: location || "Pantry",
          status: status || "in_stock",
          quantity: quantity ? quantity.toString() : "1.0",
          unit: unit || "pcs",
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        })
        .returning();

      return reply.status(201).send(item);
    }
  );

  // 3. Update Stock Status / Deplete / Adjust
  fastify.patch(
    "/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Update status, quantity, or location of a stock inventory item",
        tags: ["Stock"],
        operationId: "updateStockItem",
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status, quantity, location, expiryDate } = request.body as any;

      const [updated] = await db
        .update(stockItems)
        .set({
          ...(status && { status }),
          ...(quantity != null && { quantity: quantity.toString() }),
          ...(location && { location }),
          ...(expiryDate !== undefined && {
            expiryDate: expiryDate ? new Date(expiryDate) : null,
          }),
          updatedAt: new Date(),
        })
        .where(eq(stockItems.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({
          type: "https://nook.app/errors/not-found",
          title: "Not Found",
          status: 404,
          detail: "Stock item not found.",
        });
      }

      return updated;
    }
  );

  // 4. Delete Stock Item
  fastify.delete(
    "/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Remove an item from household stock inventory",
        tags: ["Stock"],
        operationId: "deleteStockItem",
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await db.delete(stockItems).where(eq(stockItems.id, id));
      return reply.status(204).send();
    }
  );
};
