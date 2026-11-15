import { describe, it, expect } from "vitest";
import { computeCartFromStock } from "../services/stock-crosscheck";

describe("Mealbird-to-Nook Stock Cross-Check & Cart Sizing", () => {
  it("excludes ingredients already covered by household stock", () => {
    const needed = [
      {
        name: "Olive Oil",
        totalGramsNeeded: 20,
        packageUnitSizeGrams: 500,
        estimatedPackagePrice: 5.0,
        aisle: "Pantry & Dry Goods",
      },
      {
        name: "Chicken Breast",
        totalGramsNeeded: 800,
        packageUnitSizeGrams: 500,
        estimatedPackagePrice: 6.0,
        aisle: "Meat & Seafood",
      },
    ];

    const currentStock = [
      {
        id: "stock-1",
        name: "Extra Virgin Olive Oil",
        quantity: 1,
        unit: "bottle",
        location: "Pantry",
      },
    ];

    const result = computeCartFromStock(needed, currentStock);

    // Olive oil is in stock -> covered!
    expect(result.itemsCovered.length).toBe(1);
    expect(result.itemsCovered[0].name).toBe("Olive Oil");
    expect(result.itemsCovered[0].isCoveredByStock).toBe(true);

    // Chicken Breast is NOT in stock -> to buy!
    expect(result.itemsToBuy.length).toBe(1);
    expect(result.itemsToBuy[0].name).toBe("Chicken Breast");
    // Needed 800g with 500g package size -> buy 2 packages!
    expect(result.itemsToBuy[0].packageUnitsToBuy).toBe(2);
    expect(result.itemsToBuy[0].estimatedCost).toBe(12.0);
    expect(result.estimatedTotalCost).toBe(12.0);
  });
});
