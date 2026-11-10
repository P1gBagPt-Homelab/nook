import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

declare module "fastify" {
  interface FastifyInstance {
    s3: {
      client: S3Client;
      getPresignedUploadUrl: (
        folder: "products" | "receipts" | "manuals",
        fileExtension: string,
        contentType: string
      ) => Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }>;
    };
  }
}

export const s3Plugin: FastifyPluginAsync = fp(async (fastify) => {
  const endpoint = process.env.S3_ENDPOINT || "http://minio:9000";
  const publicEndpoint = process.env.S3_PUBLIC_ENDPOINT || endpoint;
  const bucket = process.env.S3_BUCKET || "nook-media";

  const s3Client = new S3Client({
    endpoint,
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
      secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
    },
    forcePathStyle: true, // Mandatory for self-hosted MinIO
  });

  fastify.decorate("s3", {
    client: s3Client,
    async getPresignedUploadUrl(folder, fileExtension, contentType) {
      const fileKey = `${folder}/${randomUUID()}.${fileExtension.replace(/^\./, "")}`;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: fileKey,
        ContentType: contentType,
      });

      // URL expires in 5 minutes (300 seconds)
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
      const publicUrl = `${publicEndpoint}/${bucket}/${fileKey}`;

      return { uploadUrl, fileKey, publicUrl };
    },
  });

  fastify.log.info("📦 MinIO S3 Plugin initialized successfully");
});

export default s3Plugin;
