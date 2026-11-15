import { FastifyPluginAsync } from "fastify";
import { db } from "../../lib/db";
import {
  macroProfiles,
  usdaFoodItems,
  recipes,
  recipeIngredients,
  mealPlans,
  planMeals,
  stockItems,
  productCatalog,
  shoppingLists,
  shoppingItems,
} from "../../lib/db/schema";
import {
  updateMacroProfileSchema,
  generatePlanSchema,
  swapMealSchema,
  logDiningOutSchema,
  syncPlanToCartSchema,
  createRecipeSchema,
} from "@nook/shared";
import { eq, and, desc, sql } from "drizzle-orm";
import { USDA_STAPLES, STARTER_RECIPES } from "./services/usda-staples";
import { calculateRecipeNutrition } from "./services/nutrition-calculator";
import { generateWeeklyPlan, RecipeWithMacros } from "./services/plan-generator";
import { computeCartFromStock, NeededIngredient, StockInventoryItem } from "./services/stock-crosscheck";

/**
 * Ensures USDA staples and starter recipes exist in the database.
 */
async function ensureSeededData(householdId: string) {
  // 1. Seed USDA items if table is empty
  const existingUsda = await db.select({ count: sql<number>`count(*)::int` }).from(usdaFoodItems);
  if (!existingUsda[0] || existingUsda[0].count === 0) {
    for (const staple of USDA_STAPLES) {
      await db
        .insert(usdaFoodItems)
        .values({
          fdcId: staple.fdcId,
          name: staple.name,
          category: staple.category,
          caloriesPer100g: staple.caloriesPer100g.toString(),
          proteinPer100g: staple.proteinPer100g.toString(),
          carbsPer100g: staple.carbsPer100g.toString(),
          fatPer100g: staple.fatPer100g.toString(),
          defaultAisle: staple.defaultAisle,
        })
        .onConflictDoNothing();
    }
  }

  // 2. Seed starter recipes if none exist
  const existingRecipes = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(recipes)
    .where(eq(recipes.householdId, householdId));

  if (!existingRecipes[0] || existingRecipes[0].count === 0) {
    // Get all USDA items mapped by fdcId
    const usdaList = await db.select().from(usdaFoodItems);
    const usdaMap = new Map(usdaList.map((u) => [u.fdcId, u]));

    for (const starter of STARTER_RECIPES) {
      const [newRecipe] = await db
        .insert(recipes)
        .values({
          householdId,
          title: starter.title,
          description: starter.description,
          mealType: starter.mealType,
          prepMinutes: starter.prepMinutes,
          cookMinutes: starter.cookMinutes,
          baseServings: starter.baseServings,
          equipment: starter.equipment,
          instructions: starter.instructions,
          isBuiltin: true,
        })
        .returning();

      for (let i = 0; i < starter.ingredients.length; i++) {
        const ing = starter.ingredients[i];
        const usda = usdaMap.get(ing.fdcId);

        await db.insert(recipeIngredients).values({
          recipeId: newRecipe.id,
          name: ing.name,
          amountGrams: ing.amountGrams.toString(),
          usdaFoodId: usda?.id || null,
          packageUnitSizeGrams: ing.packageUnitSizeGrams?.toString() || null,
          estimatedPackagePrice: ing.estimatedPackagePrice?.toString() || null,
          aisle: ing.aisle,
          sortOrder: i,
        });
      }
    }
  }
}

