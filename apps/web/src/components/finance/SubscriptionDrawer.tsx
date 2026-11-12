import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import { CalendarClock, Check, FileText, Loader2, Upload, X } from "lucide-react";
import { usePhotoUpload } from "../../hooks/usePhotoUpload";
import { useTranslation } from "../../i18n/I18nContext";
import { translateApiError } from "../../i18n/helpers";
import type { TranslationKey } from "../../i18n/locales/en";
import { getDocumentFileName } from "./documentUtils";

export interface EditableSubscription {
  id: string;
  title: string;
  amount: string;
  billingCycle: "monthly" | "yearly" | "weekly";
  nextBillingDate: string;
  receiptKey: string | null;
  receiptUrl: string | null;
  isActive: boolean;
}

interface SubscriptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: EditableSubscription | null;
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
  subscription,
  onSaved,
}: SubscriptionDrawerProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly" | "weekly">("monthly");
  const [nextBillingDate, setNextBillingDate] = useState("");
  const [receiptKey, setReceiptKey] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { uploadPhoto, isUploading } = usePhotoUpload();

  useEffect(() => {
    if (isOpen) {
      if (subscription) {
        setTitle(subscription.title);
        setAmount(parseFloat(subscription.amount).toString());
        setBillingCycle(subscription.billingCycle);
        setNextBillingDate(
          subscription.nextBillingDate
            ? subscription.nextBillingDate.slice(0, 10)
            : new Date().toISOString().slice(0, 10)
        );
        setReceiptKey(subscription.receiptKey);
        setDocumentName(
          subscription.receiptKey
            ? getDocumentFileName(subscription.receiptUrl || subscription.receiptKey)
            : null
        );
      } else {
        setTitle("");
        setAmount("");
        setBillingCycle("monthly");
        setNextBillingDate(new Date().toISOString().slice(0, 10));
        setReceiptKey(null);
        setDocumentName(null);
      }
      setError(null);
    }
  }, [isOpen, subscription]);

  async function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const res = await uploadPhoto(file, "receipts");
      setReceiptKey(res.fileKey);
      setDocumentName(file.name);
      navigator.vibrate?.(25);
    } catch (err: any) {
      setError(translateApiError(t, err?.message, "expense.uploadFailed"));
    }
  }

  function handleRemoveDocument(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setReceiptKey(null);
    setDocumentName(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numericAmount) || numericAmount <= 0 || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const endpoint = subscription
        ? `/api/finance/subscriptions/${subscription.id}`
        : "/api/finance/subscriptions";
      const res = await fetch(endpoint, {
        method: subscription ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: numericAmount,
          billingCycle,
          nextBillingDate: new Date(`${nextBillingDate}T12:00:00Z`).toISOString(),
          receiptKey: receiptKey || null,
          isActive: subscription ? subscription.isActive : true,
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
                {subscription ? t("subscription.editTitle") : t("subscription.title")}
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

            <div className="relative">
              <label className="w-full min-h-[56px] px-4 py-3 rounded-2xl bg-[#F4F9F5] border border-dashed border-[#7DD3FC] hover:border-[#0369A1] flex items-center justify-between gap-3 cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center shrink-0">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : receiptKey ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[#14201A] truncate font-display">
                      {documentName || t("subscription.documentTitle")}
                    </div>
                    <div className="text-[11px] text-[#5B6B61] font-medium">
                      {receiptKey
                        ? t("subscription.documentUploaded")
                        : t("subscription.documentHint")}
                    </div>
                  </div>
                </div>
                {!receiptKey && <Upload className="w-4 h-4 text-[#0369A1] shrink-0" />}
                <input
                  type="file"
                  accept="image/*,application/pdf,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.heic"
                  className="hidden"
                  onChange={handleDocumentUpload}
                />
              </label>
              {receiptKey && !isUploading && (
                <button
                  type="button"
                  onClick={handleRemoveDocument}
                  aria-label={t("expense.removeDocumentAria")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#E2ECE4] hover:bg-[#FEE2E2] text-[#14201A] hover:text-[#DC2626] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={!title.trim() || !amount || isSubmitting || isUploading}
              className="w-full min-h-[48px] py-3 rounded-full bg-[#0369A1] hover:bg-[#075985] text-white font-bold font-display text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{subscription ? t("subscription.save") : t("subscription.submit")}</span>
                </>
              )}
            </button>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
