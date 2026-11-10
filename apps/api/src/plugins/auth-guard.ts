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
    const sessionToken = request.cookies?.session;
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
    if (reply.sent) return;
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

export default authGuardPlugin;
