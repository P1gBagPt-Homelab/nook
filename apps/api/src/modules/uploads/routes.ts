import { FastifyPluginAsync } from "fastify";
import { presignedUploadSchema } from "@nook/shared";

export const presignedSchema = {
  description: "Generate presigned upload URL for direct smartphone or client S3 uploads",
  tags: ["Uploads"],
  operationId: "getPresignedUploadUrl",
  body: {
    type: "object",
    required: ["folder", "fileExtension", "contentType"],
    properties: {
      folder: { type: "string", enum: ["products", "receipts", "manuals"] },
      fileExtension: { type: "string", minLength: 2, maxLength: 5 },
      contentType: { type: "string", minLength: 3 },
    },
  },
  response: {
    200: {
      type: "object",
      required: ["uploadUrl", "fileKey", "publicUrl"],
      properties: {
        uploadUrl: { type: "string" },
        fileKey: { type: "string" },
        publicUrl: { type: "string" },
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
};

export const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    "/presigned-url",
    {
      preHandler: fastify.authenticate,
      schema: presignedSchema,
    },
    async (request, reply) => {
      const parseResult = presignedUploadSchema.safeParse(request.body);
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

      const { folder, fileExtension, contentType } = parseResult.data;

      const result = await fastify.s3.getPresignedUploadUrl(
        folder,
        fileExtension,
        contentType
      );

      return reply.send(result);
    }
  );
};

export default uploadRoutes;
