import { db } from "../../../lib/db";
import {
  recipes,
  recipeIngredients,
  mealPlans,
  planMeals,
} from "../../../lib/db/schema";
import { generateDynamicRecipe, AiGeneratorOptions } from "./ai-recipe-generator";
import { addDaysToDateString } from "./plan-generator";

export interface DynamicPlanOptions {
  householdId: string;
  profileId?: string | null;
  startDate: string;
  targetCalories: number;
  targetProteinGrams: number;
  repeatMode: "none" | "smart_repeats";
  cookSessions?: number;
  excludedIngredients?: string[];
  equipment?: string[];
  pantryItems?: string[];
  usdaCatalog: AiGeneratorOptions["usdaCatalog"];
}

export async function generateAndSaveDynamicPlan(options: DynamicPlanOptions) {
  const {
    householdId,
    profileId,
    startDate,
    targetCalories,
    targetProteinGrams,
    repeatMode,
    cookSessions = 4,
    excludedIngredients = [],
    equipment = ["stovetop", "oven", "air_fryer"],
    pantryItems = [],
    usdaCatalog,
  } = options;

  // Split targets by meal slot
  const bCalories = Math.round(targetCalories * 0.25);
  const bProtein = Math.round(targetProteinGrams * 0.25);

  const lCalories = Math.round(targetCalories * 0.35);
  const lProtein = Math.round(targetProteinGrams * 0.35);

  const dCalories = Math.round(targetCalories * 0.40);
  const dProtein = Math.round(targetProteinGrams * 0.40);

  // Helper to create and persist a dynamic recipe to Postgres
  async function createRecipe(mealType: "breakfast" | "lunch" | "dinner", cal: number, prot: number) {
    const dyn = await generateDynamicRecipe({
      mealType,
      targetCalories: cal,
      targetProteinGrams: prot,
      excludedIngredients,
      equipment,
      pantryItems,
      usdaCatalog,
    });

    const [saved] = await db
      .insert(recipes)
      .values({
        householdId,
        title: dyn.title,
        description: dyn.description,
        mealType: dyn.mealType,
        prepMinutes: dyn.prepMinutes,
        cookMinutes: dyn.cookMinutes,
        baseServings: 2,
        equipment: dyn.equipment,
        instructions: dyn.instructions,
        isBuiltin: false,
      })
      .returning();

    for (let i = 0; i < dyn.ingredients.length; i++) {
      const ing = dyn.ingredients[i];
      await db.insert(recipeIngredients).values({
        recipeId: saved.id,
        name: ing.name,
        amountGrams: ing.amountGrams.toString(),
        usdaFoodId: ing.usdaId || null,
        packageUnitSizeGrams: ing.packageUnitSizeGrams ? ing.packageUnitSizeGrams.toString() : null,
        estimatedPackagePrice: ing.estimatedPackagePrice ? ing.estimatedPackagePrice.toString() : null,
        aisle: ing.aisle,
        sortOrder: i,
      });
    }

    return {
      recipeId: saved.id,
      title: dyn.title,
      calories: dyn.computedCalories,
      proteinGrams: dyn.computedProteinGrams,
      carbsGrams: dyn.computedCarbsGrams,
      fatGrams: dyn.computedFatGrams,
    };
  }

  // 1. Generate Recipes based on repeat mode
  const generatedBreakfasts = [];
  const generatedLunches = [];
  const generatedDinners = [];

  if (repeatMode === "none") {
    // 21 UNIQUE dynamic recipes across the week (zero repeats)
    for (let i = 0; i < 7; i++) {
      generatedBreakfasts.push(await createRecipe("breakfast", bCalories, bProtein));
      generatedLunches.push(await createRecipe("lunch", lCalories, lProtein));
      generatedDinners.push(await createRecipe("dinner", dCalories, dProtein));
    }
  } else {
    // Smart repeats / batch cooking mode
    // 3 unique breakfasts
    for (let i = 0; i < 3; i++) {
      generatedBreakfasts.push(await createRecipe("breakfast", bCalories, bProtein));
    }

    // Number of unique dinners based on cook sessions
    const dinnerCount = Math.max(2, Math.min(cookSessions, 5));
    for (let i = 0; i < dinnerCount; i++) {
      generatedDinners.push(await createRecipe("dinner", dCalories, dProtein));
    }

    // 2 unique fresh lunches for non-leftover days
    for (let i = 0; i < 2; i++) {
      generatedLunches.push(await createRecipe("lunch", lCalories, lProtein));
    }
  }

  // 2. Create Meal Plan record
  const endDate = addDaysToDateString(startDate, 6);

  const [newPlan] = await db
    .insert(mealPlans)
    .values({
      householdId,
      profileId: profileId || null,
      startDate,
      endDate,
      status: "active",
    })
    .returning();

  // 3. Assemble the 7-day schedule
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dateStr = addDaysToDateString(startDate, dayIndex);

    // Breakfast
    const bRec =
      repeatMode === "none"
        ? generatedBreakfasts[dayIndex]
        : generatedBreakfasts[dayIndex % generatedBreakfasts.length];

    await db.insert(planMeals).values({
      planId: newPlan.id,
      date: dateStr,
      mealType: "breakfast",
      recipeId: bRec.recipeId,
      servings: 1,
      computedCalories: bRec.calories,
      computedProteinGrams: bRec.proteinGrams.toString(),
      computedCarbsGrams: bRec.carbsGrams.toString(),
      computedFatGrams: bRec.fatGrams.toString(),
      isBatchRepeat: repeatMode !== "none" && dayIndex >= generatedBreakfasts.length,
    });

    // Lunch & Dinner
    if (repeatMode === "none") {
      const lRec = generatedLunches[dayIndex];
      await db.insert(planMeals).values({
        planId: newPlan.id,
        date: dateStr,
        mealType: "lunch",
        recipeId: lRec.recipeId,
        servings: 1,
        computedCalories: lRec.calories,
        computedProteinGrams: lRec.proteinGrams.toString(),
        computedCarbsGrams: lRec.carbsGrams.toString(),
        computedFatGrams: lRec.fatGrams.toString(),
        isBatchRepeat: false,
      });

      const dRec = generatedDinners[dayIndex];
      await db.insert(planMeals).values({
        planId: newPlan.id,
        date: dateStr,
        mealType: "dinner",
        recipeId: dRec.recipeId,
        servings: 1,
        computedCalories: dRec.calories,
        computedProteinGrams: dRec.proteinGrams.toString(),
        computedCarbsGrams: dRec.carbsGrams.toString(),
        computedFatGrams: dRec.fatGrams.toString(),
        isBatchRepeat: false,
      });
    } else {
      // Smart repeat logic: Dinner leftovers become next day's lunch
      const currentDinner = generatedDinners[dayIndex % generatedDinners.length];
      const prevDinner = generatedDinners[(dayIndex - 1 + generatedDinners.length) % generatedDinners.length];

      // Lunch is previous dinner's leftover if dayIndex > 0, else fresh lunch
      const lRec = dayIndex % 2 === 1 ? prevDinner : generatedLunches[dayIndex % generatedLunches.length];
      const isLunchRepeat = dayIndex % 2 === 1;

      await db.insert(planMeals).values({
        planId: newPlan.id,
        date: dateStr,
        mealType: "lunch",
        recipeId: lRec.recipeId,
        servings: 1,
        computedCalories: lRec.calories,
        computedProteinGrams: lRec.proteinGrams.toString(),
        computedCarbsGrams: lRec.carbsGrams.toString(),
        computedFatGrams: lRec.fatGrams.toString(),
        isBatchRepeat: isLunchRepeat,
      });

      const isDinnerRepeat = dayIndex >= generatedDinners.length;
      await db.insert(planMeals).values({
        planId: newPlan.id,
        date: dateStr,
        mealType: "dinner",
        recipeId: currentDinner.recipeId,
        servings: 1,
        computedCalories: currentDinner.calories,
        computedProteinGrams: currentDinner.proteinGrams.toString(),
        computedCarbsGrams: currentDinner.carbsGrams.toString(),
        computedFatGrams: currentDinner.fatGrams.toString(),
        isBatchRepeat: isDinnerRepeat,
      });
    }
  }

  return newPlan;
}
