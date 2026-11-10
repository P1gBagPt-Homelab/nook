# 04. Step 4: MinIO S3 Presigned Upload Engine

> **Goal**: Connect Fastify to Janus MinIO S3 (`http://minio:9000`), implement the presigned URL generator for smartphone uploads, and ensure the API never proxies heavy binary image payloads.  
> **Prerequisites**: Step 3 completed, MinIO S3 reachable at `http://minio:9000` with bucket `nook-media`.  

---

## 📋 Task 4.1: MinIO Bucket Initialization

1. Open MinIO Console on Janus: `https://s3.janus-lab.duckdns.org` (or port 9000 locally).
2. Create bucket named: **`nook-media`**.
3. Set bucket policy to allow public read on object keys:
   * Policy: `arn:aws:s3:::nook-media/*` -> `s3:GetObject` allowed for public anonymous reads (so photos can display in the PWA without auth overhead).
4. Configure in your `.env`:
   ```env
   S3_ENDPOINT=http://minio:9000
   S3_PUBLIC_ENDPOINT=https://s3.janus-lab.duckdns.org
   S3_BUCKET=nook-media
   S3_ACCESS_KEY=YourMinioAccessKey
   S3_SECRET_KEY=YourMinioSecretKey
   S3_REGION=us-east-1
   ```

---

## 📋 Task 4.2: Fastify S3 Plugin

In `apps/api/src/plugins/s3.ts`:
```typescript
import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

declare module "fastify" {
  interface FastifyInstance {
    s3: {
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
```

---

## 📋 Task 4.3: Presigned URL Route Handler

In `apps/api/src/modules/uploads/routes.ts`:
```typescript
import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const presignedSchema = {
  body: z.object({
    folder: z.enum(["products", "receipts", "manuals"]),
    fileExtension: z.string().min(2).max(5),
    contentType: z.string().min(3),
  }),
};

export const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    "/presigned-url",
    {
      preHandler: fastify.authenticate,
      schema: presignedSchema,
    },
    async (request, reply) => {
      const { folder, fileExtension, contentType } = request.body as any;

      const result = await fastify.s3.getPresignedUploadUrl(
        folder,
        fileExtension,
        contentType
      );

      return reply.send(result);
    }
  );
};
```

---

## 📋 Task 4.4: Client-Side Upload Hook in PWA (`apps/web`)

In `apps/web/src/hooks/usePhotoUpload.ts`:
```typescript
import { useState } from "react";

export function usePhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);

  async function uploadPhoto(file: File, folder: "products" | "receipts" = "products") {
    setIsUploading(true);
    try {
      // 1. Ask Fastify API for a secure Presigned URL
      const extension = file.name.split(".").pop() || "webp";
      const res = await fetch("/api/uploads/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder,
          fileExtension: extension,
          contentType: file.type || "image/webp",
        }),
      });

      if (!res.ok) throw new Error("Failed to get presigned upload URL");
      const { uploadUrl, fileKey, publicUrl } = await res.json();

      // 2. Stream the image DIRECTLY from phone camera -> MinIO S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/webp" },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Direct S3 upload failed");

      return { fileKey, publicUrl };
    } finally {
      setIsUploading(false);
    }
  }

  return { uploadPhoto, isUploading };
}
```

---

## 📋 Task 4.5: Bruno Test for Presigned URL

Create `bruno/03-Uploads/Generate-Presigned-Url.bru`:
```text
meta {
  name: Generate Presigned URL
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/api/uploads/presigned-url
  body: json
  auth: none
}

body:json {
  {
    "folder": "products",
    "fileExtension": "webp",
    "contentType": "image/webp"
  }
}

assert {
  res.status: eq 200
  res.body.uploadUrl: isString
  res.body.fileKey: startsWith products/
}
```

---

## ✅ Acceptance Criteria & Verification

1. Fastify starts up cleanly with `s3Plugin` and logs `📦 MinIO S3 Plugin initialized`.
2. Calling `POST /api/uploads/presigned-url` returns `{ uploadUrl, fileKey, publicUrl }` in **< 10ms**.
3. Execute `curl -X PUT -H "Content-Type: image/webp" --data-binary "@test.webp" "$UPLOAD_URL"`:
   * Returns `HTTP 200 OK`.
   * The uploaded object is immediately visible inside bucket `nook-media` in the MinIO Web Console.
4. The Fastify API memory profile remains steady at ~60MB RAM because images never pass through the Node.js process.
