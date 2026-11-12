import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import { Check, CheckSquare, Loader2 } from "lucide-react";
import type { HouseholdMember } from "@nook/shared";
import { useTranslation } from "../../i18n/I18nContext";
import { translateApiError } from "../../i18n/helpers";
import type { TranslationKey } from "../../i18n/locales/en";

interface ChoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  members: HouseholdMember[];
  onSaved: () => void;
}

const CADENCES: {
  id: "daily" | "weekly" | "biweekly" | "monthly" | "once";
  labelKey: TranslationKey;
}[] = [
  { id: "daily", labelKey: "chore.cadence.daily" },
  { id: "weekly", labelKey: "chore.cadence.weekly" },
  { id: "biweekly", labelKey: "chore.cadence.biweekly" },
  { id: "monthly", labelKey: "chore.cadence.monthly" },
  { id: "once", labelKey: "chore.cadence.once" },
];

export function ChoreDrawer({
  isOpen,
  onClose,
  members,
  onSaved,
}: ChoreDrawerProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [cadence, setCadence] = useState<"daily" | "weekly" | "biweekly" | "monthly" | "once">("weekly");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setCadence("weekly");
      setAssignedToUserId("");
      setError(null);
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/house/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          cadence,
          assignedToUserId: assignedToUserId || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(translateApiError(t, err.detail, "chore.addFailed"));
      }

      navigator.vibrate?.(30);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || t("chore.createFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-[#14201A]/50 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[24px] z-50 border-t border-[#E2ECE4] max-h-[90vh] flex flex-col focus:outline-none">
          <div className="w-10 h-1.5 bg-[#E2ECE4] rounded-full mx-auto mt-3 mb-2 shrink-0" />
          <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">

          <div className="px-5 py-3 border-b border-[#E2ECE4] flex items-center justify-between">
            <div>
              <Drawer.Title className="text-base font-bold text-[#14201A] font-display">
                {t("chore.title")}
              </Drawer.Title>
              <p className="text-xs text-[#5B6B61] font-medium mt-0.5">
                {t("chore.subtitle")}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 bg-[#FEE2E2] text-[#991B1B] rounded-2xl text-xs font-bold border border-[#FCA5A5]"
              >
                {error}
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                {t("chore.titleLabel")}
              </label>
              <input
                type="text"
                required
                placeholder={t("chore.titlePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] focus:border-[#7C3AED]"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5B6B61] block mb-1.5">
                {t("chore.cadenceLabel")}
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {CADENCES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCadence(c.id)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer font-display ${
                      cadence === c.id
                        ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                        : "bg-[#F4F9F5] text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
                    }`}
                  >
                    {t(c.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {members.length > 0 && (
              <div>
                <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                  {t("chore.assignLabel")}
                </label>
                <select
                  value={assignedToUserId}
                  onChange={(e) => setAssignedToUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] focus:border-[#7C3AED]"
                >
                  <option value="">{t("chore.anyone")}</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="w-full min-h-[48px] py-3 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold font-display text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{t("chore.submit")}</span>
                </>
              )}
            </button>
          </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
