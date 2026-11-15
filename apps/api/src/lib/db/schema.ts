import { pgTable, text, timestamp, uuid, boolean, numeric, integer, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

// 1. Households & Multi-User Identity
export const households = pgTable("households", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").default("EUR").notNull(),
  monthlyBudget: numeric("monthly_budget", { precision: 10, scale: 2 }),
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
  uniqueIndex("idx_catalog_barcode").on(t.householdId, t.barcode),
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
  isSettled: boolean("is_settled").default(false).notNull(),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_expenses_household_date").on(t.householdId, t.date),
]);

export const expenseSettlements = pgTable("expense_settlements", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  fromUserId: uuid("from_user_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  toUserId: uuid("to_user_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  note: text("note"),
  isCleared: boolean("is_cleared").default(false).notNull(),
  settledAt: timestamp("settled_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_expense_settlements_household").on(t.householdId),
]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  categoryId: uuid("category_id").references(() => expenseCategories.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  billingCycle: text("billing_cycle", { enum: ["monthly", "yearly", "weekly"] }).default("monthly").notNull(),
  nextBillingDate: timestamp("next_billing_date", { withTimezone: true }).notNull(),
  receiptKey: text("receipt_key"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_subscriptions_household").on(t.householdId),
]);

export const subscriptionPayments = pgTable("subscription_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id, { onDelete: "cascade" }).notNull(),
  periodKey: text("period_key").notNull(), // YYYY-MM
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean("is_paid").default(true).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paidByUserId: uuid("paid_by_user_id").references(() => users.id, { onDelete: "set null" }),
  expenseId: uuid("expense_id").references(() => expenses.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("idx_sub_payments_period").on(t.subscriptionId, t.periodKey),
  index("idx_sub_payments_household_period").on(t.householdId, t.periodKey),
]);

export const financeDocuments = pgTable("finance_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  expenseId: uuid("expense_id").references(() => expenses.id, { onDelete: "cascade" }),
  subscriptionPaymentId: uuid("subscription_payment_id").references(() => subscriptionPayments.id, { onDelete: "cascade" }),
  fileKey: text("file_key").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_finance_docs_expense").on(t.expenseId),
  index("idx_finance_docs_sub_payment").on(t.subscriptionPaymentId),
]);

// 6. House Management Module: Assets, Maintenance Timers & Chores
export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  roomLocation: text("room_location").default("Home").notNull(),
  brand: text("brand"),
  model: text("model"),
  serialNumber: text("serial_number"),
  purchaseDate: timestamp("purchase_date", { withTimezone: true }),
  warrantyUntil: timestamp("warranty_until", { withTimezone: true }),
  manualKey: text("manual_key"),
  qrCodeToken: text("qr_code_token").notNull().unique(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_assets_household").on(t.householdId),
]);

export const maintenanceTasks = pgTable("maintenance_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  assetId: uuid("asset_id").references(() => assets.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  intervalDays: integer("interval_days").default(90).notNull(),
  lastCompletedAt: timestamp("last_completed_at", { withTimezone: true }),
  nextDueDate: timestamp("next_due_date", { withTimezone: true }).notNull(),
  replacementPartTitle: text("replacement_part_title"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_maintenance_household").on(t.householdId),
  index("idx_maintenance_due").on(t.householdId, t.nextDueDate),
]);

export const chores = pgTable("chores", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  cadence: text("cadence", { enum: ["daily", "weekly", "biweekly", "monthly", "once"] }).default("weekly").notNull(),
  assignedToUserId: uuid("assigned_to_user_id").references(() => users.id, { onDelete: "set null" }),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  completedByUserId: uuid("completed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  streakCount: integer("streak_count").default(0).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_chores_household").on(t.householdId),
]);

// 7. Mealbird-Inspired Macro Meal Planning & USDA Nutrition
export const macroProfiles = pgTable("macro_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  title: text("title").default("Default Goal").notNull(),
  dailyCalories: integer("daily_calories").default(2200).notNull(),
  dailyProteinGrams: integer("daily_protein_grams").default(150).notNull(),
  dailyCarbsGrams: integer("daily_carbs_grams").default(220).notNull(),
  dailyFatGrams: integer("daily_fat_grams").default(70).notNull(),
  weeklyGroceryBudget: numeric("weekly_grocery_budget", { precision: 10, scale: 2 }).default("80.00"),
  equipment: jsonb("equipment").$type<string[]>().default(["stovetop", "oven"]).notNull(),
  excludedIngredients: jsonb("excluded_ingredients").$type<string[]>().default([]).notNull(),
  householdHeadcount: integer("household_headcount").default(2).notNull(),
  cookSessionsPerWeek: integer("cook_sessions_per_week").default(4).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_macro_profiles_household").on(t.householdId),
]);

