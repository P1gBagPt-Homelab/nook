import { z } from "zod";
import {
  setupAdminSchema,
  loginSchema,
  inviteUserSchema,
  setPasswordSchema,
  presignedUploadSchema,
  createProductSchema,
  unpackCartSchema,
} from "./schemas";

export type SetupAdminInput = z.infer<typeof setupAdminSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
export type PresignedUploadInput = z.infer<typeof presignedUploadSchema>;
export interface PresignedUploadResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}
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
