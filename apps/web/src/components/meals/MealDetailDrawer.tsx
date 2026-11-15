import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import {
  X,
  Flame,
  Dumbbell,
  Clock,
  ChefHat,
  Calculator,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { PlanMeal, Recipe } from "@nook/shared";

interface MealDetailDrawerProps {
  meal: PlanMeal | null;
  isOpen: boolean;
  onClose: () => void;
  onSwapClick: (meal: PlanMeal) => void;
  onToggleCooked: (mealId: string) => void;
}

export function MealDetailDrawer({
  meal,
  isOpen,
  onClose,
  onSwapClick,
  onToggleCooked,
}: MealDetailDrawerProps) {
  const [recipeData, setRecipeData] = useState<Recipe | null>(null);

  useEffect(() => {
    if (meal?.recipeId) {
      fetch("/api/meals/recipes")
        .then((res) => res.json())
        .then((data) => {
          const found = data.recipes?.find((r: Recipe) => r.id === meal.recipeId);
          setRecipeData(found || null);
        })
        .catch(() => {});
    } else {
      setRecipeData(null);
    }
  }, [meal?.recipeId]);

  if (!meal) return null;

  const isCooked = meal.isCooked;
  const isDiningOut = meal.isDiningOut;
  const title = meal.customName || recipeData?.title || (meal as any).recipeTitle || "Meal Details";
  const instructions = recipeData?.instructions || [];
  const ingredients = recipeData?.ingredients || [];

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-[#14201A]/50 z-50 backdrop-blur-xs" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[#F4F9F5] rounded-t-[24px] z-50 border-t border-[#E2ECE4] max-h-[92vh] flex flex-col focus:outline-none overflow-hidden">
          {/* Grab Handle */}
          <div className="w-12 h-1.5 bg-[#CDE5D3] rounded-full mx-auto my-3 shrink-0" />

          {/* Header */}
          <div className="px-5 pb-3 border-b border-[#E2ECE4] flex items-start justify-between gap-3 bg-white">
            <div className="flex-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#15803D] font-display">
                {meal.mealType} · {meal.date}
              </span>
              <Drawer.Title className="text-lg md:text-xl font-extrabold text-[#14201A] font-display leading-tight mt-0.5">
                {title}
              </Drawer.Title>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#5B6B61] hover:text-[#14201A] bg-[#F4F9F5] border border-[#E2ECE4] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Macro Summary Capsules Banner */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white p-3 rounded-[16px] border border-[#E2ECE4] text-center">
                <div className="flex items-center justify-center gap-1 text-[#15803D] mb-1">
                  <Flame className="w-4 h-4 fill-[#15803D]" />
                </div>
                <div className="text-base font-extrabold text-[#14201A] font-display">
                  {meal.computedCalories}
                </div>
                <div className="text-[10px] font-bold text-[#5B6B61] uppercase tracking-wider">
                  Calories
                </div>
              </div>

              <div className="bg-white p-3 rounded-[16px] border border-[#86EFAC] text-center bg-[#DCFCE7]/30">
                <div className="flex items-center justify-center gap-1 text-[#15803D] mb-1">
                  <Dumbbell className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-base font-extrabold text-[#15803D] font-display">
                  {meal.computedProteinGrams}g
                </div>
                <div className="text-[10px] font-bold text-[#15803D] uppercase tracking-wider">
                  Protein
                </div>
              </div>

              <div className="bg-white p-3 rounded-[16px] border border-[#E2ECE4] text-center">
                <div className="text-sm font-extrabold text-[#0284C7] mb-1 font-display">C</div>
                <div className="text-base font-extrabold text-[#14201A] font-display">
                  {meal.computedCarbsGrams}g
                </div>
                <div className="text-[10px] font-bold text-[#5B6B61] uppercase tracking-wider">
                  Carbs
                </div>
              </div>

              <div className="bg-white p-3 rounded-[16px] border border-[#E2ECE4] text-center">
                <div className="text-sm font-extrabold text-[#D97706] mb-1 font-display">F</div>
                <div className="text-base font-extrabold text-[#14201A] font-display">
                  {meal.computedFatGrams}g
                </div>
                <div className="text-[10px] font-bold text-[#5B6B61] uppercase tracking-wider">
                  Fat
                </div>
              </div>
            </div>

            {/* Mealbird Signature: USDA Line-by-Line Math Breakdown */}
            {!isDiningOut && ingredients.length > 0 && (
              <div className="bg-white rounded-[18px] border border-[#E2ECE4] p-4 shadow-[0_2px_8px_rgba(20,32,26,0.03)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#15803D]" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#14201A] font-display">
                      USDA Line-by-Line Math
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                    Verified
                  </span>
                </div>

                <div className="divide-y divide-[#E2ECE4]/70">
                  {ingredients.map((ing: any) => (
                    <div key={ing.id} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                      <div className="flex items-center justify-between font-bold text-[#14201A]">
                        <span>{ing.name}</span>
                        <span className="font-mono text-[#15803D]">
                          {ing.amountGrams}g · {ing.calculation?.proteinGrams ?? 0}g protein
                        </span>
                      </div>
                      {ing.calculation?.mathProof?.proteinFormula && (
                        <div className="text-[11px] font-mono text-[#5B6B61] mt-0.5 bg-[#F4F9F5] px-2 py-1 rounded border border-[#E2ECE4]">
                          {ing.calculation.mathProof.proteinFormula}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cooking Equipment & Timing */}
            {recipeData && (
              <div className="bg-white rounded-[18px] border border-[#E2ECE4] p-4 space-y-3">
                <div className="flex items-center gap-4 text-xs font-semibold text-[#5B6B61]">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#15803D]" />
                    <span>Prep: {recipeData.prepMinutes}m · Cook: {recipeData.cookMinutes}m</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4 text-[#15803D]" />
                    <span>{recipeData.baseServings} Servings</span>
                  </span>
                </div>

                {recipeData.equipment?.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[#E2ECE4]">
                    <span className="text-[11px] font-bold text-[#5B6B61]">Equipment:</span>
                    {recipeData.equipment.map((eq: string) => (
                      <span
                        key={eq}
                        className="text-[11px] font-bold text-[#14201A] bg-[#F4F9F5] px-2 py-0.5 rounded-full border border-[#E2ECE4] uppercase"
                      >
                        {eq.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step-by-Step Instructions */}
            {instructions.length > 0 && (
              <div className="bg-white rounded-[18px] border border-[#E2ECE4] p-4 space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#14201A] font-display">
                  Cooking Instructions
                </h4>
                <ol className="space-y-2 list-decimal list-inside text-xs text-[#14201A] leading-relaxed">
                  {instructions.map((step: string, idx: number) => (
                    <li key={idx} className="pl-1">
                      <span className="font-normal">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Sticky Bottom Actions */}
          <div className="px-5 py-3 border-t border-[#E2ECE4] bg-white flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwapClick(meal);
              }}
              className="flex-1 min-h-[44px] py-2 px-3 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 border border-[#E2ECE4] bg-white text-[#14201A] hover:bg-[#F4F9F5] cursor-pointer font-display"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.2] text-[#5B6B61]" />
              <span>Swap Recipe</span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigator.vibrate?.(15);
                onToggleCooked(meal.id);
                onClose();
              }}
              className={`flex-1 min-h-[44px] py-2 px-3 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer font-display ${
                isCooked
                  ? "bg-[#F4F9F5] text-[#5B6B61] border-[#E2ECE4]"
                  : "bg-[#15803D] text-white border-[#15803D] hover:bg-[#166534]"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
              <span>{isCooked ? "Mark Uncooked" : "Mark Cooked"}</span>
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
