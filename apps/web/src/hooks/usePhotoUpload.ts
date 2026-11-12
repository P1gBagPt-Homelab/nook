import { useState } from "react";

export type UploadFolder = "products" | "receipts" | "manuals";

export function usePhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);

  async function uploadPhoto(file: File, folder: UploadFolder = "products") {
    setIsUploading(true);
    try {
      const defaultExt = folder === "manuals" ? "pdf" : "webp";
      const rawExt = file.name.split(".").pop()?.toLowerCase() || defaultExt;
      const extension = rawExt.slice(0, 5);
      const defaultMime =
        extension === "pdf"
          ? "application/pdf"
          : folder === "manuals"
            ? "application/pdf"
            : "image/webp";
      const contentType = file.type || defaultMime;

      // 1. Ask Fastify API for a secure Presigned URL
      const res = await fetch("/api/uploads/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder,
          fileExtension: extension,
          contentType,
        }),
      });

      if (!res.ok) throw new Error("Failed to get presigned upload URL");
      const { uploadUrl, fileKey, publicUrl } = await res.json();

      // 2. Stream the file DIRECTLY from client -> MinIO S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
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
