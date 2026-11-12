import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import { CalendarClock, Check, Loader2 } from "lucide-react";
import { useTranslation } from "../../i18n/I18nContext";
import { translateApiError } from "../../i18n/helpers";
import type { TranslationKey } from "../../i18n/locales/en";

interface SubscriptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const CYCLES: { id: "monthly" | "yearly" | "weekly"; labelKey: TranslationKey }[] = [
  { id: "monthly", labelKey: "subscription.cycle.monthly" },
  { id: "yearly", labelKey: "subscription.cycle.yearly" },
  { id: "weekly", labelKey: "subscription.cycle.weekly" },
];

export function SubscriptionDrawer({
  isOpen,
  onClose,
  onSaved,
}: SubscriptionDrawerProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly" | "weekly">("monthly");
  const [nextBillingDate, setNextBillingDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setAmount("");
      setBillingCycle("monthly");
      setNextBillingDate(new Date().toISOString().slice(0, 10));
      setError(null);
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numericAmount) || numericAmount <= 0 || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/finance/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: numericAmount,
          billingCycle,
          nextBillingDate: new Date(`${nextBillingDate}T12:00:00Z`).toISOString(),
          isActive: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(translateApiError(t, err.detail, "subscription.addFailed"));
      }

      navigator.vibrate?.(30);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || t("subscription.couldNotAdd"));
    } finally {
      setIsSubmitting(false);
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
                {t("subscription.title")}
              </Drawer.Title>
              <p className="text-xs text-[#5B6B61] font-medium mt-0.5">
                {t("subscription.subtitle")}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center shrink-0">
              <CalendarClock className="w-4 h-4" />
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
                {t("subscription.nameLabel")}
              </label>
              <input
                type="text"
                required
                placeholder={t("subscription.namePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] focus:border-[#0369A1]"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                  {t("subscription.amountLabel")}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="39.90"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#0369A1]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                  {t("subscription.nextDateLabel")}
                </label>
                <input
                  type="date"
                  required
                  value={nextBillingDate}
                  onChange={(e) => setNextBillingDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#0369A1]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5B6B61] block mb-1.5">
                {t("subscription.cadenceLabel")}
              </label>
              <div className="flex gap-2">
                {CYCLES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setBillingCycle(c.id)}
                    className={`flex-1 min-h-[40px] py-1.5 px-3 rounded-full text-xs font-bold border transition-colors cursor-pointer font-display ${
                      billingCycle === c.id
                        ? "bg-[#0369A1] text-white border-[#0369A1]"
                        : "bg-[#F4F9F5] text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
                    }`}
                  >
                    {t(c.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!title.trim() || !amount || isSubmitting}
              className="w-full min-h-[48px] py-3 rounded-full bg-[#0369A1] hover:bg-[#075985] text-white font-bold font-display text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{t("subscription.submit")}</span>
                </>
              )}
            </button>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
