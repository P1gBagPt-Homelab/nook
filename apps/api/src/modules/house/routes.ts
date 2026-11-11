import { randomBytes } from "crypto";
import { FastifyPluginAsync } from "fastify";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import { db } from "../../lib/db";
import {
  assets,
  chores,
  maintenanceTasks,
  shoppingItems,
  shoppingLists,
  users,
} from "../../lib/db/schema";
import {
  createAssetSchema,
  createChoreSchema,
  createMaintenanceTaskSchema,
  updateAssetSchema,
  updateChoreSchema,
  updateMaintenanceTaskSchema,
} from "@nook/shared";
import {
  buildS3PublicUrl,
  sendNotFoundError,
  sendValidationError,
} from "../../lib/http-helpers";

const MS_PER_DAY = 86_400_000;

function serializeAsset<T extends { manualKey: string | null }>(asset: T) {
  return {
    ...asset,
    manualUrl: buildS3PublicUrl(asset.manualKey),
  };
}

function enrichMaintenanceTask<T extends { nextDueDate: Date }>(task: T) {
  const now = new Date();
  const diffMs = new Date(task.nextDueDate).getTime() - now.getTime();
  const daysUntilDue = Math.ceil(diffMs / MS_PER_DAY);
  return {
    ...task,
    isDue: diffMs <= 0,
    daysUntilDue,
  };
}

