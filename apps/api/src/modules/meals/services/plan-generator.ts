import { MacroResult } from "./nutrition-calculator";

export interface RecipeWithMacros {
  id: string;
  title: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  equipment: string[];
  baseServings: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
}

export interface GeneratedPlanMeal {
  date: string; // YYYY-MM-DD
  dayIndex: number; // 0 to 6
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  recipeId: string;
  recipeTitle: string;
  servings: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  isBatchRepeat: boolean;
}

export interface GeneratedDaySchedule {
  date: string;
  dayIndex: number;
  meals: GeneratedPlanMeal[];
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  targetCalories: number;
  targetProteinGrams: number;
  isCalorieCompliant: boolean;
  isProteinCompliant: boolean;
}

export interface PlanGenerationInput {
  startDate: string; // YYYY-MM-DD
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams?: number;
  targetFatGrams?: number;
  cookSessionsPerWeek?: number;
  batchRepetition?: boolean;
  availableRecipes: RecipeWithMacros[];
  excludedEquipment?: string[];
}

/**
 * Format Date as YYYY-MM-DD
 */
export function addDaysToDateString(baseDate: string, daysToAdd: number): string {
  const d = new Date(baseDate + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return d.toISOString().split("T")[0];
}

/**
 * Deterministic constraint-based weekly meal plan generator.
 * Emulates Mealbird's per-day macro balancing and batch cooking repetitions.
 */
export function generateWeeklyPlan(input: PlanGenerationInput): GeneratedDaySchedule[] {
  const {
    startDate,
    targetCalories,
    targetProteinGrams,
    availableRecipes,
    batchRepetition = true,
  } = input;

  if (availableRecipes.length === 0) {
    throw new Error("No recipes available to generate meal plan.");
  }

  const breakfasts = availableRecipes.filter((r) => r.mealType === "breakfast");
  const lunches = availableRecipes.filter((r) => r.mealType === "lunch");
  const dinners = availableRecipes.filter((r) => r.mealType === "dinner");
  const allMains = [...lunches, ...dinners];

  // Fallbacks if specific meal types are missing
  const safeBreakfasts = breakfasts.length > 0 ? breakfasts : availableRecipes;
  const safeLunches = lunches.length > 0 ? lunches : allMains.length > 0 ? allMains : availableRecipes;
  const safeDinners = dinners.length > 0 ? dinners : allMains.length > 0 ? allMains : availableRecipes;

  const schedules: GeneratedDaySchedule[] = [];

  // Batch cooking state: track prepared batches for reuse
  let activeDinnerBatch: RecipeWithMacros | null = null;
  let dinnerBatchRemaining = 0;

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dateStr = addDaysToDateString(startDate, dayIndex);
    const dayMeals: GeneratedPlanMeal[] = [];

    // 1. Pick Breakfast (Rotate between available breakfasts)
    const bRecipe = safeBreakfasts[dayIndex % safeBreakfasts.length];
    dayMeals.push({
      date: dateStr,
      dayIndex,
      mealType: "breakfast",
      recipeId: bRecipe.id,
      recipeTitle: bRecipe.title,
      servings: 1,
      calories: bRecipe.caloriesPerServing,
      proteinGrams: bRecipe.proteinPerServing,
      carbsGrams: bRecipe.carbsPerServing,
      fatGrams: bRecipe.fatPerServing,
      isBatchRepeat: false,
    });

    // 2. Pick Lunch
    let lRecipe: RecipeWithMacros;
    let isLunchRepeat = false;

    if (batchRepetition && activeDinnerBatch && dayIndex % 2 === 1) {
      // Leftover from previous dinner as lunch
      lRecipe = activeDinnerBatch;
      isLunchRepeat = true;
    } else {
      lRecipe = safeLunches[dayIndex % safeLunches.length];
    }

    dayMeals.push({
      date: dateStr,
      dayIndex,
      mealType: "lunch",
      recipeId: lRecipe.id,
      recipeTitle: lRecipe.title,
      servings: 1,
      calories: lRecipe.caloriesPerServing,
      proteinGrams: lRecipe.proteinPerServing,
      carbsGrams: lRecipe.carbsPerServing,
      fatGrams: lRecipe.fatPerServing,
      isBatchRepeat: isLunchRepeat,
    });

    // 3. Pick Dinner
    let dRecipe: RecipeWithMacros;
    let isDinnerRepeat = false;

    if (batchRepetition && dinnerBatchRemaining > 0 && activeDinnerBatch) {
      dRecipe = activeDinnerBatch;
      dinnerBatchRemaining--;
      isDinnerRepeat = true;
    } else {
      // Cook fresh batch dinner
      dRecipe = safeDinners[(dayIndex * 2) % safeDinners.length];
      if (batchRepetition) {
        activeDinnerBatch = dRecipe;
        dinnerBatchRemaining = 1; // 1 repeat for next cycle
      }
    }

    dayMeals.push({
      date: dateStr,
      dayIndex,
      mealType: "dinner",
      recipeId: dRecipe.id,
      recipeTitle: dRecipe.title,
      servings: 1,
      calories: dRecipe.caloriesPerServing,
      proteinGrams: dRecipe.proteinPerServing,
      carbsGrams: dRecipe.carbsPerServing,
      fatGrams: dRecipe.fatPerServing,
      isBatchRepeat: isDinnerRepeat,
    });

    // Compute daily totals
    const totalCalories = dayMeals.reduce((acc, m) => acc + m.calories, 0);
    const totalProteinGrams = Number(dayMeals.reduce((acc, m) => acc + m.proteinGrams, 0).toFixed(1));
    const totalCarbsGrams = Number(dayMeals.reduce((acc, m) => acc + m.carbsGrams, 0).toFixed(1));
    const totalFatGrams = Number(dayMeals.reduce((acc, m) => acc + m.fatGrams, 0).toFixed(1));

    // Evaluate strict per-day compliance (Mealbird-style)
    // Calories within +/- 15%, Protein >= 85% of target
    const calMin = targetCalories * 0.85;
    const calMax = targetCalories * 1.15;
    const isCalorieCompliant = totalCalories >= calMin && totalCalories <= calMax;
    const isProteinCompliant = totalProteinGrams >= targetProteinGrams * 0.85;

    schedules.push({
      date: dateStr,
      dayIndex,
      meals: dayMeals,
      totalCalories,
      totalProteinGrams,
      totalCarbsGrams,
      totalFatGrams,
      targetCalories,
      targetProteinGrams,
      isCalorieCompliant,
      isProteinCompliant,
    });
  }

  return schedules;
}
