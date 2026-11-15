export interface NeededIngredient {
  name: string;
  totalGramsNeeded: number;
  packageUnitSizeGrams?: number | null;
  estimatedPackagePrice?: number | null;
  aisle: string;
  catalogProductId?: string | null;
}

export interface StockInventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  location: string; // 'Fridge' | 'Pantry' | 'Freezer'
}

export interface ShoppingCartRecommendation {
  name: string;
  neededGrams: number;
  inStockGrams: number;
  deficitGrams: number;
  packageUnitsToBuy: number;
  packageUnitSizeGrams: number;
  estimatedCost: number;
  aisle: string;
  isCoveredByStock: boolean;
  catalogProductId?: string | null;
}

/**
 * Cross-checks recipe ingredient requirements against current stock inventory,
 * computing package rounding and aisle-categorized shopping cart items.
 */
export function computeCartFromStock(
  neededIngredients: NeededIngredient[],
  currentStock: StockInventoryItem[]
): {
  itemsToBuy: ShoppingCartRecommendation[];
  itemsCovered: ShoppingCartRecommendation[];
  estimatedTotalCost: number;
} {
  const itemsToBuy: ShoppingCartRecommendation[] = [];
  const itemsCovered: ShoppingCartRecommendation[] = [];
  let estimatedTotalCost = 0;

  for (const item of neededIngredients) {
    // Case-insensitive match on ingredient name vs stock item title
    const stockMatch = currentStock.find(
      (s) =>
        s.name.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(s.name.toLowerCase())
    );

    // If unit is pcs or grams, estimate stock grams
    let inStockGrams = 0;
    if (stockMatch) {
      if (stockMatch.unit === "kg") {
        inStockGrams = stockMatch.quantity * 1000;
      } else if (stockMatch.unit === "g") {
        inStockGrams = stockMatch.quantity;
      } else {
        // default piece heuristic: assume 1 piece ~ packageUnitSize or 100g
        inStockGrams = stockMatch.quantity * (item.packageUnitSizeGrams || 100);
      }
    }

    const deficitGrams = Math.max(0, item.totalGramsNeeded - inStockGrams);
    const unitSize = item.packageUnitSizeGrams && item.packageUnitSizeGrams > 0 ? item.packageUnitSizeGrams : item.totalGramsNeeded;
    const packageUnitsToBuy = deficitGrams > 0 ? Math.ceil(deficitGrams / unitSize) : 0;
    const unitPrice = item.estimatedPackagePrice && item.estimatedPackagePrice > 0 ? item.estimatedPackagePrice : 0;
    const itemCost = packageUnitsToBuy * unitPrice;

    const recommendation: ShoppingCartRecommendation = {
      name: item.name,
      neededGrams: item.totalGramsNeeded,
      inStockGrams,
      deficitGrams,
      packageUnitsToBuy,
      packageUnitSizeGrams: unitSize,
      estimatedCost: Number(itemCost.toFixed(2)),
      aisle: item.aisle || "Pantry & Dry Goods",
      isCoveredByStock: deficitGrams === 0,
      catalogProductId: item.catalogProductId,
    };

    if (deficitGrams > 0) {
      itemsToBuy.push(recommendation);
      estimatedTotalCost += itemCost;
    } else {
      itemsCovered.push(recommendation);
    }
  }

  // Sort by aisle
  itemsToBuy.sort((a, b) => a.aisle.localeCompare(b.aisle));

  return {
    itemsToBuy,
    itemsCovered,
    estimatedTotalCost: Number(estimatedTotalCost.toFixed(2)),
  };
}
