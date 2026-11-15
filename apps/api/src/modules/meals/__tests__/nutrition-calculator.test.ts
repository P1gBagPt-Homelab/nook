import { describe, it, expect } from "vitest";
import {
  calculateIngredientNutrition,
  calculateRecipeNutrition,
} from "../services/nutrition-calculator";

describe("Mealbird Nutrition Arithmetic Engine", () => {
  it("calculates deterministic line-by-line math for chicken breast according to USDA FDC 171077", () => {
    // Chicken Breast: 120 kcal/100g, 22.5g protein/100g
    const usda = {
      fdcId: "171077",
      caloriesPer100g: 120.0,
      proteinPer100g: 22.5,
      carbsPer100g: 0.0,
      fatPer100g: 2.6,
    };

    // 200g portion: factor = 2.0 -> 240 kcal, 45.0g protein, 0g carb, 5.2g fat
    const calc200 = calculateIngredientNutrition(200, usda);
    expect(calc200.calories).toBe(240);
    expect(calc200.proteinGrams).toBe(45.0);
    expect(calc200.carbsGrams).toBe(0.0);
    expect(calc200.fatGrams).toBe(5.2);
    expect(calc200.mathProof.proteinFormula).toContain("(200g / 100g) × 22.5g = 45g protein [USDA FDC #171077]");

    // 150g portion: factor = 1.5 -> 180 kcal, 33.8g protein, 3.9g fat
    const calc150 = calculateIngredientNutrition(150, usda);
    expect(calc150.calories).toBe(180);
    expect(calc150.proteinGrams).toBe(33.8);
    expect(calc150.fatGrams).toBe(3.9);
  });

  it("calculates multi-ingredient recipe nutrition and per-serving split without rounding drift", () => {
    const ingredients = [
      {
        name: "Chicken Breast",
        amountGrams: 400,
        usda: {
          fdcId: "171077",
          caloriesPer100g: 120.0,
          proteinPer100g: 22.5,
          carbsPer100g: 0.0,
          fatPer100g: 2.6,
        },
      },
      {
        name: "Sweet Potato",
        amountGrams: 300,
        usda: {
          fdcId: "168482",
          caloriesPer100g: 86.0,
          proteinPer100g: 1.6,
          carbsPer100g: 20.1,
          fatPer100g: 0.1,
        },
      },
      {
        name: "Olive Oil",
        amountGrams: 10,
        usda: {
          fdcId: "171413",
          caloriesPer100g: 884.0,
          proteinPer100g: 0.0,
          carbsPer100g: 0.0,
          fatPer100g: 100.0,
        },
      },
    ];

    // Total:
    // Chicken: 480 kcal, 90.0g protein, 0g carb, 10.4g fat
    // Sweet Potato: 258 kcal, 4.8g protein, 60.3g carb, 0.3g fat
    // Olive Oil: 88 kcal, 0g protein, 0g carb, 10.0g fat
    // Sum: 826 kcal, 94.8g protein, 60.3g carb, 20.7g fat
    const result = calculateRecipeNutrition(ingredients, 2);

    expect(result.total.calories).toBe(826);
    expect(result.total.proteinGrams).toBe(94.8);
    expect(result.total.carbsGrams).toBe(60.3);
    expect(result.total.fatGrams).toBe(20.7);

    // Per serving (2 servings):
    expect(result.perServing.calories).toBe(413);
    expect(result.perServing.proteinGrams).toBe(47.4);
    expect(result.perServing.carbsGrams).toBe(30.1);
    expect(result.perServing.fatGrams).toBe(10.3);

    expect(result.lineItems.length).toBe(3);
    expect(result.lineItems[0].mathProof.proteinFormula).toBe("(400g / 100g) × 22.5g = 90g protein [USDA FDC #171077]");
  });
});
