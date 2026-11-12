import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import { Check, FileText, Loader2, Paperclip, Users, X } from "lucide-react";
import { usePhotoUpload } from "../../hooks/usePhotoUpload";
import { useTranslation } from "../../i18n/I18nContext";
import { translateApiError, translateFinanceCategory } from "../../i18n/helpers";
import { isImageDocument } from "./documentUtils";

export interface FinanceCategory {
  id: string;
  name: string;
  color: string;
  monthlyBudget: string | null;
}

export interface EditableExpense {
  id: string;
  title: string;
  amount: string;
  date: string;
  categoryId: string | null;
  receiptKey: string | null;
  receiptUrl: string | null;
  isSplit: boolean;
}

interface ExpenseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FinanceCategory[];
  expense?: EditableExpense | null;
  onSaved: () => void;
}

export function ExpenseDrawer({
  isOpen,
  onClose,
  categories,
  expense,
  onSaved,
}: ExpenseDrawerProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState("");
  const [isSplit, setIsSplit] = useState(false);
  const [receiptKey, setReceiptKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [isImagePreview, setIsImagePreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { uploadPhoto, isUploading } = usePhotoUpload();

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setTitle(expense.title);
        setAmount(parseFloat(expense.amount).toString());
        setCategoryId(expense.categoryId || "");
        setDate(expense.date ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
        setIsSplit(expense.isSplit);
        setReceiptKey(expense.receiptKey);
        setPreviewUrl(expense.receiptUrl);
        setDocumentName(expense.receiptKey ? t("expense.documentAttached") : null);
        setIsImagePreview(isImageDocument(expense.receiptUrl || expense.receiptKey));
      } else {
        setTitle("");
        setAmount("");
        setCategoryId(categories[0]?.id || "");
        setDate(new Date().toISOString().slice(0, 10));
        setIsSplit(false);
        setReceiptKey(null);
        setPreviewUrl(null);
        setDocumentName(null);
        setIsImagePreview(false);
      }
      setError(null);
    }
  }, [isOpen, categories, expense, t]);

  async function handleReceiptCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const isImage = file.type.startsWith("image/") || isImageDocument(file.name);
    try {
      setIsImagePreview(isImage);
      setDocumentName(file.name);
      if (isImage) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
      const res = await uploadPhoto(file, "receipts");
      setReceiptKey(res.fileKey);
      if (isImage) {
        setPreviewUrl(res.publicUrl);
      }
      navigator.vibrate?.(25);
    } catch (err: any) {
      setError(translateApiError(t, err?.message, "expense.uploadFailed"));
    }
  }

  function handleRemoveDocument(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setReceiptKey(null);
    setPreviewUrl(null);
    setDocumentName(null);
    setIsImagePreview(false);
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
      const endpoint = expense
        ? `/api/finance/expenses/${expense.id}`
        : "/api/finance/expenses";
      const res = await fetch(endpoint, {
        method: expense ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: numericAmount,
          categoryId: categoryId || null,
          receiptKey: receiptKey || null,
          date: date ? new Date(`${date}T12:00:00Z`).toISOString() : undefined,
          isSplit,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(translateApiError(t, err.detail, "expense.logFailed"));
      }

      navigator.vibrate?.(30);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || t("expense.saveFailed"));
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

          <div className="px-5 py-3 border-b border-[#E2ECE4]">
            <Drawer.Title className="text-base font-bold text-[#14201A] font-display">
              {expense ? t("expense.editTitle") : t("expense.title")}
            </Drawer.Title>
            <p className="text-xs text-[#5B6B61] font-medium mt-0.5">
              {t("expense.subtitle")}
            </p>
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

            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <label className="relative w-24 h-24 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-[#0284C7] transition-colors">
                  {previewUrl && isImagePreview ? (
                    <img
                      src={previewUrl}
                      alt={t("expense.receiptAlt")}
                      className="w-full h-full object-cover"
                    />
                  ) : receiptKey || documentName ? (
                    <div className="flex flex-col items-center justify-center p-2 text-center">
                      <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center mb-1">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-[#14201A] font-bold line-clamp-2 break-all">
                        {documentName || t("expense.documentAttached")}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Paperclip className="w-5 h-5 text-[#0284C7]" />
                      <span className="text-[11px] text-[#5B6B61] mt-1 font-bold text-center px-1">
                        {t("expense.receiptSnap")}
                      </span>
                    </>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-[#14201A]/60 flex items-center justify-center text-white">
                      <Loader2 className="w-5 h-5 animate-spin text-[#E0F2FE]" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*,application/pdf,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.heic"
                    className="hidden"
                    onChange={handleReceiptCapture}
                  />
                </label>
                {(receiptKey || previewUrl || documentName) && !isUploading && (
                  <button
                    type="button"
                    onClick={handleRemoveDocument}
                    aria-label={t("expense.removeDocumentAria")}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#14201A] text-white flex items-center justify-center shadow-sm hover:bg-[#DC2626] transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                    {t("expense.titleLabel")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t("expense.titlePlaceholder")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] focus:border-[#0369A1]"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                      {t("expense.amountLabel")}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#0369A1]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                      {t("expense.dateLabel")}
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-2.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#0369A1]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {categories.length > 0 && (
              <div>
                <label className="text-[11px] font-bold text-[#5B6B61] block mb-1.5">
                  {t("expense.categoryLabel")}
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer font-display ${
                        categoryId === cat.id
                          ? "bg-[#0369A1] text-white border-[#0369A1]"
                          : "bg-[#F4F9F5] text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
                      }`}
                    >
                      {translateFinanceCategory(t, cat.name)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsSplit(!isSplit)}
              className={`w-full min-h-[48px] px-4 py-3 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer ${
                isSplit
                  ? "bg-[#E0F2FE] border-[#7DD3FC] text-[#0369A1]"
                  : "bg-[#F4F9F5] border-[#E2ECE4] text-[#475B4E]"
              }`}
            >
              <div className="flex items-center gap-2.5 text-left">
                <Users className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-xs font-extrabold font-display">
                    {t("expense.splitTitle")}
                  </div>
                  <div className="text-[11px] opacity-80">
                    {t("expense.splitSubtitle")}
                  </div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSplit
                    ? "bg-[#0369A1] border-[#0369A1] text-white"
                    : "border-[#94A3B8] bg-white"
                }`}
              >
                {isSplit && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            <button
              type="submit"
              disabled={!title.trim() || !amount || isSubmitting || isUploading}
              className="w-full min-h-[48px] py-3 rounded-full bg-[#0369A1] hover:bg-[#075985] active:scale-[0.99] text-white font-bold font-display text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{t("expense.save")}</span>
                </>
              )}
            </button>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
