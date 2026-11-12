import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import { Check, Loader2, SlidersHorizontal } from "lucide-react";
import type { FinanceCategory } from "./ExpenseDrawer";
import { useTranslation } from "../../i18n/I18nContext";

interface BudgetCapDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonthlyBudget: number | null;
  categories: FinanceCategory[];
  onSaved: () => void;
}

export function BudgetCapDrawer({
  isOpen,
  onClose,
  currentMonthlyBudget,
  categories,
  onSaved,
}: BudgetCapDrawerProps) {
  const { t } = useTranslation();
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [catBudgets, setCatBudgets] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMonthlyBudget(
        currentMonthlyBudget != null ? currentMonthlyBudget.toString() : ""
      );
      const map: Record<string, string> = {};
      for (const c of categories) {
        map[c.id] = c.monthlyBudget ? parseFloat(c.monthlyBudget).toString() : "";
      }
      setCatBudgets(map);
    }
  }, [isOpen, currentMonthlyBudget, categories]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const cap = monthlyBudget.trim() ? parseFloat(monthlyBudget) : null;
      await fetch("/api/finance/budget", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBudget: cap }),
      });

      await Promise.all(
        categories.map((c) => {
          const raw = catBudgets[c.id]?.trim() || "";
          const nextVal = raw ? parseFloat(raw) : null;
          const prevVal = c.monthlyBudget ? parseFloat(c.monthlyBudget) : null;
          if (nextVal === prevVal) return Promise.resolve();
          return fetch(`/api/finance/categories/${c.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ monthlyBudget: nextVal }),
          });
        })
      );

      navigator.vibrate?.(30);
      onSaved();
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-[#14201A]/50 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[24px] z-50 border-t border-[#E2ECE4] max-h-[90vh] overflow-y-auto">
          <div className="w-10 h-1.5 bg-[#E2ECE4] rounded-full mx-auto mt-3 mb-2" />

          <div className="px-5 py-3 border-b border-[#E2ECE4] flex items-center justify-between">
            <div>
              <Drawer.Title className="text-base font-bold text-[#14201A] font-display">
                {t("budgetCap.title")}
              </Drawer.Title>
              <p className="text-xs text-[#5B6B61] font-medium mt-0.5">
                {t("budgetCap.subtitle")}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>

          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div>
              <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                {t("budgetCap.householdLabel")}
              </label>
              <input
                type="number"
                step="1"
                min="0"
                placeholder={t("budgetCap.householdPlaceholder")}
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-sm font-bold text-[#14201A] tabular-nums focus:border-[#0369A1]"
              />
            </div>

            {categories.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-[#E2ECE4]">
                <span className="text-[11px] font-extrabold text-[#5B6B61] block font-display">
                  {t("budgetCap.categoryCaps")}
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {categories.map((cat) => (
                    <div key={cat.id}>
                      <label className="text-[11px] font-bold text-[#475B4E] block mb-1">
                        {cat.name} (€)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder={t("budgetCap.noCapPlaceholder")}
                        value={catBudgets[cat.id] ?? ""}
                        onChange={(e) =>
                          setCatBudgets((prev) => ({ ...prev, [cat.id]: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#0369A1]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full min-h-[48px] py-3 rounded-full bg-[#0369A1] hover:bg-[#075985] text-white font-bold font-display text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{t("budgetCap.save")}</span>
                </>
              )}
            </button>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