export const usdaFoodItems = pgTable("usda_food_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  fdcId: text("fdc_id").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'Poultry Products', 'Vegetables', 'Grains', etc.
  caloriesPer100g: numeric("calories_per_100g", { precision: 6, scale: 1 }).notNull(),
  proteinPer100g: numeric("protein_per_100g", { precision: 5, scale: 1 }).notNull(),
  carbsPer100g: numeric("carbs_per_100g", { precision: 5, scale: 1 }).notNull(),
  fatPer100g: numeric("fat_per_100g", { precision: 5, scale: 1 }).notNull(),
  defaultAisle: text("default_aisle").default("Pantry").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_usda_name").on(t.name),
  index("idx_usda_category").on(t.category),
]);

export const recipes = pgTable("recipes", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  mealType: text("meal_type", { enum: ["breakfast", "lunch", "dinner", "snack"] }).default("dinner").notNull(),
  prepMinutes: integer("prep_minutes").default(10).notNull(),
  cookMinutes: integer("cook_minutes").default(20).notNull(),
  baseServings: integer("base_servings").default(2).notNull(),
  equipment: jsonb("equipment").$type<string[]>().default([]).notNull(),
  instructions: jsonb("instructions").$type<string[]>().default([]).notNull(),
  isBuiltin: boolean("is_builtin").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_recipes_meal_type").on(t.mealType),
  index("idx_recipes_household").on(t.householdId),
]);

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id").references(() => recipes.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  amountGrams: numeric("amount_grams", { precision: 7, scale: 2 }).notNull(),
  usdaFoodId: uuid("usda_food_id").references(() => usdaFoodItems.id, { onDelete: "set null" }),
  catalogProductId: uuid("catalog_product_id").references(() => productCatalog.id, { onDelete: "set null" }),
  packageUnitSizeGrams: numeric("package_unit_size_grams", { precision: 7, scale: 2 }),
  estimatedPackagePrice: numeric("estimated_package_price", { precision: 10, scale: 2 }),
  aisle: text("aisle").default("Pantry").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
}, (t) => [
  index("idx_recipe_ingredients_recipe").on(t.recipeId),
]);

export const mealPlans = pgTable("meal_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  profileId: uuid("profile_id").references(() => macroProfiles.id, { onDelete: "set null" }),
  startDate: text("start_date").notNull(), // 'YYYY-MM-DD'
  endDate: text("end_date").notNull(), // 'YYYY-MM-DD'
  status: text("status", { enum: ["active", "archived"] }).default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_meal_plans_household").on(t.householdId),
  index("idx_meal_plans_dates").on(t.householdId, t.startDate, t.status),
]);

export const planMeals = pgTable("plan_meals", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").references(() => mealPlans.id, { onDelete: "cascade" }).notNull(),
  date: text("date").notNull(), // 'YYYY-MM-DD'
  mealType: text("meal_type", { enum: ["breakfast", "lunch", "dinner", "snack"] }).notNull(),
  recipeId: uuid("recipe_id").references(() => recipes.id, { onDelete: "set null" }),
  customName: text("custom_name"),
  servings: integer("servings").default(1).notNull(),
  computedCalories: integer("computed_calories").notNull(),
  computedProteinGrams: numeric("computed_protein_grams", { precision: 5, scale: 1 }).notNull(),
  computedCarbsGrams: numeric("computed_carbs_grams", { precision: 5, scale: 1 }).default("0.0").notNull(),
  computedFatGrams: numeric("computed_fat_grams", { precision: 5, scale: 1 }).default("0.0").notNull(),
  isBatchRepeat: boolean("is_batch_repeat").default(false).notNull(),
  isDiningOut: boolean("is_dining_out").default(false).notNull(),
  isCooked: boolean("is_cooked").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_plan_meals_plan").on(t.planId),
  index("idx_plan_meals_date").on(t.planId, t.date),
]);
