import { UsdaSeedItem } from "./usda-staples";

export interface MacroResult {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface IngredientCalculation {
  name: string;
  amountGrams: number;
  fdcId?: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  mathProof: {
    caloriesFormula: string;
    proteinFormula: string;
  };
}

/**
 * Calculates exact nutrition metrics for an ingredient based on USDA 100g reference values.
 * Uses exact arithmetic with 1 decimal place rounding for grams and integer rounding for calories.
 */
export function calculateIngredientNutrition(
  amountGrams: number,
  usda: {
    fdcId?: string;
    caloriesPer100g: number | string;
    proteinPer100g: number | string;
    carbsPer100g: number | string;
    fatPer100g: number | string;
  }
): IngredientCalculation {
  const cal100 = Number(usda.caloriesPer100g);
  const prot100 = Number(usda.proteinPer100g);
  const carb100 = Number(usda.carbsPer100g);
  const fat100 = Number(usda.fatPer100g);

  const factor = amountGrams / 100;
  const rawCalories = factor * cal100;
  const rawProtein = factor * prot100;
  const rawCarbs = factor * carb100;
  const rawFat = factor * fat100;

  const calories = Math.round(rawCalories);
  const proteinGrams = Number(rawProtein.toFixed(1));
  const carbsGrams = Number(rawCarbs.toFixed(1));
  const fatGrams = Number(rawFat.toFixed(1));

  const fdcLabel = usda.fdcId ? ` [USDA FDC #${usda.fdcId}]` : "";

  return {
    name: "",
    amountGrams,
    fdcId: usda.fdcId,
    calories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    mathProof: {
      caloriesFormula: `(${amountGrams}g / 100g) × ${cal100} kcal = ${calories} kcal${fdcLabel}`,
      proteinFormula: `(${amountGrams}g / 100g) × ${prot100}g = ${proteinGrams}g protein${fdcLabel}`,
    },
  };
}

/**
 * Computes aggregate recipe nutrition and per-serving nutrition.
 */
export function calculateRecipeNutrition(
  ingredients: {
    name: string;
    amountGrams: number;
    usda?: {
      fdcId?: string;
      caloriesPer100g: number | string;
      proteinPer100g: number | string;
      carbsPer100g: number | string;
      fatPer100g: number | string;
    } | null;
  }[],
  servings: number = 1
): {
  total: MacroResult;
  perServing: MacroResult;
  lineItems: IngredientCalculation[];
} {
  const safeServings = Math.max(1, servings);
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  const lineItems: IngredientCalculation[] = [];

  for (const item of ingredients) {
    if (item.usda) {
      const calc = calculateIngredientNutrition(item.amountGrams, item.usda);
      calc.name = item.name;
      lineItems.push(calc);

      totalCalories += calc.calories;
      totalProtein += calc.proteinGrams;
      totalCarbs += calc.carbsGrams;
      totalFat += calc.fatGrams;
    } else {
      lineItems.push({
        name: item.name,
        amountGrams: item.amountGrams,
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        mathProof: {
          caloriesFormula: "Unlinked ingredient",
          proteinFormula: "Unlinked ingredient",
        },
      });
    }
  }

  const roundedProtein = Number(totalProtein.toFixed(1));
  const roundedCarbs = Number(totalCarbs.toFixed(1));
  const roundedFat = Number(totalFat.toFixed(1));

  return {
    total: {
      calories: totalCalories,
      proteinGrams: roundedProtein,
      carbsGrams: roundedCarbs,
      fatGrams: roundedFat,
    },
    perServing: {
      calories: Math.round(totalCalories / safeServings),
      proteinGrams: Number((roundedProtein / safeServings).toFixed(1)),
      carbsGrams: Number((roundedCarbs / safeServings).toFixed(1)),
      fatGrams: Number((roundedFat / safeServings).toFixed(1)),
    },
    lineItems,
  };
}
