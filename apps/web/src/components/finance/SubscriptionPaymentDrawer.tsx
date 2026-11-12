import { Drawer } from "vaul";
import { useEffect, useState } from "react";
import { CalendarCheck2, Check, Loader2, Receipt } from "lucide-react";
import { useTranslation } from "../../i18n/I18nContext";
import { translateApiError } from "../../i18n/helpers";
import { FinanceDocumentItem } from "./documentUtils";
import { MultiDocumentPicker } from "./MultiDocumentPicker";

export interface SubscriptionPaymentInfo {
  id: string;
  periodKey: string;
  amount: string;
  isPaid: boolean;
  paidAt: string | null;
  expenseId: string | null;
  documents: FinanceDocumentItem[];
}

export interface PaymentTargetSubscription {
  id: string;
  title: string;
  amount: string;
  currentPayment: SubscriptionPaymentInfo | null;
}

interface SubscriptionPaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: PaymentTargetSubscription | null;
  periodKey: string;
  onSaved: () => void;
}

function formatMonthLabel(periodKey: string, locale: string): string {
  const [year, month] = periodKey.split("-").map(Number);
  if (!year || !month) return periodKey;
  return new Date(Date.UTC(year, month - 1, 15)).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function SubscriptionPaymentDrawer({
  isOpen,
  onClose,
  subscription,
  periodKey,
  onSaved,
}: SubscriptionPaymentDrawerProps) {
  const { t, intlLocale } = useTranslation();
  const [isPaid, setIsPaid] = useState(true);
  const [amount, setAmount] = useState("");
  const [logToBudget, setLogToBudget] = useState(true);
  const [documents, setDocuments] = useState<FinanceDocumentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && subscription) {
      const cp =
        subscription.currentPayment?.periodKey === periodKey
          ? subscription.currentPayment
          : null;
      setIsPaid(cp ? cp.isPaid : true);
      setAmount(parseFloat(cp?.amount ?? subscription.amount).toString());
      setLogToBudget(cp ? cp.expenseId !== null : true);
      setDocuments(cp?.documents ?? []);
      setError(null);
    }
  }, [isOpen, subscription, periodKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subscription || isSubmitting) return;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/finance/subscriptions/${subscription.id}/payments/${periodKey}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: numericAmount,
            isPaid,
            logToBudget: isPaid ? logToBudget : false,
            documents: documents.map((d) => ({
              fileKey: d.fileKey,
              fileName: d.fileName,
              mimeType: d.mimeType ?? null,
            })),
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(translateApiError(t, err.detail, "subscriptionPayment.saveFailed"));
      }

      navigator.vibrate?.(30);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || t("subscriptionPayment.saveFailed"));
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
            <div className="min-w-0">
              <Drawer.Title className="text-base font-bold text-[#14201A] font-display truncate">
                {subscription?.title || t("subscriptionPayment.title")}
              </Drawer.Title>
              <p className="text-xs text-[#0369A1] font-bold mt-0.5 capitalize">
                {formatMonthLabel(periodKey, intlLocale)}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center shrink-0">
              <CalendarCheck2 className="w-4 h-4" />
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

            <button
              type="button"
              onClick={() => setIsPaid(!isPaid)}
              className={`w-full min-h-[48px] px-4 py-3 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer ${
                isPaid
                  ? "bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]"
                  : "bg-[#F4F9F5] border-[#E2ECE4] text-[#475B4E]"
              }`}
            >
              <div className="text-left">
                <div className="text-xs font-extrabold font-display">
                  {t("subscriptionPayment.paidToggle")}
                </div>
                <div className="text-[11px] opacity-85">
                  {t("subscriptionPayment.paidSubtitle")}
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isPaid
                    ? "bg-[#15803D] border-[#15803D] text-white"
                    : "border-[#94A3B8] bg-white"
                }`}
              >
                {isPaid && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            <div>
              <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                {t("subscription.amountLabel")}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#0369A1]"
              />
            </div>

            {isPaid && (
              <button
                type="button"
                onClick={() => setLogToBudget(!logToBudget)}
                className={`w-full min-h-[48px] px-4 py-3 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer ${
                  logToBudget
                    ? "bg-[#E0F2FE] border-[#7DD3FC] text-[#0369A1]"
                    : "bg-[#F4F9F5] border-[#E2ECE4] text-[#475B4E]"
                }`}
              >
                <div className="flex items-center gap-2.5 text-left">
                  <Receipt className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold font-display">
                      {t("subscriptionPayment.budgetToggle")}
                    </div>
                    <div className="text-[11px] opacity-80">
                      {t("subscriptionPayment.budgetSubtitle")}
                    </div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    logToBudget
                      ? "bg-[#0369A1] border-[#0369A1] text-white"
                      : "border-[#94A3B8] bg-white"
                  }`}
                >
                  {logToBudget && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            )}

            <MultiDocumentPicker
              documents={documents}
              onChange={setDocuments}
              onError={setError}
              onUploadingChange={setIsUploading}
            />

            <button
              type="submit"
              disabled={!amount || isSubmitting || isUploading}
              className="w-full min-h-[48px] py-3 rounded-full bg-[#0369A1] hover:bg-[#075985] text-white font-bold font-display text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{t("subscriptionPayment.save")}</span>
                </>
              )}
            </button>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
