import { z } from "zod";
import {
  setupAdminSchema,
  loginSchema,
  inviteUserSchema,
  setPasswordSchema,
  createProductSchema,
  unpackCartSchema,
} from "./schemas";

export type SetupAdminInput = z.infer<typeof setupAdminSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UnpackCartInput = z.infer<typeof unpackCartSchema>;

export interface UserProfile {
  id: string;
  householdId: string;
  email: string;
  name: string;
  role: "admin" | "member" | "viewer";
  mustSetPassword: boolean;
}
