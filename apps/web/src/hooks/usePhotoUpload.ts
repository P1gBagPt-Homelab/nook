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