export const houseRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Assets Registry CRUD
  fastify.get(
    "/assets",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "List household appliance assets with PDF manual links and QR tokens",
        tags: ["House"],
        operationId: "listAssets",
      },
    },
    async (request) => {
      const items = await db
        .select()
        .from(assets)
        .where(eq(assets.householdId, request.user!.householdId))
        .orderBy(desc(assets.createdAt));

      return items.map(serializeAsset);
    }
  );

  fastify.get(
    "/assets/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Get a single appliance asset dossier and its maintenance tasks",
        tags: ["House"],
        operationId: "getAssetById",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const householdId = request.user!.householdId;

      const [asset] = await db
        .select()
        .from(assets)
        .where(and(eq(assets.id, id), eq(assets.householdId, householdId)));

      if (!asset) {
        return sendNotFoundError(reply, "Appliance asset not found.");
      }

      const tasks = await db
        .select()
        .from(maintenanceTasks)
        .where(
          and(
            eq(maintenanceTasks.assetId, asset.id),
            eq(maintenanceTasks.householdId, householdId)
          )
        )
        .orderBy(asc(maintenanceTasks.nextDueDate));

      return {
        ...serializeAsset(asset),
        maintenanceTasks: tasks.map(enrichMaintenanceTask),
      };
    }
  );

  fastify.post(
    "/assets",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Register a new appliance or household asset with optional PDF manual",
        tags: ["House"],
        operationId: "createAsset",
      },
    },
    async (request, reply) => {
      const parseResult = createAssetSchema.safeParse(request.body);
      if (!parseResult.success) {
        return sendValidationError(reply, parseResult.error);
      }

      const body = parseResult.data;
      const qrCodeToken = `nook_asset_${randomBytes(4).toString("hex")}`;

      const [created] = await db
        .insert(assets)
        .values({
          householdId: request.user!.householdId,
          name: body.name,
          roomLocation: body.roomLocation,
          brand: body.brand || null,
          model: body.model || null,
          serialNumber: body.serialNumber || null,
          purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
          warrantyUntil: body.warrantyUntil ? new Date(body.warrantyUntil) : null,
          manualKey: body.manualKey || null,
          notes: body.notes || null,
          qrCodeToken,
        })
        .returning();

      return reply.status(201).send(serializeAsset(created));
    }
  );

  fastify.patch(
    "/assets/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Update an existing appliance asset or attach a PDF manual",
        tags: ["House"],
        operationId: "updateAsset",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parseResult = updateAssetSchema.safeParse(request.body);
      if (!parseResult.success) {
        return sendValidationError(reply, parseResult.error);
      }

      const body = parseResult.data;
      const [updated] = await db
        .update(assets)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.roomLocation !== undefined && { roomLocation: body.roomLocation }),
          ...(body.brand !== undefined && { brand: body.brand || null }),
          ...(body.model !== undefined && { model: body.model || null }),
          ...(body.serialNumber !== undefined && { serialNumber: body.serialNumber || null }),
          ...(body.purchaseDate !== undefined && {
            purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
          }),
          ...(body.warrantyUntil !== undefined && {
            warrantyUntil: body.warrantyUntil ? new Date(body.warrantyUntil) : null,
          }),
          ...(body.manualKey !== undefined && { manualKey: body.manualKey || null }),
          ...(body.notes !== undefined && { notes: body.notes || null }),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(assets.id, id),
            eq(assets.householdId, request.user!.householdId)
          )
        )
        .returning();

      if (!updated) {
        return sendNotFoundError(reply, "Appliance asset not found.");
      }

      return serializeAsset(updated);
    }
  );

  fastify.delete(
    "/assets/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Delete an appliance asset and its scheduled maintenance timers",
        tags: ["House"],
        operationId: "deleteAsset",
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
        .delete(assets)
        .where(
          and(
            eq(assets.id, id),
            eq(assets.householdId, request.user!.householdId)
          )
        );
      return reply.status(204).send();
    }
  );

  // 2. Maintenance Timers & Cross-Module Cart Trigger
  fastify.get(
    "/maintenance",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "List all recurring appliance maintenance timers for the household",
        tags: ["House"],
        operationId: "listMaintenanceTasks",
      },
    },
    async (request) => {
      const rows = await db
        .select({
          id: maintenanceTasks.id,
          householdId: maintenanceTasks.householdId,
          assetId: maintenanceTasks.assetId,
          assetName: assets.name,
          roomLocation: assets.roomLocation,
          title: maintenanceTasks.title,
          intervalDays: maintenanceTasks.intervalDays,
          lastCompletedAt: maintenanceTasks.lastCompletedAt,
          nextDueDate: maintenanceTasks.nextDueDate,
          replacementPartTitle: maintenanceTasks.replacementPartTitle,
          createdAt: maintenanceTasks.createdAt,
        })
        .from(maintenanceTasks)
        .innerJoin(assets, eq(maintenanceTasks.assetId, assets.id))
        .where(eq(maintenanceTasks.householdId, request.user!.householdId))
        .orderBy(asc(maintenanceTasks.nextDueDate));

      return rows.map(enrichMaintenanceTask);
    }
  );

  fastify.get(
    "/maintenance/due",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "List maintenance tasks that are currently due or overdue",
        tags: ["House"],
        operationId: "listDueMaintenanceTasks",
      },
    },
    async (request) => {
      const rows = await db
        .select({
          id: maintenanceTasks.id,
          assetId: maintenanceTasks.assetId,
          title: maintenanceTasks.title,
          intervalDays: maintenanceTasks.intervalDays,
          lastCompletedAt: maintenanceTasks.lastCompletedAt,
          nextDueDate: maintenanceTasks.nextDueDate,
          replacementPartTitle: maintenanceTasks.replacementPartTitle,
          assetName: assets.name,
          roomLocation: assets.roomLocation,
        })
        .from(maintenanceTasks)
        .innerJoin(assets, eq(maintenanceTasks.assetId, assets.id))
        .where(
          and(
            eq(maintenanceTasks.householdId, request.user!.householdId),
            lte(maintenanceTasks.nextDueDate, new Date())
          )
        )
        .orderBy(asc(maintenanceTasks.nextDueDate));

      return rows.map(enrichMaintenanceTask);
    }
  );

  fastify.post(
    "/maintenance",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Schedule a new recurring maintenance timer on an appliance asset",
        tags: ["House"],
        operationId: "createMaintenanceTask",
      },
    },
    async (request, reply) => {
      const parseResult = createMaintenanceTaskSchema.safeParse(request.body);
      if (!parseResult.success) {
        return sendValidationError(reply, parseResult.error);
      }

      const householdId = request.user!.householdId;
      const body = parseResult.data;

      const [asset] = await db
        .select({ id: assets.id })
        .from(assets)
        .where(and(eq(assets.id, body.assetId), eq(assets.householdId, householdId)));

      if (!asset) {
        return sendNotFoundError(reply, "Target appliance asset not found.");
      }

      const nextDueDate = body.nextDueDate
        ? new Date(body.nextDueDate)
        : new Date(Date.now() + body.intervalDays * MS_PER_DAY);

      const [created] = await db
        .insert(maintenanceTasks)
        .values({
          householdId,
          assetId: body.assetId,
          title: body.title,
          intervalDays: body.intervalDays,
          nextDueDate,
          replacementPartTitle: body.replacementPartTitle || null,
        })
        .returning();

      return reply.status(201).send(enrichMaintenanceTask(created));
    }
  );

  fastify.patch(
    "/maintenance/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Update a maintenance timer configuration",
        tags: ["House"],
        operationId: "updateMaintenanceTask",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parseResult = updateMaintenanceTaskSchema.safeParse(request.body);
      if (!parseResult.success) {
        return sendValidationError(reply, parseResult.error);
      }

      const body = parseResult.data;
      const [updated] = await db
        .update(maintenanceTasks)
        .set({
          ...(body.title !== undefined && { title: body.title }),
          ...(body.intervalDays !== undefined && { intervalDays: body.intervalDays }),
          ...(body.nextDueDate !== undefined && { nextDueDate: new Date(body.nextDueDate) }),
          ...(body.replacementPartTitle !== undefined && {
            replacementPartTitle: body.replacementPartTitle || null,
          }),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(maintenanceTasks.id, id),
            eq(maintenanceTasks.householdId, request.user!.householdId)
          )
        )
        .returning();

      if (!updated) {
        return sendNotFoundError(reply, "Maintenance task not found.");
      }

      return enrichMaintenanceTask(updated);
    }
  );

  fastify.post(
    "/maintenance/:id/complete",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Log maintenance task completion and schedule the next due date",
        tags: ["House"],
        operationId: "completeMaintenanceTask",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const householdId = request.user!.householdId;

      const [task] = await db
        .select()
        .from(maintenanceTasks)
        .where(and(eq(maintenanceTasks.id, id), eq(maintenanceTasks.householdId, householdId)));

      if (!task) {
        return sendNotFoundError(reply, "Maintenance task not found.");
      }

      const now = new Date();
      const nextDueDate = new Date(now.getTime() + task.intervalDays * MS_PER_DAY);

      const [updated] = await db
        .update(maintenanceTasks)
        .set({
          lastCompletedAt: now,
          nextDueDate,
          updatedAt: now,
        })
        .where(eq(maintenanceTasks.id, task.id))
        .returning();

      return enrichMaintenanceTask(updated);
    }
  );

  fastify.post(
    "/maintenance/:id/queue-replacement",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Queue replacement filter or consumable part for a maintenance task into the active shopping cart",
        tags: ["House"],
        operationId: "queueMaintenanceReplacement",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const householdId = request.user!.householdId;

      const [task] = await db
        .select({
          id: maintenanceTasks.id,
          title: maintenanceTasks.title,
          replacementPartTitle: maintenanceTasks.replacementPartTitle,
          assetName: assets.name,
        })
        .from(maintenanceTasks)
        .innerJoin(assets, eq(maintenanceTasks.assetId, assets.id))
        .where(
          and(
            eq(maintenanceTasks.id, id),
            eq(maintenanceTasks.householdId, householdId)
          )
        );

      if (!task) {
        return sendNotFoundError(reply, "Maintenance task not found.");
      }

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

      const itemTitle =
        task.replacementPartTitle?.trim() || `Replacement: ${task.title} (${task.assetName})`;

      const [item] = await db
        .insert(shoppingItems)
        .values({
          listId: cart.id,
          customTitle: itemTitle,
          targetLocation: "Home",
          quantity: "1.0",
          unit: "pcs",
          notes: `Queued from ${task.assetName} maintenance`,
        })
        .returning();

      return reply.status(201).send({
        success: true,
        message: "Queued on shopping cart",
        item,
      });
    }
  );

  fastify.delete(
    "/maintenance/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Delete a scheduled maintenance timer",
        tags: ["House"],
        operationId: "deleteMaintenanceTask",
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
        .delete(maintenanceTasks)
        .where(
          and(
            eq(maintenanceTasks.id, id),
            eq(maintenanceTasks.householdId, request.user!.householdId)
          )
        );
      return reply.status(204).send();
    }
  );

  // 3. Household Chores CRUD & Toggle
  fastify.get(
    "/chores",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "List household chores and member assignments",
        tags: ["House"],
        operationId: "listChores",
      },
    },
    async (request) => {
      return await db
        .select({
          id: chores.id,
          householdId: chores.householdId,
          title: chores.title,
          cadence: chores.cadence,
          assignedToUserId: chores.assignedToUserId,
          assignedToName: users.name,
          isCompleted: chores.isCompleted,
          completedAt: chores.completedAt,
          completedByUserId: chores.completedByUserId,
          streakCount: chores.streakCount,
          dueDate: chores.dueDate,
          createdAt: chores.createdAt,
          updatedAt: chores.updatedAt,
        })
        .from(chores)
        .leftJoin(users, eq(chores.assignedToUserId, users.id))
        .where(eq(chores.householdId, request.user!.householdId))
        .orderBy(asc(chores.isCompleted), desc(chores.createdAt));
    }
  );

  fastify.post(
    "/chores",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Create a new household chore with cadence and optional assignee",
        tags: ["House"],
        operationId: "createChore",
      },
    },
    async (request, reply) => {
      const parseResult = createChoreSchema.safeParse(request.body);
      if (!parseResult.success) {
        return sendValidationError(reply, parseResult.error);
      }

      const householdId = request.user!.householdId;
      const body = parseResult.data;

      let assignedName: string | null = null;
      if (body.assignedToUserId) {
        const [member] = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(
            and(
              eq(users.id, body.assignedToUserId),
              eq(users.householdId, householdId)
            )
          );
        if (!member) {
          return sendNotFoundError(reply, "Assigned household member not found.");
        }
        assignedName = member.name;
      }

      const [created] = await db
        .insert(chores)
        .values({
          householdId,
          title: body.title,
          cadence: body.cadence,
          assignedToUserId: body.assignedToUserId || null,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
        })
        .returning();

      return reply.status(201).send({
        ...created,
        assignedToName: assignedName,
      });
    }
  );

  fastify.patch(
    "/chores/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Update a household chore title, cadence, assignee, or completion state",
        tags: ["House"],
        operationId: "updateChore",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parseResult = updateChoreSchema.safeParse(request.body);
      if (!parseResult.success) {
        return sendValidationError(reply, parseResult.error);
      }

      const householdId = request.user!.householdId;
      const body = parseResult.data;

      if (body.assignedToUserId) {
        const [member] = await db
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.id, body.assignedToUserId),
              eq(users.householdId, householdId)
            )
          );
        if (!member) {
          return sendNotFoundError(reply, "Assigned household member not found.");
        }
      }

      const [updated] = await db
        .update(chores)
        .set({
          ...(body.title !== undefined && { title: body.title }),
          ...(body.cadence !== undefined && { cadence: body.cadence }),
          ...(body.assignedToUserId !== undefined && {
            assignedToUserId: body.assignedToUserId || null,
          }),
          ...(body.dueDate !== undefined && {
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
          }),
          ...(body.isCompleted !== undefined && {
            isCompleted: body.isCompleted,
            completedAt: body.isCompleted ? new Date() : null,
            completedByUserId: body.isCompleted ? request.user!.id : null,
          }),
          updatedAt: new Date(),
        })
        .where(and(eq(chores.id, id), eq(chores.householdId, householdId)))
        .returning();

      if (!updated) {
        return sendNotFoundError(reply, "Chore not found.");
      }

      return updated;
    }
  );

  fastify.patch(
    "/chores/:id/toggle",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Toggle chore completion status and update completion streak",
        tags: ["House"],
        operationId: "toggleChore",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const householdId = request.user!.householdId;

      const [existing] = await db
        .select()
        .from(chores)
        .where(and(eq(chores.id, id), eq(chores.householdId, householdId)));

      if (!existing) {
        return sendNotFoundError(reply, "Chore not found.");
      }

      const body = (request.body || {}) as { isCompleted?: boolean };
      const nextCompleted =
        typeof body.isCompleted === "boolean" ? body.isCompleted : !existing.isCompleted;

      let nextStreak = existing.streakCount;
      if (nextCompleted && !existing.isCompleted) {
        nextStreak = existing.streakCount + 1;
      } else if (!nextCompleted && existing.isCompleted) {
        nextStreak = Math.max(0, existing.streakCount - 1);
      }

      const [updated] = await db
        .update(chores)
        .set({
          isCompleted: nextCompleted,
          completedAt: nextCompleted ? new Date() : null,
          completedByUserId: nextCompleted ? request.user!.id : null,
          streakCount: nextStreak,
          updatedAt: new Date(),
        })
        .where(eq(chores.id, existing.id))
        .returning();

      return updated;
    }
  );

  fastify.delete(
    "/chores/:id",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Delete a household chore",
        tags: ["House"],
        operationId: "deleteChore",
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
        .delete(chores)
        .where(
          and(
            eq(chores.id, id),
            eq(chores.householdId, request.user!.householdId)
          )
        );
      return reply.status(204).send();
    }
  );
};

export default houseRoutes;
