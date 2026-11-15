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
  upsertSubscriptionPaymentSchema,
  financeDocumentInputSchema,
  settleSplitSchema,
  createAssetSchema,
  updateAssetSchema,
  createMaintenanceTaskSchema,
  updateMaintenanceTaskSchema,
  createChoreSchema,
  updateChoreSchema,
  updateMacroProfileSchema,
  generatePlanSchema,
  swapMealSchema,
  logDiningOutSchema,
  syncPlanToCartSchema,
  createRecipeSchema,
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
export type UpsertSubscriptionPaymentInput = z.infer<typeof upsertSubscriptionPaymentSchema>;
export type FinanceDocumentInput = z.infer<typeof financeDocumentInputSchema>;
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

// Mealbird-Inspired Macro Meal Planning Types
export type UpdateMacroProfileInput = z.infer<typeof updateMacroProfileSchema>;
export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;
export type SwapMealInput = z.infer<typeof swapMealSchema>;
export type LogDiningOutInput = z.infer<typeof logDiningOutSchema>;
export type SyncPlanToCartInput = z.infer<typeof syncPlanToCartSchema>;
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;

export interface MacroProfile {
  id: string;
  householdId: string;
  title: string;
  dailyCalories: number;
  dailyProteinGrams: number;
  dailyCarbsGrams: number;
  dailyFatGrams: number;
  weeklyGroceryBudget: number | null;
  equipment: string[];
  excludedIngredients: string[];
  householdHeadcount: number;
  cookSessionsPerWeek: number;
  createdAt: string;
  updatedAt: string;
}

export interface UsdaFoodItem {
  id: string;
  fdcId: string;
  name: string;
  category: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  defaultAisle: string;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  name: string;
  amountGrams: number;
  usdaFoodId?: string | null;
  catalogProductId?: string | null;
  packageUnitSizeGrams?: number | null;
  estimatedPackagePrice?: number | null;
  aisle: string;
  sortOrder: number;
  // Computed fields when joined with USDA item
  usdaFood?: UsdaFoodItem | null;
  computedCalories?: number;
  computedProteinGrams?: number;
  computedCarbsGrams?: number;
  computedFatGrams?: number;
}

export interface Recipe {
  id: string;
  householdId?: string | null;
  title: string;
  description?: string | null;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  prepMinutes: number;
  cookMinutes: number;
  baseServings: number;
  equipment: string[];
  instructions: string[];
  isBuiltin: boolean;
  ingredients?: RecipeIngredient[];
  // Summary macros per serving
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
}

export interface PlanMeal {
  id: string;
  planId: string;
  date: string; // 'YYYY-MM-DD'
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  recipeId?: string | null;
  customName?: string | null;
  servings: number;
  computedCalories: number;
  computedProteinGrams: number;
  computedCarbsGrams: number;
  computedFatGrams: number;
  isBatchRepeat: boolean;
  isDiningOut: boolean;
  isCooked: boolean;
  notes?: string | null;
  recipe?: Recipe | null;
}

export interface DailyPlanSummary {
  date: string;
  dayName: string;
  meals: PlanMeal[];
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  targetCalories: number;
  targetProteinGrams: number;
  isCalorieCompliant: boolean;
  isProteinCompliant: boolean;
}

export interface MealPlanDetails {
  id: string;
  householdId: string;
  startDate: string;
  endDate: string;
  status: "active" | "archived";
  profile?: MacroProfile;
  days: DailyPlanSummary[];
}
