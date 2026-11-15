import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { X, RefreshCw, Flame, Dumbbell, Check } from "lucide-react";
import { PlanMeal, Recipe } from "@nook/shared";

interface MealSwapDrawerProps {
  meal: PlanMeal | null;
  isOpen: boolean;
  onClose: () => void;
  onSwapConfirmed: (planMealId: string, newRecipeId: string) => void;
}

export function MealSwapDrawer({
  meal,
  isOpen,
  onClose,
  onSwapConfirmed,
}: MealSwapDrawerProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/meals/recipes")
        .then((res) => res.json())
        .then((data) => {
          setRecipes(data.recipes || []);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!meal) return null;

  // Filter recipes matching this meal type or general
  const candidates = recipes.filter(
    (r) => r.id !== meal.recipeId && (r.mealType === meal.mealType || r.mealType === "dinner" || r.mealType === "lunch")
  );

  const selectedRecipe = candidates.find((r) => r.id === selectedRecipeId);

  // Compute macro deltas
  const deltaCal = selectedRecipe ? selectedRecipe.caloriesPerServing - meal.computedCalories : 0;
  const deltaProt = selectedRecipe ? Number((selectedRecipe.proteinPerServing - Number(meal.computedProteinGrams)).toFixed(1)) : 0;

  async function handleConfirmSwap() {
    if (!selectedRecipeId || !meal) return;
    setIsSwapping(true);
    try {
      const res = await fetch("/api/meals/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planMealId: meal.id,
          newRecipeId: selectedRecipeId,
        }),
      });

      if (res.ok) {
        onSwapConfirmed(meal.id, selectedRecipeId);
        onClose();
      }
    } catch {
      // error
    } finally {
      setIsSwapping(false);
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-[#14201A]/50 z-50 backdrop-blur-xs" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[#F4F9F5] rounded-t-[24px] z-50 border-t border-[#E2ECE4] max-h-[90vh] flex flex-col focus:outline-none overflow-hidden">
          {/* Grab Handle */}
          <div className="w-12 h-1.5 bg-[#CDE5D3] rounded-full mx-auto my-3 shrink-0" />

          {/* Header */}
          <div className="px-5 pb-3 border-b border-[#E2ECE4] flex items-center justify-between bg-white">
            <div>
              <Drawer.Title className="text-lg font-extrabold text-[#14201A] font-display">
                Swap Meal Recipe
              </Drawer.Title>
              <p className="text-xs text-[#5B6B61] mt-0.5">
                Select an alternative with real-time macro delta preview
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#5B6B61] hover:text-[#14201A] bg-[#F4F9F5] border border-[#E2ECE4] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Delta Preview Bar if a recipe is selected */}
          {selectedRecipe && (
            <div className="bg-[#EEF7F0] px-5 py-2.5 border-b border-[#CDE5D3] flex items-center justify-between text-xs">
              <span className="font-bold text-[#14201A]">Macro Delta:</span>
              <div className="flex items-center gap-3 font-mono font-bold">
                <span className={deltaCal >= 0 ? "text-[#15803D]" : "text-[#FF6B4A]"}>
                  {deltaCal >= 0 ? `+${deltaCal}` : deltaCal} kcal
                </span>
                <span className={deltaProt >= 0 ? "text-[#15803D]" : "text-[#FF6B4A]"}>
                  {deltaProt >= 0 ? `+${deltaProt}` : deltaProt}g protein
                </span>
              </div>
            </div>
          )}

          {/* Candidate Recipes List */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
            {candidates.map((r) => {
              const isSelected = r.id === selectedRecipeId;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRecipeId(r.id)}
                  className={`p-3.5 rounded-[16px] border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-[#15803D] ring-2 ring-[#86EFAC] shadow-sm"
                      : "bg-white border-[#E2ECE4] hover:border-[#86EFAC]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-[#14201A] font-display">
                        {r.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14201A] bg-[#F4F9F5] px-2 py-0.5 rounded-full border border-[#E2ECE4]">
                          <Flame className="w-3 h-3 text-[#15803D] fill-[#15803D]" />
                          <span>{r.caloriesPerServing} kcal</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                          <Dumbbell className="w-3 h-3 stroke-[2.5]" />
                          <span>{r.proteinPerServing}g</span>
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#15803D] text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Footer */}
          <div className="px-5 py-3 border-t border-[#E2ECE4] bg-white">
            <button
              type="button"
              disabled={!selectedRecipeId || isSwapping}
              onClick={handleConfirmSwap}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 bg-[#15803D] text-white hover:bg-[#166534] transition-colors cursor-pointer font-display disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.2]" />
              <span>{isSwapping ? "Applying..." : "Apply Swap"}</span>
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
