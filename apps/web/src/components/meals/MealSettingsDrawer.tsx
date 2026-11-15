import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { X, Flame, Dumbbell, Wallet, Check, ChefHat } from "lucide-react";
import { MacroProfile } from "@nook/shared";
import { useTranslation } from "../../i18n/I18nContext";

interface MealSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MacroProfile | null;
  onProfileUpdated: (updated: MacroProfile) => void;
}

const ALL_EQUIPMENT = [
  { id: "stovetop", label: "Stovetop" },
  { id: "oven", label: "Oven" },
  { id: "air_fryer", label: "Air Fryer" },
  { id: "microwave", label: "Microwave" },
  { id: "instant_pot", label: "Instant Pot" },
  { id: "blender", label: "Blender" },
];

export function MealSettingsDrawer({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: MealSettingsDrawerProps) {
  const { t } = useTranslation();
  const [calories, setCalories] = useState(2200);
  const [protein, setProtein] = useState(150);
  const [budget, setBudget] = useState(80);
  const [equipment, setEquipment] = useState<string[]>(["stovetop", "oven", "air_fryer"]);
  const [cookSessions, setCookSessions] = useState(4);
  const [headcount, setHeadcount] = useState(2);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setCalories(profile.dailyCalories || 2200);
      setProtein(profile.dailyProteinGrams || 150);
      setBudget(profile.weeklyGroceryBudget ? Number(profile.weeklyGroceryBudget) : 80);
      setEquipment(profile.equipment || ["stovetop", "oven", "air_fryer"]);
      setCookSessions(profile.cookSessionsPerWeek || 4);
      setHeadcount(profile.householdHeadcount || 2);
    }
  }, [profile]);

  function toggleEquipment(id: string) {
    setEquipment((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/meals/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyCalories: Number(calories),
          dailyProteinGrams: Number(protein),
          weeklyGroceryBudget: Number(budget),
          equipment,
          householdHeadcount: Number(headcount),
          cookSessionsPerWeek: Number(cookSessions),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onProfileUpdated(data.profile);
        onClose();
      }
    } catch {
      // handle error
    } finally {
      setIsSaving(false);
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
                {t("meals.settings.title")}
              </Drawer.Title>
              <p className="text-xs text-[#5B6B61] mt-0.5">
                {t("meals.settings.subtitle")}
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Daily Calorie Target */}
            <div className="bg-white p-4 rounded-[18px] border border-[#E2ECE4] space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#14201A] font-display">
                  <Flame className="w-4 h-4 text-[#15803D]" />
                  <span>{t("meals.settings.dailyCalories")}</span>
                </span>
                <span className="text-base font-extrabold text-[#14201A] font-display">
                  {calories} {t("meals.kcal")}
                </span>
              </div>
              <input
                type="range"
                min="1200"
                max="4000"
                step="50"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full accent-[#15803D]"
              />
              <div className="flex justify-between text-[11px] text-[#5B6B61] font-semibold">
                <span>1,200</span>
                <span>2,600</span>
                <span>4,000</span>
              </div>
            </div>

            {/* Daily Protein Target */}
            <div className="bg-white p-4 rounded-[18px] border border-[#86EFAC] bg-[#DCFCE7]/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#15803D] font-display">
                  <Dumbbell className="w-4 h-4" />
                  <span>{t("meals.settings.dailyProtein")}</span>
                </span>
                <span className="text-base font-extrabold text-[#15803D] font-display">
                  {protein}g
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="300"
                step="5"
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
                className="w-full accent-[#15803D]"
              />
              <div className="flex justify-between text-[11px] text-[#5B6B61] font-semibold">
                <span>60g</span>
                <span>180g</span>
                <span>300g</span>
              </div>
            </div>

            {/* Weekly Grocery Budget */}
            <div className="bg-white p-4 rounded-[18px] border border-[#E2ECE4] space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#14201A] font-display">
                  <Wallet className="w-4 h-4 text-[#0284C7]" />
                  <span>{t("meals.settings.weeklyBudget")}</span>
                </span>
                <span className="text-base font-extrabold text-[#0284C7] font-display">
                  €{budget}
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="250"
                step="5"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-[#0284C7]"
              />
            </div>

            {/* Kitchen Appliances / Equipment */}
            <div className="bg-white p-4 rounded-[18px] border border-[#E2ECE4] space-y-2.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#14201A] font-display">
                <ChefHat className="w-4 h-4 text-[#15803D]" />
                <span>{t("meals.settings.equipment")}</span>
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {ALL_EQUIPMENT.map((eq) => {
                  const isSelected = equipment.includes(eq.id);
                  return (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => toggleEquipment(eq.id)}
                      className={`min-h-[36px] py-1.5 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#15803D] text-white border-[#15803D]"
                          : "bg-[#F4F9F5] text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      <span>{t(`equipment.${eq.id}` as any) || eq.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-5 py-3 border-t border-[#E2ECE4] bg-white">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 bg-[#15803D] text-white hover:bg-[#166534] transition-colors cursor-pointer font-display disabled:opacity-50"
            >
              <span>{isSaving ? t("meals.settings.saving") : t("meals.settings.save")}</span>
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
