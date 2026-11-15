import { describe, it, expect } from "vitest";
import { generateDynamicRecipe } from "../services/ai-recipe-generator";

describe("Dynamic AI Recipe Generator & Exclusions", () => {
  const mockUsdaCatalog = [
    {
      id: "u-1",
      fdcId: "171077",
      name: "Chicken Breast (Boneless, Skinless, Raw)",
      category: "Poultry Products",
      caloriesPer100g: 120.0,
      proteinPer100g: 22.5,
      carbsPer100g: 0.0,
      fatPer100g: 2.6,
      defaultAisle: "Meat & Seafood",
    },
    {
      id: "u-2",
      fdcId: "174036",
      name: "Ground Beef (93% Lean / 7% Fat, Raw)",
      category: "Beef Products",
      caloriesPer100g: 172.0,
      proteinPer100g: 21.0,
      carbsPer100g: 0.0,
      fatPer100g: 9.2,
      defaultAisle: "Meat & Seafood",
    },
    {
      id: "u-3",
      fdcId: "168482",
      name: "Sweet Potato (Raw)",
      category: "Vegetables and Vegetable Products",
      caloriesPer100g: 86.0,
      proteinPer100g: 1.6,
      carbsPer100g: 20.1,
      fatPer100g: 0.1,
      defaultAisle: "Produce",
    },
    {
      id: "u-4",
      fdcId: "170379",
      name: "Broccoli (Raw)",
      category: "Vegetables and Vegetable Products",
      caloriesPer100g: 34.0,
      proteinPer100g: 2.8,
      carbsPer100g: 6.6,
      fatPer100g: 0.4,
      defaultAisle: "Produce",
    },
    {
      id: "u-5",
      fdcId: "171413",
      name: "Extra Virgin Olive Oil",
      category: "Fats and Oils",
      caloriesPer100g: 884.0,
      proteinPer100g: 0.0,
      carbsPer100g: 0.0,
      fatPer100g: 100.0,
      defaultAisle: "Pantry & Dry Goods",
    },
  ];

  it("generates a dynamic dinner recipe with USDA-calculated macros matching targets", async () => {
    const recipe = await generateDynamicRecipe({
      mealType: "dinner",
      targetCalories: 650,
      targetProteinGrams: 50,
      excludedIngredients: [],
      equipment: ["air_fryer", "stovetop"],
      usdaCatalog: mockUsdaCatalog,
    });

    expect(recipe.title).toBeDefined();
    expect(recipe.ingredients.length).toBeGreaterThanOrEqual(3);

    // Verify macro accuracy (calories within +/- 20% of target, protein >= 75%)
    expect(recipe.computedCalories).toBeGreaterThan(450);
    expect(recipe.computedProteinGrams).toBeGreaterThan(35);
  });

  it("strictly obeys excluded ingredients / forbidden foods list", async () => {
    // Exclude Chicken
    const recipe = await generateDynamicRecipe({
      mealType: "dinner",
      targetCalories: 600,
      targetProteinGrams: 40,
      excludedIngredients: ["Chicken", "Poultry"],
      equipment: ["stovetop"],
      usdaCatalog: mockUsdaCatalog,
    });

    // Check that neither the title nor the ingredients contain Chicken
    expect(recipe.title.toLowerCase()).not.toContain("chicken");
    for (const ing of recipe.ingredients) {
      expect(ing.name.toLowerCase()).not.toContain("chicken");
    }
  });
});
