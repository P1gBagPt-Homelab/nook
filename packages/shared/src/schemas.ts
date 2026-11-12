import { z } from "zod";

// Auth Schemas
export const setupAdminSchema = z.object({
  householdName: z.string().min(2).max(64),
  name: z.string().min(2).max(64),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(64),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

export const setPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

// Upload Schemas
export const presignedUploadSchema = z.object({
  folder: z.enum(["products", "receipts", "manuals"]),
  fileExtension: z.string().min(2).max(5),
  contentType: z.string().min(3),
});

// Catalog Schemas
export const createProductSchema = z.object({
  barcode: z.string().min(4).max(64),
  title: z.string().min(1).max(128),
  brand: z.string().max(64).optional(),
  category: z.string().default("General"),
  unit: z.string().default("pcs"),
  defaultPrice: z.number().positive().optional(),
  imageKey: z.string().optional(),
});

// Cart & Stock Schemas
export const unpackCartSchema = z.object({
  transferAll: z.boolean().default(true),
  itemIds: z.array(z.string().uuid()).optional(),
  targetLocation: z.string().default("Pantry"),
  logExpense: z.boolean().default(false),
  totalAmount: z.number().positive().optional(),
  receiptImageKey: z.string().optional(),
  isSplit: z.boolean().default(false),
});

// Finance Schemas
export const updateBudgetSchema = z.object({
  monthlyBudget: z.number().nonnegative().nullable(),
  currency: z.string().min(3).max(6).optional(),
});

export const createExpenseCategorySchema = z.object({
  name: z.string().min(1).max(64),
  color: z.string().min(4).max(16).default("#0284C7"),
  monthlyBudget: z.number().nonnegative().nullable().optional(),
});

export const updateExpenseCategorySchema = createExpenseCategorySchema.partial();

export const financeDocumentInputSchema = z.object({
  fileKey: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().max(128).nullable().optional(),
});

export const createExpenseSchema = z.object({
  title: z.string().min(1).max(128),
  amount: z.number().positive(),
  categoryId: z.string().uuid().nullable().optional(),
  receiptKey: z.string().nullable().optional(),
  documents: z.array(financeDocumentInputSchema).optional(),
  date: z.string().optional(),
  isSplit: z.boolean().default(false),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const createSubscriptionSchema = z.object({
  title: z.string().min(1).max(128),
  amount: z.number().positive(),
  billingCycle: z.enum(["monthly", "yearly", "weekly"]).default("monthly"),
  nextBillingDate: z.string().min(1),
  categoryId: z.string().uuid().nullable().optional(),
  receiptKey: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial();

export const upsertSubscriptionPaymentSchema = z.object({
  amount: z.number().positive().optional(),
  isPaid: z.boolean().optional(),
  paidAt: z.string().nullable().optional(),
  logToBudget: z.boolean().optional(),
  documents: z.array(financeDocumentInputSchema).optional(),
});

export const settleSplitSchema = z.object({
  fromUserId: z.string().uuid().optional(),
  toUserId: z.string().uuid().optional(),
  amount: z.number().positive().optional(),
  note: z.string().max(256).optional(),
});

// House Management Schemas
export const createAssetSchema = z.object({
  name: z.string().min(1).max(128),
  roomLocation: z.string().min(1).max(64).default("Home"),
  brand: z.string().max(64).nullable().optional(),
  model: z.string().max(64).nullable().optional(),
  serialNumber: z.string().max(128).nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  warrantyUntil: z.string().nullable().optional(),
  manualKey: z.string().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const updateAssetSchema = createAssetSchema.partial();

export const createMaintenanceTaskSchema = z.object({
  assetId: z.string().uuid(),
  title: z.string().min(1).max(128),
  intervalDays: z.number().int().min(1).max(3650).default(90),
  nextDueDate: z.string().optional(),
  replacementPartTitle: z.string().max(128).nullable().optional(),
});

export const updateMaintenanceTaskSchema = z.object({
  title: z.string().min(1).max(128).optional(),
  intervalDays: z.number().int().min(1).max(3650).optional(),
  nextDueDate: z.string().optional(),
  replacementPartTitle: z.string().max(128).nullable().optional(),
});

export const createChoreSchema = z.object({
  title: z.string().min(1).max(128),
  cadence: z.enum(["daily", "weekly", "biweekly", "monthly", "once"]).default("weekly"),
  assignedToUserId: z.string().uuid().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export const updateChoreSchema = z.object({
  title: z.string().min(1).max(128).optional(),
  cadence: z.enum(["daily", "weekly", "biweekly", "monthly", "once"]).optional(),
  assignedToUserId: z.string().uuid().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  isCompleted: z.boolean().optional(),
});
