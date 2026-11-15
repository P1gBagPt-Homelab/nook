import { describe, it, expect } from "vitest";
import { generateWeeklyPlan, RecipeWithMacros } from "../services/plan-generator";

describe("Mealbird Constraint-Based Weekly Plan Generator", () => {
  const mockRecipes: RecipeWithMacros[] = [
    {
      id: "b1",
      title: "Oatmeal with Protein",
      mealType: "breakfast",
      equipment: ["stovetop"],
      baseServings: 1,
      caloriesPerServing: 450,
      proteinPerServing: 35.0,
      carbsPerServing: 60.0,
      fatPerServing: 7.0,
    },
    {
      id: "l1",
      title: "Beef Rice Bowl",
      mealType: "lunch",
      equipment: ["stovetop"],
      baseServings: 2,
      caloriesPerServing: 650,
      proteinPerServing: 45.0,
      carbsPerServing: 75.0,
      fatPerServing: 18.0,
    },
    {
      id: "d1",
      title: "Garlic Chicken & Sweet Potato",
      mealType: "dinner",
      equipment: ["air_fryer"],
      baseServings: 2,
      caloriesPerServing: 700,
      proteinPerServing: 52.0,
      carbsPerServing: 65.0,
      fatPerServing: 22.0,
    },
  ];

  it("generates full 7-day schedule with breakfast, lunch, and dinner for each day", () => {
    const plan = generateWeeklyPlan({
      startDate: "2026-11-16",
      targetCalories: 1800,
      targetProteinGrams: 130,
      availableRecipes: mockRecipes,
      batchRepetition: true,
    });

    expect(plan.length).toBe(7);

    // Verify day dates are sequential
    expect(plan[0].date).toBe("2026-11-16");
    expect(plan[6].date).toBe("2026-11-22");

    for (const day of plan) {
      expect(day.meals.length).toBe(3);
      expect(day.meals[0].mealType).toBe("breakfast");
      expect(day.meals[1].mealType).toBe("lunch");
      expect(day.meals[2].mealType).toBe("dinner");

      // Verify arithmetic totals
      const expectedCalories = day.meals.reduce((sum, m) => sum + m.calories, 0);
      expect(day.totalCalories).toBe(expectedCalories);

      // Verify protein target
      expect(day.totalProteinGrams).toBeGreaterThan(100);
    }
  });

  it("applies batch repeat rules across consecutive days", () => {
    const plan = generateWeeklyPlan({
      startDate: "2026-11-16",
      targetCalories: 1800,
      targetProteinGrams: 130,
      availableRecipes: mockRecipes,
      batchRepetition: true,
    });

    // Check that at least some meals are flagged as batch repeat
    const batchRepeats = plan.flatMap((d) => d.meals).filter((m) => m.isBatchRepeat);
    expect(batchRepeats.length).toBeGreaterThan(0);
  });
});
