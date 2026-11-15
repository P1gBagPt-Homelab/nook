import { useState } from "react";
import { Drawer } from "vaul";
import {
  X,
  Sparkles,
  Repeat,
  Package,
  Ban,
  Plus,
  ChefHat,
  CheckCircle2,
} from "lucide-react";
import { MacroProfile } from "@nook/shared";
import { useTranslation } from "../../i18n/I18nContext";

interface GeneratePlanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MacroProfile | null;
  onPlanGenerated: () => void;
}

const COMMON_DISLIKES = [
  { key: "food.mushrooms", fallback: "Mushrooms" },
  { key: "food.cilantro", fallback: "Cilantro" },
  { key: "food.pork", fallback: "Pork" },
  { key: "food.shellfish", fallback: "Shellfish" },
  { key: "food.dairy", fallback: "Dairy" },
  { key: "food.peanuts", fallback: "Peanuts" },
  { key: "food.bell_pepper", fallback: "Bell Pepper" },
  { key: "food.onion", fallback: "Onion" },
];

export function GeneratePlanDrawer({
  isOpen,
  onClose,
  profile,
  onPlanGenerated,
}: GeneratePlanDrawerProps) {
  const { t } = useTranslation();
  const [repeatMode, setRepeatMode] = useState<"smart_repeats" | "none">("smart_repeats");
  const [cookSessions, setCookSessions] = useState(profile?.cookSessionsPerWeek || 4);
  const [excludedList, setExcludedList] = useState<string[]>(profile?.excludedIngredients || []);
  const [customExcludeInput, setCustomExcludeInput] = useState("");
  const [usePantryStock, setUsePantryStock] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");

  function handleAddExclude(item: string) {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (!excludedList.some((ex) => ex.toLowerCase() === trimmed.toLowerCase())) {
      setExcludedList((prev) => [...prev, trimmed]);
    }
    setCustomExcludeInput("");
  }

  function handleRemoveExclude(index: number) {
    setExcludedList((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerationStep(t("meals.generate.stepAi"));

    try {
      const today = new Date().toISOString().split("T")[0];

      // Step transition
      const stepTimer = setTimeout(() => {
        setGenerationStep(t("meals.generate.stepUsda"));
      }, 1200);

      const res = await fetch("/api/meals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: today,
          repeatMode,
          cookSessionsPerWeek: cookSessions,
          excludedIngredients: excludedList,
          usePantryStock,
          targetCalories: profile?.dailyCalories || 2200,
          targetProteinGrams: profile?.dailyProteinGrams || 150,
        }),
      });

      clearTimeout(stepTimer);

      if (res.ok) {
        setGenerationStep(t("meals.generate.stepMacros"));
        navigator.vibrate?.([20, 50, 20]);
        setTimeout(() => {
          onPlanGenerated();
          onClose();
        }, 400);
      }
    } catch {
      // error
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && !isGenerating && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-[#14201A]/50 z-50 backdrop-blur-xs" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[#F4F9F5] rounded-t-[24px] z-50 border-t border-[#E2ECE4] max-h-[92vh] flex flex-col focus:outline-none overflow-hidden">
          {/* Grab Handle */}
          <div className="w-12 h-1.5 bg-[#CDE5D3] rounded-full mx-auto my-3 shrink-0" />

          {/* Header */}
          <div className="px-5 pb-3 border-b border-[#E2ECE4] flex items-center justify-between bg-white">
            <div>
              <Drawer.Title className="text-lg font-extrabold text-[#14201A] font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#15803D]" />
                <span>{t("meals.generate.title")}</span>
              </Drawer.Title>
              <p className="text-xs text-[#5B6B61] mt-0.5">
                {t("meals.generate.subtitle")}
              </p>
            </div>
            {!isGenerating && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#5B6B61] hover:text-[#14201A] bg-[#F4F9F5] border border-[#E2ECE4] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* 1. Variety vs Batch Repeat Mode */}
            <div className="bg-white p-4 rounded-[18px] border border-[#E2ECE4] space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#14201A] font-display flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-[#15803D]" />
                <span>{t("meals.generate.styleTitle")}</span>
              </span>

              <div className="grid grid-cols-2 gap-2">
                {/* Option A: Smart Repeats */}
                <button
                  type="button"
                  onClick={() => setRepeatMode("smart_repeats")}
                  className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    repeatMode === "smart_repeats"
                      ? "bg-[#DCFCE7]/40 border-[#15803D] ring-2 ring-[#86EFAC]"
                      : "bg-[#F4F9F5] border-[#E2ECE4] hover:border-[#86EFAC]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Repeat className="w-4 h-4 text-[#15803D]" />
                    {repeatMode === "smart_repeats" && (
                      <CheckCircle2 className="w-4 h-4 text-[#15803D] stroke-[2.5]" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-[#14201A] font-display">
                    {t("meals.generate.batchTitle")}
                  </div>
                  <div className="text-[10px] text-[#5B6B61] mt-0.5 leading-snug">
                    {t("meals.generate.batchDesc")}
                  </div>
                </button>

                {/* Option B: Fresh Every Day */}
                <button
                  type="button"
                  onClick={() => setRepeatMode("none")}
                  className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    repeatMode === "none"
                      ? "bg-[#DCFCE7]/40 border-[#15803D] ring-2 ring-[#86EFAC]"
                      : "bg-[#F4F9F5] border-[#E2ECE4] hover:border-[#86EFAC]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Sparkles className="w-4 h-4 text-[#15803D]" />
                    {repeatMode === "none" && (
                      <CheckCircle2 className="w-4 h-4 text-[#15803D] stroke-[2.5]" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-[#14201A] font-display">
                    {t("meals.generate.freshTitle")}
                  </div>
                  <div className="text-[10px] text-[#5B6B61] mt-0.5 leading-snug">
                    {t("meals.generate.freshDesc")}
                  </div>
                </button>
              </div>

              {/* Cooking sessions slider if repeating */}
              {repeatMode === "smart_repeats" && (
                <div className="pt-2 border-t border-[#E2ECE4] space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-[#5B6B61]">{t("meals.generate.cookSessions")}</span>
                    <span className="text-[#15803D] font-mono">
                      {t("meals.generate.cookSessionsCount", { count: cookSessions })}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="6"
                    value={cookSessions}
                    onChange={(e) => setCookSessions(Number(e.target.value))}
                    className="w-full accent-[#15803D]"
                  />
                  <div className="flex justify-between text-[10px] text-[#5B6B61] font-semibold">
                    <span>2</span>
                    <span>4</span>
                    <span>6</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Excluded Ingredients / Forbidden Foods ("No-Go List") */}
            <div className="bg-white p-4 rounded-[18px] border border-[#E2ECE4] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#14201A] font-display flex items-center gap-1.5">
                  <Ban className="w-4 h-4 text-[#FF6B4A]" />
                  <span>{t("meals.generate.excludedTitle")}</span>
                </span>
                <span className="text-[11px] font-bold text-[#5B6B61]">
                  {t("meals.generate.excludedCount", { count: excludedList.length })}
                </span>
              </div>

              {/* Input for custom dislikes */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t("meals.generate.excludePlaceholder")}
                  value={customExcludeInput}
                  onChange={(e) => setCustomExcludeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddExclude(customExcludeInput);
                    }
                  }}
                  className="flex-1 min-h-[38px] px-3 rounded-full text-xs bg-[#F4F9F5] border border-[#E2ECE4] text-[#14201A] focus:outline-none focus:border-[#15803D]"
                />
                <button
                  type="button"
                  onClick={() => handleAddExclude(customExcludeInput)}
                  className="h-[38px] px-3 rounded-full bg-[#15803D] text-white text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-[#166534]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t("meals.generate.addExclude")}</span>
                </button>
              </div>

              {/* Active Excluded Chips */}
              {excludedList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {excludedList.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B4A] bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-1 rounded-full"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExclude(idx)}
                        className="hover:text-red-700 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Quick Suggestion Chips */}
              <div className="pt-2 border-t border-[#E2ECE4] space-y-1.5">
                <span className="text-[10px] font-bold text-[#5B6B61] uppercase tracking-wider">
                  {t("meals.generate.quickExclude")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_DISLIKES.filter(
                    (d) =>
                      !excludedList.some(
                        (ex) =>
                          ex.toLowerCase() === (t(d.key as any) || d.fallback).toLowerCase() ||
                          ex.toLowerCase() === d.fallback.toLowerCase()
                      )
                  ).map((dislike) => {
                    const label = t(dislike.key as any) || dislike.fallback;
                    return (
                      <button
                        key={dislike.key}
                        type="button"
                        onClick={() => handleAddExclude(label)}
                        className="text-[11px] font-semibold text-[#5B6B61] bg-[#F4F9F5] border border-[#E2ECE4] px-2 py-0.5 rounded-full hover:border-[#FF6B4A] hover:text-[#FF6B4A] cursor-pointer transition-colors"
                      >
                        + {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Pantry & Fridge Stock Awareness */}
            <div className="bg-white p-4 rounded-[18px] border border-[#E2ECE4]">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-[#15803D]" />
                  <div>
                    <div className="text-xs font-bold text-[#14201A]">
                      {t("meals.generate.pantryStockTitle")}
                    </div>
                    <div className="text-[11px] text-[#5B6B61]">
                      {t("meals.generate.pantryStockDesc")}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={usePantryStock}
                  onChange={(e) => setUsePantryStock(e.target.checked)}
                  className="w-4 h-4 accent-[#15803D] rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-5 py-3 border-t border-[#E2ECE4] bg-white">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 bg-[#15803D] text-white hover:bg-[#166534] transition-colors cursor-pointer font-display disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
              <span>{isGenerating ? generationStep : t("meals.generate.btn")}</span>
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
