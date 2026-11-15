import { useState, useEffect } from "react";
import {
  Sparkles,
  ShoppingBag,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PlanMeal, DailyPlanSummary, MacroProfile } from "@nook/shared";
import { useTranslation } from "../../i18n/I18nContext";
import { MealCard } from "./MealCard";
import { MealDetailDrawer } from "./MealDetailDrawer";
import { MealSettingsDrawer } from "./MealSettingsDrawer";
import { MealSwapDrawer } from "./MealSwapDrawer";
import { SyncToCartModal } from "./SyncToCartModal";
import { GeneratePlanDrawer } from "./GeneratePlanDrawer";

export function MealPlanView() {
  const { t } = useTranslation();
  const [days, setDays] = useState<DailyPlanSummary[]>([]);
  const [profile, setProfile] = useState<MacroProfile | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Drawers
  const [selectedMeal, setSelectedMeal] = useState<PlanMeal | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSwapOpen, setIsSwapOpen] = useState(false);
  const [isSyncCartOpen, setIsSyncCartOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  async function fetchPlan() {
    try {
      const res = await fetch("/api/meals/active-plan");
      const data = await res.json();
      if (data.plan) {
        setActivePlanId(data.plan.id);
        setDays(data.days || []);
        setProfile(data.profile || null);
      } else {
        // No active plan yet, auto-generate starter plan for today
        handleGeneratePlan();
      }
    } catch {
      // error handling
    }
  }

  useEffect(() => {
    fetchPlan();
  }, []);

  async function handleGeneratePlan() {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/meals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: today,
          repeatMode: "smart_repeats",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActivePlanId(data.plan.id);
        await fetchPlan();
      }
    } catch {
      // error
    }
  }

  async function handleToggleCooked(mealId: string) {
    try {
      const res = await fetch(`/api/meals/plan-meals/${mealId}/cook`, {
        method: "POST",
      });
      if (res.ok) {
        setDays((prev) =>
          prev.map((d) => ({
            ...d,
            meals: d.meals.map((m) =>
              m.id === mealId ? { ...m, isCooked: !m.isCooked } : m
            ),
          }))
        );
      }
    } catch {
      // error
    }
  }

  const activeDay = days[selectedDayIndex] || null;

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white rounded-[18px] border border-[#E2ECE4] p-4 shadow-[0_2px_8px_rgba(20,32,26,0.04)]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#15803D] font-display">
              <Sparkles className="w-4 h-4" />
              <span>{t("meals.engineTag")}</span>
            </div>
            <h2 className="text-lg font-extrabold text-[#14201A] font-display mt-0.5">
              {t("meals.weeklySchedule")}
            </h2>
          </div>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="h-9 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 border border-[#E2ECE4] bg-[#F4F9F5] text-[#14201A] hover:bg-[#EEF7F0] cursor-pointer transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-[#5B6B61]" />
            <span className="hidden sm:inline">{t("meals.goalsBtn")}</span>
          </button>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#E2ECE4]">
          <button
            type="button"
            onClick={() => setIsGenerateOpen(true)}
            className="flex-1 min-h-[38px] py-1.5 px-3 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 bg-[#F4F9F5] border border-[#E2ECE4] text-[#14201A] hover:bg-[#EEF7F0] cursor-pointer font-display transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#15803D]" />
            <span>{t("meals.newPlanBtn")}</span>
          </button>

          {activePlanId && (
            <button
              type="button"
              onClick={() => setIsSyncCartOpen(true)}
              className="flex-1 min-h-[38px] py-1.5 px-3 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 bg-[#15803D] text-white hover:bg-[#166534] cursor-pointer font-display transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>{t("meals.syncCartBtn")}</span>
            </button>
          )}
        </div>
      </div>

      {/* 7-Day Horizontal Pill Carousel */}
      {days.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {days.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            const dateObj = new Date(day.date + "T12:00:00Z");
            const shortDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dateObj.getUTCDay()];
            const dayNum = dateObj.getUTCDate();
            const translatedDay = t(`meals.day.${shortDay}` as any) || shortDay;

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => {
                  navigator.vibrate?.(15);
                  setSelectedDayIndex(idx);
                }}
                className={`min-w-[58px] py-2.5 px-2 rounded-[18px] border transition-all text-center cursor-pointer font-display ${
                  isSelected
                    ? "bg-[#15803D] text-white border-[#15803D] shadow-sm"
                    : "bg-white text-[#5B6B61] border-[#E2ECE4] hover:border-[#86EFAC]"
                }`}
              >
                <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">
                  {translatedDay}
                </div>
                <div className="text-base font-extrabold mt-0.5 leading-tight">
                  {dayNum}
                </div>
                {/* Compliance Dot */}
                <div className="flex justify-center mt-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      day.isCalorieCompliant && day.isProteinCompliant
                        ? isSelected
                          ? "bg-white"
                          : "bg-[#16A34A]"
                        : isSelected
                        ? "bg-[#FEF3C7]"
                        : "bg-[#FF6B4A]"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Day Macro Compliance Card */}
      {activeDay && (
        <div className="bg-white rounded-[18px] border border-[#E2ECE4] p-4 shadow-[0_2px_8px_rgba(20,32,26,0.03)] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5B6B61] font-display">
                {t(`meals.day.${activeDay.dayName}` as any) || activeDay.dayName}
              </span>
              <h3 className="text-sm font-extrabold text-[#14201A] font-display">
                {t("meals.dailyBalance")}
              </h3>
            </div>

            {/* Compliance Tag */}
            {activeDay.isCalorieCompliant && activeDay.isProteinCompliant ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803D] bg-[#DCFCE7] px-2.5 py-1 rounded-full border border-[#86EFAC]">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t("meals.targetMet")}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97706] bg-[#FEF3C7] px-2.5 py-1 rounded-full border border-[#FDE68A]">
                <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t("meals.adjusting")}</span>
              </span>
            )}
          </div>

          {/* Progress Bars */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Calories Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#5B6B61]">{t("meals.calories")}</span>
                <span className="text-[#14201A] font-mono">
                  {activeDay.totalCalories} / {activeDay.targetCalories}
                </span>
              </div>
              <div className="w-full h-2 bg-[#F4F9F5] rounded-full overflow-hidden border border-[#E2ECE4]">
                <div
                  className="h-full bg-[#15803D] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (activeDay.totalCalories / activeDay.targetCalories) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Protein Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#15803D]">{t("meals.protein")}</span>
                <span className="text-[#15803D] font-mono">
                  {activeDay.totalProteinGrams}g / {activeDay.targetProteinGrams}g
                </span>
              </div>
              <div className="w-full h-2 bg-[#F4F9F5] rounded-full overflow-hidden border border-[#E2ECE4]">
                <div
                  className="h-full bg-[#16A34A] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (activeDay.totalProteinGrams / activeDay.targetProteinGrams) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meal Cards List for the Selected Day */}
      {activeDay && (
        <div className="space-y-3">
          {activeDay.meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onSelect={(m) => {
                setSelectedMeal(m);
                setIsDetailOpen(true);
              }}
              onToggleCooked={handleToggleCooked}
            />
          ))}
        </div>
      )}

      {/* Drawers */}
      <MealDetailDrawer
        meal={selectedMeal}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onSwapClick={(m) => {
          setSelectedMeal(m);
          setIsSwapOpen(true);
        }}
        onToggleCooked={handleToggleCooked}
      />

      <MealSettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onProfileUpdated={(updated) => {
          setProfile(updated);
          fetchPlan();
        }}
      />

      <MealSwapDrawer
        meal={selectedMeal}
        isOpen={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        onSwapConfirmed={() => {
          fetchPlan();
        }}
      />

      <GeneratePlanDrawer
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        profile={profile}
        onPlanGenerated={fetchPlan}
      />

      {activePlanId && (
        <SyncToCartModal
          planId={activePlanId}
          isOpen={isSyncCartOpen}
          onClose={() => setIsSyncCartOpen(false)}
          onCartSynced={() => {
            // Cart synced
          }}
        />
      )}
    </div>
  );
}
