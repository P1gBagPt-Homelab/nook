import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import { Check, Loader2, Users } from "lucide-react";
import { useTranslation } from "../../i18n/I18nContext";
import { translateApiError, translateFinanceCategory } from "../../i18n/helpers";
import { FinanceDocumentItem } from "./documentUtils";
import { MultiDocumentPicker } from "./MultiDocumentPicker";

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
  documents?: FinanceDocumentItem[];
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
  const [documents, setDocuments] = useState<FinanceDocumentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setTitle(expense.title);
        setAmount(parseFloat(expense.amount).toString());
        setCategoryId(expense.categoryId || "");
        setDate(expense.date ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
        setIsSplit(expense.isSplit);
        if (expense.documents && expense.documents.length > 0) {
          setDocuments(expense.documents);
        } else if (expense.receiptKey) {
          setDocuments([
            {
              fileKey: expense.receiptKey,
              fileName: expense.receiptKey.split("/").pop() || t("expense.documentAttached"),
              url: expense.receiptUrl,
            },
          ]);
        } else {
          setDocuments([]);
        }
      } else {
        setTitle("");
        setAmount("");
        setCategoryId(categories[0]?.id || "");
        setDate(new Date().toISOString().slice(0, 10));
        setIsSplit(false);
        setDocuments([]);
      }
      setError(null);
    }
  }, [isOpen, categories, expense, t]);

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
          documents: documents.map((d) => ({
            fileKey: d.fileKey,
            fileName: d.fileName,
            mimeType: d.mimeType ?? null,
          })),
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
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[24px] z-50 border-t border-[#E2ECE4] max-h-[92vh] flex flex-col focus:outline-none">
          <div className="w-10 h-1.5 bg-[#E2ECE4] rounded-full mx-auto mt-3 mb-2 shrink-0" />
          <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">

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

            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#0369A1]"
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
                  className="w-full px-3 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#0369A1]"
                />
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

            <MultiDocumentPicker
              documents={documents}
              onChange={setDocuments}
              onError={setError}
              onUploadingChange={setIsUploading}
            />

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
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
