import { FastifyReply } from "fastify";
import { ZodError } from "zod";

export function buildS3PublicUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  const publicEndpoint =
    process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT || "http://minio:9000";
  const bucket = process.env.S3_BUCKET || "nook-media";
  return `${publicEndpoint}/${bucket}/${key}`;
}

export function sendValidationError(reply: FastifyReply, error: ZodError) {
  return reply.status(400).send({
    type: "https://nook.app/errors/validation-error",
    title: "Bad Request",
    status: 400,
    detail: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
  });
}

export function sendNotFoundError(reply: FastifyReply, detail: string) {
  return reply.status(404).send({
    type: "https://nook.app/errors/not-found",
    title: "Not Found",
    status: 404,
    detail,
  });
}

export function parseMonthRange(month?: string): {
  start: Date;
  end: Date;
  monthKey: string;
} {
  const now = new Date();
  let year = now.getUTCFullYear();
  let monthIdx = now.getUTCMonth();

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    if (m >= 1 && m <= 12) {
      year = y;
      monthIdx = m - 1;
    }
  }

  const start = new Date(Date.UTC(year, monthIdx, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIdx + 1, 1, 0, 0, 0, 0));
  const monthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;

  return { start, end, monthKey };
}
