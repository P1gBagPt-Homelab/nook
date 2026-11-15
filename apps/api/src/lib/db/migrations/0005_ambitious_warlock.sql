CREATE TABLE "macro_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"title" text DEFAULT 'Default Goal' NOT NULL,
	"daily_calories" integer DEFAULT 2200 NOT NULL,
	"daily_protein_grams" integer DEFAULT 150 NOT NULL,
	"daily_carbs_grams" integer DEFAULT 220 NOT NULL,
	"daily_fat_grams" integer DEFAULT 70 NOT NULL,
	"weekly_grocery_budget" numeric(10, 2) DEFAULT '80.00',
	"equipment" jsonb DEFAULT '["stovetop","oven"]'::jsonb NOT NULL,
	"excluded_ingredients" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"household_headcount" integer DEFAULT 2 NOT NULL,
	"cook_sessions_per_week" integer DEFAULT 4 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"profile_id" uuid,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"date" text NOT NULL,
	"meal_type" text NOT NULL,
	"recipe_id" uuid,
	"custom_name" text,
	"servings" integer DEFAULT 1 NOT NULL,
	"computed_calories" integer NOT NULL,
	"computed_protein_grams" numeric(5, 1) NOT NULL,
	"computed_carbs_grams" numeric(5, 1) DEFAULT '0.0' NOT NULL,
	"computed_fat_grams" numeric(5, 1) DEFAULT '0.0' NOT NULL,
	"is_batch_repeat" boolean DEFAULT false NOT NULL,
	"is_dining_out" boolean DEFAULT false NOT NULL,
	"is_cooked" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"name" text NOT NULL,
	"amount_grams" numeric(7, 2) NOT NULL,
	"usda_food_id" uuid,
	"catalog_product_id" uuid,
	"package_unit_size_grams" numeric(7, 2),
	"estimated_package_price" numeric(10, 2),
	"aisle" text DEFAULT 'Pantry' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"meal_type" text DEFAULT 'dinner' NOT NULL,
	"prep_minutes" integer DEFAULT 10 NOT NULL,
	"cook_minutes" integer DEFAULT 20 NOT NULL,
	"base_servings" integer DEFAULT 2 NOT NULL,
	"equipment" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"instructions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usda_food_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fdc_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"calories_per_100g" numeric(6, 1) NOT NULL,
	"protein_per_100g" numeric(5, 1) NOT NULL,
	"carbs_per_100g" numeric(5, 1) NOT NULL,
	"fat_per_100g" numeric(5, 1) NOT NULL,
	"default_aisle" text DEFAULT 'Pantry' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usda_food_items_fdc_id_unique" UNIQUE("fdc_id")
);
--> statement-breakpoint
ALTER TABLE "macro_profiles" ADD CONSTRAINT "macro_profiles_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_profile_id_macro_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."macro_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_meals" ADD CONSTRAINT "plan_meals_plan_id_meal_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."meal_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_meals" ADD CONSTRAINT "plan_meals_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_usda_food_id_usda_food_items_id_fk" FOREIGN KEY ("usda_food_id") REFERENCES "public"."usda_food_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_catalog_product_id_product_catalog_id_fk" FOREIGN KEY ("catalog_product_id") REFERENCES "public"."product_catalog"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_macro_profiles_household" ON "macro_profiles" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_meal_plans_household" ON "meal_plans" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_meal_plans_dates" ON "meal_plans" USING btree ("household_id","start_date","status");--> statement-breakpoint
CREATE INDEX "idx_plan_meals_plan" ON "plan_meals" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_plan_meals_date" ON "plan_meals" USING btree ("plan_id","date");--> statement-breakpoint
CREATE INDEX "idx_recipe_ingredients_recipe" ON "recipe_ingredients" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "idx_recipes_meal_type" ON "recipes" USING btree ("meal_type");--> statement-breakpoint
CREATE INDEX "idx_recipes_household" ON "recipes" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_usda_name" ON "usda_food_items" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_usda_category" ON "usda_food_items" USING btree ("category");