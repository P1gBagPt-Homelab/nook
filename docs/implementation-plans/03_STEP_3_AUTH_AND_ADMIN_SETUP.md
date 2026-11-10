# 03. Step 3: Admin-Controlled Authentication Engine

> **Goal**: Implement the secure First-Run Admin Setup, Admin-only member invitations, password setup on first login, Argon2 hashing, and session cookie management.  
> **Prerequisites**: Step 2 completed (Postgres connection & schema ready).  

---

## 📋 Task 3.1: Password Hashing & Session Utilities

1. Create `apps/api/src/lib/auth/password.ts`:
   ```typescript
   import argon2 from "argon2";

   export async function hashPassword(plainText: string): Promise<string> {
     return argon2.hash(plainText, {
       type: argon2.argon2id,
       memoryCost: 65536,
       timeCost: 3,
     });
   }

   export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
     try {
       return await argon2.verify(hash, plainText);
     } catch {
       return false;
     }
   }
   ```

2. Create `apps/api/src/lib/auth/session.ts`:
   ```typescript
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
   ```

---

## 📋 Task 3.2: Auth Guard Fastify Plugin

Create `apps/api/src/plugins/auth-guard.ts`:
```typescript
import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { validateSession } from "../lib/auth/session";
import { UserProfile } from "@nook/shared";

declare module "fastify" {
  interface FastifyRequest {
    user?: UserProfile;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authGuardPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionToken = request.cookies.session;
    if (!sessionToken) {
      return reply.status(401).send({
        type: "https://nook.app/errors/unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "Authentication session cookie missing.",
      });
    }

    const user = await validateSession(sessionToken);
    if (!user) {
      reply.clearCookie("session", { path: "/" });
      return reply.status(401).send({
        type: "https://nook.app/errors/session-expired",
        title: "Session Expired",
        status: 401,
        detail: "Your session has expired. Please log in again.",
      });
    }

    request.user = {
      id: user.id,
      householdId: user.householdId,
      email: user.email,
      name: user.name,
      role: user.role as "admin" | "member" | "viewer",
      mustSetPassword: user.mustSetPassword,
    };
  });

  fastify.decorate("requireAdmin", async (request: FastifyRequest, reply: FastifyReply) => {
    await fastify.authenticate(request, reply);
    if (request.user?.role !== "admin") {
      return reply.status(403).send({
        type: "https://nook.app/errors/forbidden",
        title: "Forbidden",
        status: 403,
        detail: "Only household admins can perform this action.",
      });
    }
  });
});
```

---

## 📋 Task 3.3: Auth Routes Implementation

Create `apps/api/src/modules/auth/routes.ts`:
```typescript
import { FastifyPluginAsync } from "fastify";
import { db } from "../../lib/db";
import { households, users } from "../../lib/db/schema";
import { hashPassword, verifyPassword } from "../../lib/auth/password";
import { createSession } from "../../lib/auth/session";
import { setupAdminSchema, loginSchema } from "@nook/shared";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Status Check (Is setup required?)
  fastify.get("/status", async () => {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(users);
    return {
      initialized: Number(count) > 0,
      setupRequired: Number(count) === 0,
    };
  });

  // 2. First-Run Setup (Creates Admin + Household)
  fastify.post("/setup", async (request, reply) => {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(users);
    if (Number(count) > 0) {
      return reply.status(403).send({
        type: "https://nook.app/errors/already-initialized",
        title: "Forbidden",
        status: 403,
        detail: "Setup has already been completed. Public registration is permanently closed.",
      });
    }

    const body = setupAdminSchema.parse(request.body);

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
  });

  // 3. Login
  fastify.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
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
        mustSetPassword: user.mustSetPassword,
      },
    };
  });

  // 4. Admin Invite Member
  fastify.post("/invite", { preHandler: fastify.requireAdmin }, async (request, reply) => {
    const { email, name, role = "member" } = request.body as any;
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
  });

  // 5. First-Login Set Password
  fastify.post("/set-password", async (request, reply) => {
    const { token, password } = request.body as any;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.inviteToken, token));

    if (!user || (user.inviteTokenExpiresAt && new Date() > user.inviteTokenExpiresAt)) {
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
  });

  // 6. Current User Profile
  fastify.get("/me", { preHandler: fastify.authenticate }, async (request) => {
    return { user: request.user };
  });

  // 7. Logout
  fastify.post("/logout", async (request, reply) => {
    const token = request.cookies.session;
    if (token) {
      await db.delete(sessions).where(eq(sessions.id, token));
    }
    reply.clearCookie("session", { path: "/" });
    return { success: true };
  });
};
```

---

## 📋 Task 3.4: Bruno Test Collection for Auth

Create `bruno/02-Auth/Setup-Admin.bru`:
```text
meta {
  name: Setup Admin
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/api/auth/setup
  body: json
  auth: none
}

body:json {
  {
    "householdName": "My Nook",
    "name": "Daniel",
    "email": "daniel@test.com",
    "password": "AdminStrongPassword123!"
  }
}

assert {
  res.status: in [201, 403]
}
```

---

## ✅ Acceptance Criteria & Verification

1. When database is empty, calling `GET /api/auth/status` returns `{"setupRequired": true}`.
2. Run `bru run bruno --env Local`:
   * `Setup-Admin.bru` creates the Admin and receives an HTTP-only `session` cookie.
   * Attempting to call `/setup` a second time returns `HTTP 403 Forbidden`.
3. Call `/api/auth/invite` as Admin: Generates a valid invite token.
4. Call `/api/auth/set-password` with the token: Sets user's password and logs them in.
