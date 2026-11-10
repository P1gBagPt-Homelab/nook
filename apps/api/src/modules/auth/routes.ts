import { FastifyPluginAsync } from "fastify";
import { db } from "../../lib/db";
import { households, users, sessions } from "../../lib/db/schema";
import { hashPassword, verifyPassword } from "../../lib/auth/password";
import { createSession } from "../../lib/auth/session";
import {
  setupAdminSchema,
  loginSchema,
  inviteUserSchema,
  setPasswordSchema,
} from "@nook/shared";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Status Check (Is setup required?)
  fastify.get(
    "/status",
    {
      schema: {
        description: "Check if system is initialized or first-run setup is required",
        tags: ["Auth"],
        response: {
          200: {
            type: "object",
            properties: {
              initialized: { type: "boolean" },
              setupRequired: { type: "boolean" },
            },
            required: ["initialized", "setupRequired"],
          },
        },
      },
    },
    async () => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
      const userCount = Number(count);
      return {
        initialized: userCount > 0,
        setupRequired: userCount === 0,
      };
    }
  );

  // 2. First-Run Setup (Creates Admin + Household)
  fastify.post(
    "/setup",
    {
      schema: {
        description: "First-run initial setup. Creates primary household and initial admin user.",
        tags: ["Auth"],
      },
    },
    async (request, reply) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
      if (Number(count) > 0) {
        return reply.status(403).send({
          type: "https://nook.app/errors/already-initialized",
          title: "Forbidden",
          status: 403,
          detail: "Setup has already been completed. Public registration is permanently closed.",
        });
      }

      const parseResult = setupAdminSchema.safeParse(request.body);
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

      // 1. Create Household
      const [household] = await db
        .insert(households)
        .values({ name: body.householdName })
        .returning();

      // 2. Create Admin User
      const passwordHash = await hashPassword(body.password);
      const [admin] = await db
        .insert(users)
        .values({
          householdId: household.id,
          name: body.name,
          email: body.email.toLowerCase(),
          passwordHash,
          role: "admin",
          mustSetPassword: false,
        })
        .returning();

      // 3. Issue Session
      const session = await createSession(admin.id);
      reply.setCookie("session", session.token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: session.expiresAt,
      });

      return reply.status(201).send({
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          householdId: household.id,
        },
      });
    }
  );

  // 3. Login
  fastify.post(
    "/login",
    {
      schema: {
        description: "Authenticate with email and password",
        tags: ["Auth"],
      },
    },
    async (request, reply) => {
      const parseResult = loginSchema.safeParse(request.body);
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

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email.toLowerCase()));

      if (!user || !user.passwordHash) {
        return reply.status(401).send({
          type: "https://nook.app/errors/invalid-credentials",
          title: "Unauthorized",
          status: 401,
          detail: "Invalid email or password.",
        });
      }

      const isValid = await verifyPassword(user.passwordHash, body.password);
      if (!isValid) {
        return reply.status(401).send({
          type: "https://nook.app/errors/invalid-credentials",
          title: "Unauthorized",
          status: 401,
          detail: "Invalid email or password.",
        });
      }

      const session = await createSession(user.id);
      reply.setCookie("session", session.token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: session.expiresAt,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          householdId: user.householdId,
          mustSetPassword: user.mustSetPassword,
        },
      };
    }
  );

  // 4. Admin Invite Member
  fastify.post(
    "/invite",
    {
      preHandler: fastify.requireAdmin,
      schema: {
        description: "Admin invites a new household member",
        tags: ["Auth"],
      },
    },
    async (request, reply) => {
      const parseResult = inviteUserSchema.safeParse(request.body);
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
      const { email, name, role } = parseResult.data;

      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email.toLowerCase()));

      if (existing) {
        return reply.status(409).send({
          type: "https://nook.app/errors/conflict",
          title: "Conflict",
          status: 409,
          detail: "A user with this email address already exists.",
        });
      }

      const inviteToken = `act_${randomBytes(24).toString("hex")}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7-day invite

      const [invited] = await db
        .insert(users)
        .values({
          householdId: request.user!.householdId,
          email: email.toLowerCase(),
          name,
          role,
          mustSetPassword: true,
          inviteToken,
          inviteTokenExpiresAt: expiresAt,
        })
        .returning();

      return reply.status(201).send({
        userId: invited.id,
        inviteToken,
        inviteUrl: `${process.env.APP_URL || "http://localhost:3000"}/join?token=${inviteToken}`,
      });
    }
  );

  // 5. First-Login Set Password
  fastify.post(
    "/set-password",
    {
      schema: {
        description: "Invited user sets initial password with activation token",
        tags: ["Auth"],
      },
    },
    async (request, reply) => {
      const parseResult = setPasswordSchema.safeParse(request.body);
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
      const { token, password } = parseResult.data;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.inviteToken, token));

      if (
        !user ||
        (user.inviteTokenExpiresAt && new Date() > user.inviteTokenExpiresAt)
      ) {
        return reply.status(400).send({
          type: "https://nook.app/errors/invalid-token",
          title: "Bad Request",
          status: 400,
          detail: "Activation token is invalid or has expired.",
        });
      }

      const passwordHash = await hashPassword(password);
      await db
        .update(users)
        .set({
          passwordHash,
          mustSetPassword: false,
          inviteToken: null,
          inviteTokenExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      const session = await createSession(user.id);
      reply.setCookie("session", session.token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: session.expiresAt,
      });

      return { success: true, message: "Password set successfully." };
    }
  );

  // 6. Current User Profile
  fastify.get(
    "/me",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Get authenticated user profile",
        tags: ["Auth"],
      },
    },
    async (request) => {
      return { user: request.user };
    }
  );

  // 7. Logout
  fastify.post(
    "/logout",
    {
      schema: {
        description: "Log out and invalidate current session cookie",
        tags: ["Auth"],
      },
    },
    async (request, reply) => {
      const token = request.cookies?.session;
      if (token) {
        await db.delete(sessions).where(eq(sessions.id, token));
      }
      reply.clearCookie("session", { path: "/" });
      return { success: true };
    }
  );
};

export default authRoutes;
