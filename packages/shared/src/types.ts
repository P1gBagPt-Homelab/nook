import { z } from "zod";
import {
  setupAdminSchema,
  loginSchema,
  inviteUserSchema,
  setPasswordSchema,
  presignedUploadSchema,
  createProductSchema,
  unpackCartSchema,
  updateBudgetSchema,
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  createExpenseSchema,
  updateExpenseSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
  settleSplitSchema,
  createAssetSchema,
  updateAssetSchema,
  createMaintenanceTaskSchema,
  updateMaintenanceTaskSchema,
  createChoreSchema,
  updateChoreSchema,
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

export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;
export type UpdateExpenseCategoryInput = z.infer<typeof updateExpenseCategorySchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type SettleSplitInput = z.infer<typeof settleSplitSchema>;

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type CreateMaintenanceTaskInput = z.infer<typeof createMaintenanceTaskSchema>;
export type UpdateMaintenanceTaskInput = z.infer<typeof updateMaintenanceTaskSchema>;
export type CreateChoreInput = z.infer<typeof createChoreSchema>;
export type UpdateChoreInput = z.infer<typeof updateChoreSchema>;

export interface UserProfile {
  id: string;
  householdId: string;
  email: string;
  name: string;
  role: "admin" | "member" | "viewer";
  mustSetPassword: boolean;
}

export interface HouseholdMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member" | "viewer";
  mustSetPassword: boolean;
  createdAt: string;
}
