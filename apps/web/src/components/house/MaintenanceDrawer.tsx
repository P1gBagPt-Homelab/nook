import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import { Check, Clock, Loader2 } from "lucide-react";
import { useTranslation } from "../../i18n/I18nContext";
import type { TranslationKey } from "../../i18n/locales/en";

interface MaintenanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assets: { id: string; name: string; roomLocation: string }[];
  defaultAssetId?: string | null;
  onSaved: () => void;
}

const INTERVAL_PRESETS: { days: number; labelKey: TranslationKey }[] = [
  { days: 30, labelKey: "maintenance.preset.30" },
  { days: 90, labelKey: "maintenance.preset.90" },
  { days: 180, labelKey: "maintenance.preset.180" },
  { days: 365, labelKey: "maintenance.preset.365" },
];

export function MaintenanceDrawer({
  isOpen,
  onClose,
  assets,
  defaultAssetId,
  onSaved,
}: MaintenanceDrawerProps) {
  const { t } = useTranslation();
  const [assetId, setAssetId] = useState("");
  const [title, setTitle] = useState("");
  const [intervalDays, setIntervalDays] = useState("90");
  const [nextDueDate, setNextDueDate] = useState("");
  const [replacementPartTitle, setReplacementPartTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAssetId(defaultAssetId || assets[0]?.id || "");
      setTitle("");
      setIntervalDays("90");
      setNextDueDate(new Date().toISOString().slice(0, 10));
      setReplacementPartTitle("");
      setError(null);
    }
  }, [isOpen, defaultAssetId, assets]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const days = parseInt(intervalDays, 10);
    if (!assetId || !title.trim() || isNaN(days) || days < 1 || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/house/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          title: title.trim(),
          intervalDays: days,
          nextDueDate: nextDueDate
            ? new Date(`${nextDueDate}T09:00:00Z`).toISOString()
            : undefined,
          replacementPartTitle: replacementPartTitle.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || t("maintenance.scheduleFailed"));
      }

      navigator.vibrate?.(30);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || t("maintenance.createFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-[#14201A]/50 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[24px] z-50 border-t border-[#E2ECE4] max-h-[92vh] overflow-y-auto">
          <div className="w-10 h-1.5 bg-[#E2ECE4] rounded-full mx-auto mt-3 mb-2" />

          <div className="px-5 py-3 border-b border-[#E2ECE4] flex items-center justify-between">
            <div>
              <Drawer.Title className="text-base font-bold text-[#14201A] font-display">
                {t("maintenance.title")}
              </Drawer.Title>
              <p className="text-xs text-[#5B6B61] font-medium mt-0.5">
                {t("maintenance.subtitle")}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
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
                {t("maintenance.applianceLabel")}
              </label>
              <select
                required
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] focus:border-[#7C3AED]"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.roomLocation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                {t("maintenance.taskLabel")}
              </label>
              <input
                type="text"
                required
                placeholder={t("maintenance.taskPlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] focus:border-[#7C3AED]"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5B6B61] block mb-1.5">
                {t("maintenance.intervalLabel")}
              </label>
              <div className="flex gap-1.5 mb-2">
                {INTERVAL_PRESETS.map((p) => (
                  <button
                    key={p.days}
                    type="button"
                    onClick={() => setIntervalDays(String(p.days))}
                    className={`flex-1 min-h-[38px] px-2 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer font-display tabular-nums ${
                      intervalDays === String(p.days)
                        ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                        : "bg-[#F4F9F5] text-[#5B6B61] border-[#E2ECE4]"
                    }`}
                  >
                    {t(p.labelKey)}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="1"
                  max="3650"
                  required
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#7C3AED]"
                />
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#7C3AED]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                {t("maintenance.partLabel")}
              </label>
              <input
                type="text"
                placeholder={t("maintenance.partPlaceholder")}
                value={replacementPartTitle}
                onChange={(e) => setReplacementPartTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-semibold text-[#14201A] focus:border-[#7C3AED]"
              />
            </div>

            <button
              type="submit"
              disabled={!assetId || !title.trim() || isSubmitting}
              className="w-full min-h-[48px] py-3 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold font-display text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{t("maintenance.save")}</span>
                </>
              )}
            </button>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