export const mealsRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Get or Create Macro Profile
  fastify.get(
    "/profile",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Get current household macro & nutrition profile",
        tags: ["Meals"],
      },
    },
    async (request) => {
      const householdId = request.user!.householdId;
      await ensureSeededData(householdId);

      let [profile] = await db
        .select()
        .from(macroProfiles)
        .where(eq(macroProfiles.householdId, householdId));

      if (!profile) {
        [profile] = await db
          .insert(macroProfiles)
          .values({
            householdId,
            title: "Default Macro Target",
            dailyCalories: 2200,
            dailyProteinGrams: 150,
            dailyCarbsGrams: 220,
            dailyFatGrams: 70,
            weeklyGroceryBudget: "80.00",
            equipment: ["stovetop", "oven", "air_fryer"],
            householdHeadcount: 2,
            cookSessionsPerWeek: 4,
          })
          .returning();
      }

      return { profile };
    }
  );

  // 2. Update Macro Profile
  fastify.put(
    "/profile",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Update household macro targets and kitchen preferences",
        tags: ["Meals"],
      },
    },
    async (request, reply) => {
      const householdId = request.user!.householdId;
      const parseResult = updateMacroProfileSchema.safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: parseResult.error.issues[0].message,
        });
      }

      const body = parseResult.data;

      const [updated] = await db
        .insert(macroProfiles)
        .values({
          householdId,
          dailyCalories: body.dailyCalories,
          dailyProteinGrams: body.dailyProteinGrams,
          dailyCarbsGrams: body.dailyCarbsGrams ?? 220,
          dailyFatGrams: body.dailyFatGrams ?? 70,
          weeklyGroceryBudget: body.weeklyGroceryBudget ? body.weeklyGroceryBudget.toString() : "80.00",
          equipment: body.equipment,
          excludedIngredients: body.excludedIngredients,
          householdHeadcount: body.householdHeadcount,
          cookSessionsPerWeek: body.cookSessionsPerWeek,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: macroProfiles.householdId,
          set: {
            dailyCalories: body.dailyCalories,
            dailyProteinGrams: body.dailyProteinGrams,
            dailyCarbsGrams: body.dailyCarbsGrams ?? 220,
            dailyFatGrams: body.dailyFatGrams ?? 70,
            weeklyGroceryBudget: body.weeklyGroceryBudget ? body.weeklyGroceryBudget.toString() : "80.00",
            equipment: body.equipment,
            excludedIngredients: body.excludedIngredients,
            householdHeadcount: body.householdHeadcount,
            cookSessionsPerWeek: body.cookSessionsPerWeek,
            updatedAt: new Date(),
          },
        })
        .returning();

      return { profile: updated };
    }
  );

  // 3. List Recipes with line-by-line computed nutrition
  fastify.get(
    "/recipes",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "List verified recipes with USDA nutrition breakdown",
        tags: ["Meals"],
      },
    },
    async (request) => {
      const householdId = request.user!.householdId;
      await ensureSeededData(householdId);

      const allRecipes = await db
        .select()
        .from(recipes)
        .where(eq(recipes.householdId, householdId));

      const recipeList = [];

      for (const r of allRecipes) {
        const ingredients = await db
          .select({
            id: recipeIngredients.id,
            name: recipeIngredients.name,
            amountGrams: recipeIngredients.amountGrams,
            packageUnitSizeGrams: recipeIngredients.packageUnitSizeGrams,
            estimatedPackagePrice: recipeIngredients.estimatedPackagePrice,
            aisle: recipeIngredients.aisle,
            sortOrder: recipeIngredients.sortOrder,
            usdaId: usdaFoodItems.id,
            usdaFdcId: usdaFoodItems.fdcId,
            usdaName: usdaFoodItems.name,
            caloriesPer100g: usdaFoodItems.caloriesPer100g,
            proteinPer100g: usdaFoodItems.proteinPer100g,
            carbsPer100g: usdaFoodItems.carbsPer100g,
            fatPer100g: usdaFoodItems.fatPer100g,
          })
          .from(recipeIngredients)
          .leftJoin(usdaFoodItems, eq(recipeIngredients.usdaFoodId, usdaFoodItems.id))
          .where(eq(recipeIngredients.recipeId, r.id));

        const nutrition = calculateRecipeNutrition(
          ingredients.map((ing) => ({
            name: ing.name,
            amountGrams: Number(ing.amountGrams),
            usda: ing.usdaId
              ? {
                  fdcId: ing.usdaFdcId || undefined,
                  caloriesPer100g: ing.caloriesPer100g || 0,
                  proteinPer100g: ing.proteinPer100g || 0,
                  carbsPer100g: ing.carbsPer100g || 0,
                  fatPer100g: ing.fatPer100g || 0,
                }
              : null,
          })),
          r.baseServings
        );

        recipeList.push({
          ...r,
          ingredients: ingredients.map((ing, idx) => ({
            ...ing,
            amountGrams: Number(ing.amountGrams),
            calculation: nutrition.lineItems[idx],
          })),
          caloriesPerServing: nutrition.perServing.calories,
          proteinPerServing: nutrition.perServing.proteinGrams,
          carbsPerServing: nutrition.perServing.carbsGrams,
          fatPerServing: nutrition.perServing.fatGrams,
          totalNutrition: nutrition.total,
        });
      }

      return { recipes: recipeList };
    }
  );

  // 4. Get Active 7-Day Plan
  fastify.get(
    "/active-plan",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Get active 7-day meal plan with daily macro totals and compliance",
        tags: ["Meals"],
      },
    },
    async (request) => {
      const householdId = request.user!.householdId;
      await ensureSeededData(householdId);

      // Find active plan
      let [plan] = await db
        .select()
        .from(mealPlans)
        .where(
          and(
            eq(mealPlans.householdId, householdId),
            eq(mealPlans.status, "active")
          )
        )
        .orderBy(desc(mealPlans.createdAt))
        .limit(1);

      const [profile] = await db
        .select()
        .from(macroProfiles)
        .where(eq(macroProfiles.householdId, householdId));

      const targetCalories = profile ? profile.dailyCalories : 2200;
      const targetProtein = profile ? profile.dailyProteinGrams : 150;

      if (!plan) {
        return { plan: null, days: [] };
      }

      // Fetch all meals for this plan
      const meals = await db
        .select({
          id: planMeals.id,
          planId: planMeals.planId,
          date: planMeals.date,
          mealType: planMeals.mealType,
          recipeId: planMeals.recipeId,
          customName: planMeals.customName,
          servings: planMeals.servings,
          computedCalories: planMeals.computedCalories,
          computedProteinGrams: planMeals.computedProteinGrams,
          computedCarbsGrams: planMeals.computedCarbsGrams,
          computedFatGrams: planMeals.computedFatGrams,
          isBatchRepeat: planMeals.isBatchRepeat,
          isDiningOut: planMeals.isDiningOut,
          isCooked: planMeals.isCooked,
          notes: planMeals.notes,
          recipeTitle: recipes.title,
          recipePrepMinutes: recipes.prepMinutes,
          recipeCookMinutes: recipes.cookMinutes,
          recipeEquipment: recipes.equipment,
          recipeInstructions: recipes.instructions,
        })
        .from(planMeals)
        .leftJoin(recipes, eq(planMeals.recipeId, recipes.id))
        .where(eq(planMeals.planId, plan.id));

      // Group meals by date
      const daysMap = new Map<string, typeof meals>();
      for (const m of meals) {
        const list = daysMap.get(m.date) || [];
        list.push(m);
        daysMap.set(m.date, list);
      }

      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const days = Array.from(daysMap.entries())
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, dayMeals]) => {
          const dateObj = new Date(date + "T12:00:00Z");
          const dayName = dayNames[dateObj.getUTCDay()];

          const totalCalories = dayMeals.reduce((sum, m) => sum + m.computedCalories, 0);
          const totalProteinGrams = Number(
            dayMeals.reduce((sum, m) => sum + Number(m.computedProteinGrams), 0).toFixed(1)
          );
          const totalCarbsGrams = Number(
            dayMeals.reduce((sum, m) => sum + Number(m.computedCarbsGrams), 0).toFixed(1)
          );
          const totalFatGrams = Number(
            dayMeals.reduce((sum, m) => sum + Number(m.computedFatGrams), 0).toFixed(1)
          );

          const isCalorieCompliant = totalCalories >= targetCalories * 0.85 && totalCalories <= targetCalories * 1.15;
          const isProteinCompliant = totalProteinGrams >= targetProtein * 0.85;

          return {
            date,
            dayName,
            meals: dayMeals,
            totalCalories,
            totalProteinGrams,
            totalCarbsGrams,
            totalFatGrams,
            targetCalories,
            targetProteinGrams: targetProtein,
            isCalorieCompliant,
            isProteinCompliant,
          };
        });

      return { plan, profile, days };
    }
  );

  // 5. Generate New 7-Day Plan
  fastify.post(
    "/generate",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Generate a new 7-day meal plan satisfying daily macro targets",
        tags: ["Meals"],
      },
    },
    async (request, reply) => {
      const householdId = request.user!.householdId;
      await ensureSeededData(householdId);

      const parseResult = generatePlanSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: parseResult.error.issues[0].message,
        });
      }

      const { startDate, batchRepetition } = parseResult.data;

      const [profile] = await db
        .select()
        .from(macroProfiles)
        .where(eq(macroProfiles.householdId, householdId));

      const targetCalories = parseResult.data.targetCalories || profile?.dailyCalories || 2200;
      const targetProtein = parseResult.data.targetProteinGrams || profile?.dailyProteinGrams || 150;

      // Get recipes with calculated nutrition
      const allRecipes = await db
        .select()
        .from(recipes)
        .where(eq(recipes.householdId, householdId));

      const recipesWithMacros: RecipeWithMacros[] = [];

      for (const r of allRecipes) {
        const ingredients = await db
          .select({
            amountGrams: recipeIngredients.amountGrams,
            name: recipeIngredients.name,
            usdaId: usdaFoodItems.id,
            fdcId: usdaFoodItems.fdcId,
            caloriesPer100g: usdaFoodItems.caloriesPer100g,
            proteinPer100g: usdaFoodItems.proteinPer100g,
            carbsPer100g: usdaFoodItems.carbsPer100g,
            fatPer100g: usdaFoodItems.fatPer100g,
          })
          .from(recipeIngredients)
          .leftJoin(usdaFoodItems, eq(recipeIngredients.usdaFoodId, usdaFoodItems.id))
          .where(eq(recipeIngredients.recipeId, r.id));

        const nutrition = calculateRecipeNutrition(
          ingredients.map((ing) => ({
            name: ing.name,
            amountGrams: Number(ing.amountGrams),
            usda: ing.usdaId
              ? {
                  fdcId: ing.fdcId || undefined,
                  caloriesPer100g: ing.caloriesPer100g || 0,
                  proteinPer100g: ing.proteinPer100g || 0,
                  carbsPer100g: ing.carbsPer100g || 0,
                  fatPer100g: ing.fatPer100g || 0,
                }
              : null,
          })),
          r.baseServings
        );

        recipesWithMacros.push({
          id: r.id,
          title: r.title,
          mealType: r.mealType as any,
          equipment: r.equipment,
          baseServings: r.baseServings,
          caloriesPerServing: nutrition.perServing.calories,
          proteinPerServing: nutrition.perServing.proteinGrams,
          carbsPerServing: nutrition.perServing.carbsGrams,
          fatPerServing: nutrition.perServing.fatGrams,
        });
      }

      // Generate 7-day schedule
      const schedules = generateWeeklyPlan({
        startDate,
        targetCalories,
        targetProteinGrams: targetProtein,
        availableRecipes: recipesWithMacros,
        batchRepetition,
      });

      // Archive any existing active plans for this household
      await db
        .update(mealPlans)
        .set({ status: "archived", updatedAt: new Date() })
        .where(
          and(
            eq(mealPlans.householdId, householdId),
            eq(mealPlans.status, "active")
          )
        );

      const endDate = schedules[schedules.length - 1].date;

      // Insert new plan
      const [newPlan] = await db
        .insert(mealPlans)
        .values({
          householdId,
          profileId: profile?.id || null,
          startDate,
          endDate,
          status: "active",
        })
        .returning();

      // Insert plan meals
      for (const day of schedules) {
        for (const m of day.meals) {
          await db.insert(planMeals).values({
            planId: newPlan.id,
            date: m.date,
            mealType: m.mealType,
            recipeId: m.recipeId,
            servings: m.servings,
            computedCalories: m.calories,
            computedProteinGrams: m.proteinGrams.toString(),
            computedCarbsGrams: m.carbsGrams.toString(),
            computedFatGrams: m.fatGrams.toString(),
            isBatchRepeat: m.isBatchRepeat,
          });
        }
      }

      return { plan: newPlan, schedules };
    }
  );

  // 6. Swap Meal Slot
  fastify.post(
    "/swap",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Swap an existing meal slot with an alternative recipe",
        tags: ["Meals"],
      },
    },
    async (request, reply) => {
      const parseResult = swapMealSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: parseResult.error.issues[0].message,
        });
      }

      const { planMealId, newRecipeId } = parseResult.data;

      const [recipe] = await db
        .select()
        .from(recipes)
        .where(eq(recipes.id, newRecipeId));

      if (!recipe) {
        return reply.status(404).send({ statusCode: 404, message: "Recipe not found" });
      }

      // Calculate nutrition for new recipe
      const ingredients = await db
        .select({
          amountGrams: recipeIngredients.amountGrams,
          name: recipeIngredients.name,
          usdaId: usdaFoodItems.id,
          caloriesPer100g: usdaFoodItems.caloriesPer100g,
          proteinPer100g: usdaFoodItems.proteinPer100g,
          carbsPer100g: usdaFoodItems.carbsPer100g,
          fatPer100g: usdaFoodItems.fatPer100g,
        })
        .from(recipeIngredients)
        .leftJoin(usdaFoodItems, eq(recipeIngredients.usdaFoodId, usdaFoodItems.id))
        .where(eq(recipeIngredients.recipeId, recipe.id));

      const nutrition = calculateRecipeNutrition(
        ingredients.map((ing) => ({
          name: ing.name,
          amountGrams: Number(ing.amountGrams),
          usda: ing.usdaId
            ? {
                caloriesPer100g: ing.caloriesPer100g || 0,
                proteinPer100g: ing.proteinPer100g || 0,
                carbsPer100g: ing.carbsPer100g || 0,
                fatPer100g: ing.fatPer100g || 0,
              }
            : null,
        })),
        recipe.baseServings
      );

      const [updated] = await db
        .update(planMeals)
        .set({
          recipeId: recipe.id,
          customName: null,
          computedCalories: nutrition.perServing.calories,
          computedProteinGrams: nutrition.perServing.proteinGrams.toString(),
          computedCarbsGrams: nutrition.perServing.carbsGrams.toString(),
          computedFatGrams: nutrition.perServing.fatGrams.toString(),
          isBatchRepeat: false,
          isDiningOut: false,
          updatedAt: new Date(),
        })
        .where(eq(planMeals.id, planMealId))
        .returning();

      return { meal: updated, recipe, nutrition: nutrition.perServing };
    }
  );

  // 7. Log Dining Out for a Meal Slot
  fastify.post(
    "/dining-out",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Log restaurant meal or dining out allocation for a meal slot",
        tags: ["Meals"],
      },
    },
    async (request, reply) => {
      const parseResult = logDiningOutSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: parseResult.error.issues[0].message,
        });
      }

      const { planMealId, customName, estimatedCalories, estimatedProteinGrams } = parseResult.data;

      const [updated] = await db
        .update(planMeals)
        .set({
          recipeId: null,
          customName,
          computedCalories: estimatedCalories,
          computedProteinGrams: estimatedProteinGrams.toString(),
          computedCarbsGrams: "0.0",
          computedFatGrams: "0.0",
          isDiningOut: true,
          updatedAt: new Date(),
        })
        .where(eq(planMeals.id, planMealId))
        .returning();

      return { meal: updated };
    }
  );

  // 8. Cross-check Stock and Sync to Shopping Cart
  fastify.post(
    "/sync-to-cart",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Cross-checks plan requirements against pantry stock and populates Nook Shopping Cart",
        tags: ["Meals"],
      },
    },
    async (request, reply) => {
      const householdId = request.user!.householdId;
      const parseResult = syncPlanToCartSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: parseResult.error.issues[0].message,
        });
      }

      const { planId, deductStock, roundToPackageUnit } = parseResult.data;

      // 1. Get all uncooked, non-dining-out meals in this plan
      const meals = await db
        .select()
        .from(planMeals)
        .where(
          and(
            eq(planMeals.planId, planId),
            eq(planMeals.isDiningOut, false),
            eq(planMeals.isCooked, false)
          )
        );

      const recipeIds = Array.from(new Set(meals.map((m) => m.recipeId).filter(Boolean))) as string[];
      if (recipeIds.length === 0) {
        return { message: "No recipes found in plan to sync", itemsAdded: 0 };
      }

      // Count recipe occurrences
      const recipeCounts = new Map<string, number>();
      for (const m of meals) {
        if (m.recipeId) {
          // If it's a batch repeat, it consumed portions from the original cooked batch!
          if (!m.isBatchRepeat) {
            recipeCounts.set(m.recipeId, (recipeCounts.get(m.recipeId) || 0) + 1);
          }
        }
      }

      // Aggregate ingredient requirements
      const neededMap = new Map<string, NeededIngredient>();

      for (const [rId, count] of recipeCounts.entries()) {
        const ingredients = await db
          .select()
          .from(recipeIngredients)
          .where(eq(recipeIngredients.recipeId, rId));

        for (const ing of ingredients) {
          const grams = Number(ing.amountGrams) * count;
          const key = ing.name.toLowerCase();
          const existing = neededMap.get(key);

          if (existing) {
            existing.totalGramsNeeded += grams;
          } else {
            neededMap.set(key, {
              name: ing.name,
              totalGramsNeeded: grams,
              packageUnitSizeGrams: ing.packageUnitSizeGrams ? Number(ing.packageUnitSizeGrams) : null,
              estimatedPackagePrice: ing.estimatedPackagePrice ? Number(ing.estimatedPackagePrice) : null,
              aisle: ing.aisle,
              catalogProductId: ing.catalogProductId,
            });
          }
        }
      }

      // 2. Fetch household current stock if stock deduction is enabled
      let stockList: StockInventoryItem[] = [];
      if (deductStock) {
        const dbStock = await db
          .select({
            id: stockItems.id,
            quantity: stockItems.quantity,
            unit: stockItems.unit,
            location: stockItems.location,
            productTitle: productCatalog.title,
          })
          .from(stockItems)
          .leftJoin(productCatalog, eq(stockItems.productId, productCatalog.id))
          .where(eq(stockItems.householdId, householdId));

        stockList = dbStock.map((s) => ({
          id: s.id,
          name: s.productTitle || "Unknown",
          quantity: Number(s.quantity),
          unit: s.unit,
          location: s.location,
        }));
      }

      const { itemsToBuy, itemsCovered, estimatedTotalCost } = computeCartFromStock(
        Array.from(neededMap.values()),
        stockList
      );

      // 3. Get or create active shopping cart
      let [cart] = await db
        .select()
        .from(shoppingLists)
        .where(
          and(
            eq(shoppingLists.householdId, householdId),
            eq(shoppingLists.status, "preparing")
          )
        );

      if (!cart) {
        [cart] = await db
          .insert(shoppingLists)
          .values({
            householdId,
            title: "Mealbird Weekly Groceries",
            status: "preparing",
          })
          .returning();
      }

      // 4. Add items to shopping list
      let itemsAdded = 0;
      for (const item of itemsToBuy) {
        const quantity = roundToPackageUnit && item.packageUnitsToBuy > 0 ? item.packageUnitsToBuy : Math.ceil(item.deficitGrams);
        const unit = roundToPackageUnit && item.packageUnitsToBuy > 0 ? "pack" : "g";

        await db.insert(shoppingItems).values({
          listId: cart.id,
          productId: item.catalogProductId || null,
          customTitle: `${item.name} (${item.neededGrams}g needed)`,
          quantity: quantity.toString(),
          unit,
          estimatedPrice: item.estimatedCost > 0 ? item.estimatedCost.toString() : null,
          targetLocation: item.aisle === "Produce" || item.aisle === "Dairy & Eggs" || item.aisle === "Meat & Seafood" ? "Fridge" : "Pantry",
          notes: `Aisle: ${item.aisle} • Est: €${item.estimatedCost}`,
        });
        itemsAdded++;
      }

      return {
        cartId: cart.id,
        itemsAdded,
        itemsToBuy,
        itemsCovered,
        estimatedTotalCost,
      };
    }
  );

  // 9. Mark Meal Cooked & Deduct Stock
  fastify.post(
    "/plan-meals/:id/cook",
    {
      preHandler: fastify.authenticate,
      schema: {
        description: "Mark a meal as cooked and optionally deduct consumed ingredients from stock",
        tags: ["Meals"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const [meal] = await db
        .select()
        .from(planMeals)
        .where(eq(planMeals.id, id));

      if (!meal) {
        return reply.status(404).send({ statusCode: 404, message: "Meal not found" });
      }

      const [updated] = await db
        .update(planMeals)
        .set({
          isCooked: !meal.isCooked,
          updatedAt: new Date(),
        })
        .where(eq(planMeals.id, id))
        .returning();

      return { meal: updated };
    }
  );
};
