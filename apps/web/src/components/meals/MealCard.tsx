import { Flame, Dumbbell, Clock, Repeat, CheckCircle2, ChevronRight, Store } from "lucide-react";
import { PlanMeal } from "@nook/shared";
import { useTranslation } from "../../i18n/I18nContext";

interface MealCardProps {
  meal: PlanMeal;
  onSelect: (meal: PlanMeal) => void;
  onToggleCooked: (mealId: string) => void;
}

export function MealCard({ meal, onSelect, onToggleCooked }: MealCardProps) {
  const { t } = useTranslation();
  const isCooked = meal.isCooked;
  const isDiningOut = meal.isDiningOut;
  const isBatch = meal.isBatchRepeat;

  const mealTypeLabel = t(`meals.type.${meal.mealType}` as any) || meal.mealType;
  const title = meal.customName || meal.recipe?.title || (meal as any).recipeTitle || "Custom Meal";
  const cookMinutes = (meal as any).recipeCookMinutes ?? meal.recipe?.cookMinutes ?? 15;
  const prepMinutes = (meal as any).recipePrepMinutes ?? meal.recipe?.prepMinutes ?? 10;
  const totalMinutes = cookMinutes + prepMinutes;

  return (
    <div
      onClick={() => onSelect(meal)}
      className={`group relative bg-white rounded-[18px] border transition-all duration-150 p-4 shadow-[0_2px_8px_rgba(20,32,26,0.04)] cursor-pointer hover:border-[#86EFAC] ${
        isCooked ? "border-[#CDE5D3] bg-[#F4F9F5]/60" : "border-[#E2ECE4]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {/* Meal Type Tag */}
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5B6B61] font-display">
              {mealTypeLabel}
            </span>

            {/* Total Minutes Badge */}
            {!isDiningOut && totalMinutes > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5B6B61] bg-[#F4F9F5] px-2 py-0.5 rounded-full border border-[#E2ECE4]">
                <Clock className="w-3 h-3 stroke-[2.2]" />
                <span>{totalMinutes}m</span>
              </span>
            )}

            {/* Batch Cooked Leftover Tag */}
            {isBatch && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6D28D9] bg-[#EDE9FE] px-2 py-0.5 rounded-full border border-[#DDD6FE]">
                <Repeat className="w-3 h-3 stroke-[2.5]" />
                <span>{t("meals.batchRepeat")}</span>
              </span>
            )}

            {/* Dining Out Tag */}
            {isDiningOut && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                <Store className="w-3 h-3 stroke-[2.5]" />
                <span>{t("meals.diningOut")}</span>
              </span>
            )}
          </div>

          <h3
            className={`text-sm md:text-base font-bold font-display line-clamp-2 leading-snug ${
              isCooked ? "text-[#5B6B61] line-through" : "text-[#14201A]"
            }`}
          >
            {title}
          </h3>

          {/* Macro Badges */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#14201A] bg-[#EEF7F0] px-2.5 py-1 rounded-full border border-[#CDE5D3]">
              <Flame className="w-3.5 h-3.5 text-[#15803D] fill-[#15803D]" />
              <span>{meal.computedCalories} {t("meals.kcal")}</span>
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#15803D] bg-[#DCFCE7] px-2.5 py-1 rounded-full border border-[#86EFAC]">
              <Dumbbell className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{meal.computedProteinGrams}{t("meals.gProtein")}</span>
            </span>

            {Number(meal.computedCarbsGrams) > 0 && (
              <span className="text-xs font-semibold text-[#5B6B61] hidden sm:inline-block">
                {meal.computedCarbsGrams}g C · {meal.computedFatGrams}g F
              </span>
            )}
          </div>
        </div>

        {/* Right actions: Cook Checkbox & Chevron */}
        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onToggleCooked(meal.id)}
            title={isCooked ? t("meals.markUncooked") : t("meals.markCooked")}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
              isCooked
                ? "bg-[#15803D] text-white border-[#15803D]"
                : "bg-white text-[#CDE5D3] border-[#E2ECE4] hover:text-[#15803D] hover:border-[#86EFAC]"
            }`}
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </button>
          <ChevronRight className="w-4 h-4 text-[#5B6B61] group-hover:text-[#14201A] transition-colors" />
        </div>
      </div>
    </div>
  );
}
