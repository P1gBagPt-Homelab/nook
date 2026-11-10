import { FastifyPluginAsync } from "fastify";
import { db } from "../../lib/db";
import { productCatalog } from "../../lib/db/schema";
import { createProductSchema } from "@nook/shared";
import { resolveOpenFoodFacts } from "./services/open-food-facts";
import { eq, and } from "drizzle-orm";

export const catalogRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Instant Scan Lookup
  fastify.get(
    "/scan/:barcode",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Instant barcode lookup against local catalog with Open Food Facts fallback",
        tags: ["Catalog"],
        operationId: "scanBarcode",
        params: {
          type: "object",
          required: ["barcode"],
          properties: {
            barcode: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              source: { type: "string", enum: ["local", "openfoodfacts"] },
              product: {
                type: "object",
                properties: {
                  id: { type: ["string", "null"] },
                  barcode: { type: "string" },
                  title: { type: "string" },
                  brand: { type: ["string", "null"] },
                  description: { type: ["string", "null"] },
                  category: { type: "string" },
                  unit: { type: "string" },
                  defaultPrice: { type: ["string", "null"] },
                  imageKey: { type: ["string", "null"] },
                  imageUrl: { type: ["string", "null"] },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                },
              },
            },
          },
          404: {
            type: "object",
            properties: {
              source: { type: "string" },
              barcode: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { barcode } = request.params as { barcode: string };
      const householdId = request.user!.householdId;

      // Check Local Database First (<2ms)
      const [localProduct] = await db
        .select()
        .from(productCatalog)
        .where(
          and(
            eq(productCatalog.householdId, householdId),
            eq(productCatalog.barcode, barcode)
          )
        );

      if (localProduct) {
        return reply.send({
          source: "local",
          product: {
            ...localProduct,
            imageUrl: localProduct.imageKey
              ? `${process.env.S3_PUBLIC_ENDPOINT || "http://minio:9000"}/${process.env.S3_BUCKET || "nook-media"}/${localProduct.imageKey}`
              : null,
          },
        });
      }

      // Fallback: Query Open Food Facts
      const external = await resolveOpenFoodFacts(barcode);
      if (external) {
        return reply.send({
          source: "openfoodfacts",
          product: {
            id: null,
            barcode,
            title: external.title,
            brand: external.brand,
            category: external.category,
            unit: external.unit,
            defaultPrice: null,
            imageKey: null,
            imageUrl: external.imageUrl,
          },
        });
      }

      // Not found anywhere: Return prompt to create
      return reply.status(404).send({
        source: "not_found",
        barcode,
        message: "Product not in catalog. Open creation drawer.",
      });
    }
  );

  // 2. Create / Digitalize Product
  fastify.post(
    "/products",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Create or update a product in the household catalog",
        tags: ["Catalog"],
        operationId: "createProduct",
        body: {
          type: "object",
          required: ["barcode", "title"],
          properties: {
            barcode: { type: "string", minLength: 4, maxLength: 64 },
            title: { type: "string", minLength: 1, maxLength: 128 },
            brand: { type: "string", maxLength: 64 },
            category: { type: "string" },
            unit: { type: "string" },
            defaultPrice: { type: "number" },
            imageKey: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              householdId: { type: "string" },
              barcode: { type: "string" },
              title: { type: "string" },
              brand: { type: ["string", "null"] },
              category: { type: "string" },
              unit: { type: "string" },
              defaultPrice: { type: ["string", "null"] },
              imageKey: { type: ["string", "null"] },
              createdAt: { type: "string" },
              updatedAt: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              type: { type: "string" },
              title: { type: "string" },
              status: { type: "number" },
              detail: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parseResult = createProductSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          type: "https://nook.app/errors/validation-error",
          title: "Bad Request",
          status: 400,
          detail: parseResult.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(", "),
        });
      }

      const body = parseResult.data;
      const householdId = request.user!.householdId;

      const [newProduct] = await db
        .insert(productCatalog)
        .values({
          householdId,
          barcode: body.barcode,
          title: body.title,
          brand: body.brand,
          category: body.category,
          unit: body.unit,
          defaultPrice: body.defaultPrice ? body.defaultPrice.toString() : null,
          imageKey: body.imageKey,
        })
        .onConflictDoUpdate({
          target: [productCatalog.householdId, productCatalog.barcode],
          set: {
            title: body.title,
            brand: body.brand,
            category: body.category,
            defaultPrice: body.defaultPrice ? body.defaultPrice.toString() : null,
            imageKey: body.imageKey,
            updatedAt: new Date(),
          },
        })
        .returning();

      return reply.status(201).send(newProduct);
    }
  );

  // 3. Search Catalog
  fastify.get(
    "/products",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Retrieve household product catalog items",
        tags: ["Catalog"],
        operationId: "getProducts",
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                householdId: { type: "string" },
                barcode: { type: "string" },
                title: { type: "string" },
                brand: { type: ["string", "null"] },
                category: { type: "string" },
                unit: { type: "string" },
                defaultPrice: { type: ["string", "null"] },
                imageKey: { type: ["string", "null"] },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (request) => {
      const householdId = request.user!.householdId;
      const products = await db
        .select()
        .from(productCatalog)
        .where(eq(productCatalog.householdId, householdId))
        .limit(100);
      return products;
    }
  );
};

export default catalogRoutes;
