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
});
