import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import { s3Plugin } from "../s3";

describe("MinIO S3 Plugin", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(s3Plugin);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should decorate fastify instance with s3 interface", () => {
    expect(app.s3).toBeDefined();
    expect(typeof app.s3.getPresignedUploadUrl).toBe("function");
    expect(app.s3.client).toBeDefined();
  });

  it("should generate a valid presigned upload URL for products folder", async () => {
    const result = await app.s3.getPresignedUploadUrl("products", "webp", "image/webp");

    expect(result).toHaveProperty("uploadUrl");
    expect(result).toHaveProperty("fileKey");
    expect(result).toHaveProperty("publicUrl");

    expect(result.fileKey).toMatch(/^products\/[a-f0-9-]+\.webp$/);
    expect(result.publicUrl).toContain(`/nook-media/${result.fileKey}`);

    // Presigned URL should contain AWS SigV4 query parameters
    const parsedUrl = new URL(result.uploadUrl);
    expect(parsedUrl.searchParams.has("X-Amz-Algorithm")).toBe(true);
    expect(parsedUrl.searchParams.get("X-Amz-Algorithm")).toBe("AWS4-HMAC-SHA256");
    expect(parsedUrl.searchParams.has("X-Amz-Credential")).toBe(true);
    expect(parsedUrl.searchParams.has("X-Amz-Date")).toBe(true);
    expect(parsedUrl.searchParams.has("X-Amz-Expires")).toBe(true);
    expect(parsedUrl.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(parsedUrl.searchParams.has("X-Amz-Signature")).toBe(true);
  });

  it("should generate proper keys for receipts and manuals", async () => {
    const receiptsResult = await app.s3.getPresignedUploadUrl("receipts", ".jpeg", "image/jpeg");
    expect(receiptsResult.fileKey).toMatch(/^receipts\/[a-f0-9-]+\.jpeg$/);

    const manualsResult = await app.s3.getPresignedUploadUrl("manuals", "pdf", "application/pdf");
    expect(manualsResult.fileKey).toMatch(/^manuals\/[a-f0-9-]+\.pdf$/);
  });

  it("should generate presigned URLs with fast performance (< 10ms)", async () => {
    const start = performance.now();
    await app.s3.getPresignedUploadUrl("products", "png", "image/png");
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(15);
  });

  it("should sign uploadUrl against S3_PUBLIC_ENDPOINT when different from S3_ENDPOINT", async () => {
    const prevEndpoint = process.env.S3_ENDPOINT;
    const prevPublic = process.env.S3_PUBLIC_ENDPOINT;
    process.env.S3_ENDPOINT = "http://minio:9000";
    process.env.S3_PUBLIC_ENDPOINT = "https://s3.janus-lab.duckdns.org/";

    const publicApp = Fastify({ logger: false });
    await publicApp.register(s3Plugin);
    await publicApp.ready();

    try {
      const result = await publicApp.s3.getPresignedUploadUrl("receipts", "pdf", "application/pdf");
      const parsedUpload = new URL(result.uploadUrl);
      expect(parsedUpload.origin).toBe("https://s3.janus-lab.duckdns.org");
      expect(parsedUpload.searchParams.has("x-amz-checksum-crc32")).toBe(false);
      expect(result.publicUrl.startsWith("https://s3.janus-lab.duckdns.org/nook-media/receipts/")).toBe(
        true
      );
    } finally {
      await publicApp.close();
      if (prevEndpoint === undefined) delete process.env.S3_ENDPOINT;
      else process.env.S3_ENDPOINT = prevEndpoint;
      if (prevPublic === undefined) delete process.env.S3_PUBLIC_ENDPOINT;
      else process.env.S3_PUBLIC_ENDPOINT = prevPublic;
    }
  });
});
