import { randomBytes } from "crypto";
import { db } from "../db";
import { sessions, users } from "../db/schema";
import { eq } from "drizzle-orm";

const SESSION_DURATION_DAYS = 30;

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await db.insert(sessions).values({
    id: token,
    userId,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function validateSession(token: string) {
  const [sessionRecord] = await db
    .select({
      user: users,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, token));

  if (!sessionRecord) return null;

  // Check expiration
  if (new Date() > sessionRecord.expiresAt) {
    await db.delete(sessions).where(eq(sessions.id, token));
    return null;
  }

  return sessionRecord.user;
}
