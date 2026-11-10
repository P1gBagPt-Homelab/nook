import { pgTable, text, timestamp, uuid, boolean, numeric, integer, index } from "drizzle-orm/pg-core";

// 1. Households & Multi-User Identity
export const households = pgTable("households", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").default("EUR").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash"),
  mustSetPassword: boolean("must_set_password").default(false).notNull(),
  inviteToken: text("invite_token").unique(),
  inviteTokenExpiresAt: timestamp("invite_token_expires_at", { withTimezone: true }),
  role: text("role", { enum: ["admin", "member", "viewer"] }).default("member").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_users_household").on(t.householdId),
  index("idx_users_email").on(t.email),
]);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_sessions_user").on(t.userId),
]);

// 2. Master Product Catalog (EAN/UPC Barcodes)
export const productCatalog = pgTable("product_catalog", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  barcode: text("barcode").notNull(),
  title: text("title").notNull(),
  brand: text("brand"),
  description: text("description"),
  category: text("category").default("General").notNull(),
  unit: text("unit").default("pcs").notNull(),
  defaultPrice: numeric("default_price", { precision: 10, scale: 2 }),
  imageKey: text("image_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_catalog_barcode").on(t.householdId, t.barcode),
  index("idx_catalog_category").on(t.householdId, t.category),
]);

// 3. Grocery Module: Shopping Lists (3-Phase Lifecycle)
export const shoppingLists = pgTable("shopping_lists", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  storeName: text("store_name"),
  status: text("status", { enum: ["preparing", "shopping", "completed", "archived"] }).default("preparing").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  unpackedAt: timestamp("unpacked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_shopping_lists_household").on(t.householdId),
]);

export const shoppingItems = pgTable("shopping_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  listId: uuid("list_id").references(() => shoppingLists.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => productCatalog.id, { onDelete: "set null" }),
  customTitle: text("custom_title"),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).default("1.0").notNull(),
  unit: text("unit").default("pcs").notNull(),
  estimatedPrice: numeric("estimated_price", { precision: 10, scale: 2 }),
  isCollected: boolean("is_collected").default(false).notNull(),
  collectedAt: timestamp("collected_at", { withTimezone: true }),
  isTransferredToStock: boolean("is_transferred_to_stock").default(false).notNull(),
  transferredAt: timestamp("transferred_at", { withTimezone: true }),
  targetLocation: text("target_location").default("Pantry"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_shopping_items_list").on(t.listId),
  index("idx_shopping_items_collected").on(t.listId, t.isCollected),
]);

// 4. Grocery Module: Home Stock Inventory
export const stockItems = pgTable("stock_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => productCatalog.id, { onDelete: "cascade" }).notNull(),
  location: text("location").default("Pantry").notNull(), // Fridge, Freezer, Dry Pantry, Cleaning
  status: text("status", { enum: ["in_stock", "running_low", "out_of_stock"] }).default("in_stock").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).default("1.0").notNull(),
  unit: text("unit").default("pcs").notNull(),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_stock_household").on(t.householdId),
  index("idx_stock_status").on(t.householdId, t.status),
]);

// 5. Finance Module: Expenses, Splits & Subscriptions
export const expenseCategories = pgTable("expense_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  color: text("color").default("#FF7A59").notNull(),
  monthlyBudget: numeric("monthly_budget", { precision: 10, scale: 2 }),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  paidByUserId: uuid("paid_by_user_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  categoryId: uuid("category_id").references(() => expenseCategories.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  title: text("title").notNull(),
  receiptKey: text("receipt_key"),
  isSplit: boolean("is_split").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_expenses_household_date").on(t.householdId, t.date),
]);
