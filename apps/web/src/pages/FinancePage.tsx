import { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  ArrowRightLeft,
  CalendarClock,
  Plus,
  SlidersHorizontal,
  Trash2,
  CheckCircle2,
  ExternalLink,
  X,
  PauseCircle,
  PlayCircle,
  Users,
  FileText,
  Pencil,
} from "lucide-react";
import {
  EditableExpense,
  ExpenseDrawer,
  FinanceCategory,
} from "../components/finance/ExpenseDrawer";
import { BudgetCapDrawer } from "../components/finance/BudgetCapDrawer";
import {
  EditableSubscription,
  SubscriptionDrawer,
} from "../components/finance/SubscriptionDrawer";
import {
  getDocumentFileName,
  isImageDocument,
  isPdfDocument,
} from "../components/finance/documentUtils";
import { useTranslation } from "../i18n/I18nContext";
import {
  translateExpenseTitle,
  translateFinanceCategory,
} from "../i18n/helpers";
import type { TranslationKey } from "../i18n/locales/en";

interface FinanceOverview {
  month: string;
  currency: string;
  monthlyBudget: number | null;
  budgetPercent: number;
  totalSpentThisMonth: number;
  expenseCountThisMonth: number;
  recurringMonthlyBurn: number;
  activeSubscriptionCount: number;
  unsettledSplitTotal: number;
  categoryBreakdown: {
    id: string;
    name: string;
    color: string;
    monthlyBudget: number | null;
    spentThisMonth: number;
  }[];
}

interface ExpenseRow {
  id: string;
  title: string;
  amount: string;
  date: string;
  paidByUserId: string;
  paidByName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  receiptKey: string | null;
  receiptUrl: string | null;
  isSplit: boolean;
  isSettled: boolean;
}

interface SubscriptionRow {
  id: string;
  title: string;
  amount: string;
  billingCycle: "monthly" | "yearly" | "weekly";
  nextBillingDate: string;
  receiptKey: string | null;
  receiptUrl: string | null;
  isActive: boolean;
  monthlyEquivalent: number;
}

interface SplitLedgerResponse {
  members: {
    id: string;
    name: string;
    paidTotal: number;
    fairShare: number;
    netBalance: number;
  }[];
  balances: {
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    amount: number;
  }[];
  unsettledTotal: number;
  splitExpenses: {
    id: string;
    title: string;
    amount: string;
    date: string;
    paidByName: string | null;
    isSettled: boolean;
    receiptUrl: string | null;
  }[];
  settlements: {
    id: string;
    fromUserName: string;
    toUserName: string;
    amount: string;
    settledAt: string;
  }[];
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

export function FinancePage() {
  const { t, intlLocale } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<"budget" | "split" | "bills">("budget");
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [splitLedger, setSplitLedger] = useState<SplitLedgerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<EditableExpense | null>(null);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<EditableSubscription | null>(
    null
  );
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  const fetchAllFinance = useCallback(async () => {
    try {
      setError(null);
      const expenseParams = new URLSearchParams({ month: selectedMonth });
      if (selectedCategoryId !== "all") {
        expenseParams.set("categoryId", selectedCategoryId);
      }

      const [ovRes, catRes, expRes, subRes, splitRes] = await Promise.all([
        fetch(`/api/finance/overview?month=${selectedMonth}`),
        fetch("/api/finance/categories"),
        fetch(`/api/finance/expenses?${expenseParams.toString()}`),
        fetch("/api/finance/subscriptions"),
        fetch("/api/finance/splits"),
      ]);

      if (!ovRes.ok) throw new Error(t("finance.loadOverviewFailed"));

      const [ovData, catData, expData, subData, splitData] = await Promise.all([
        ovRes.json(),
        catRes.ok ? catRes.json() : [],
        expRes.ok ? expRes.json() : [],
        subRes.ok ? subRes.json() : [],
        splitRes.ok ? splitRes.json() : null,
      ]);

      setOverview(ovData);
      setCategories(catData);
      setExpenses(expData);
      setSubscriptions(subData);
      setSplitLedger(splitData);
    } catch (err: any) {
      setError(err.message || t("finance.loadDataFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedCategoryId]);

  useEffect(() => {
    fetchAllFinance();
  }, [fetchAllFinance]);

  async function handleDeleteExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/finance/expenses/${id}`, { method: "DELETE" });
    fetchAllFinance();
  }

  async function handleToggleSubscription(sub: SubscriptionRow) {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, isActive: !s.isActive } : s))
    );
    await fetch(`/api/finance/subscriptions/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !sub.isActive }),
    });
    fetchAllFinance();
  }

  async function handleDeleteSubscription(id: string) {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/finance/subscriptions/${id}`, { method: "DELETE" });
    fetchAllFinance();
  }

  async function handleSettle(fromUserId?: string, toUserId?: string, amount?: number) {
    if (isSettling) return;
    setIsSettling(true);
    try {
      const res = await fetch("/api/finance/splits/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          fromUserId && toUserId ? { fromUserId, toUserId, amount } : {}
        ),
      });
      if (res.ok) {
        navigator.vibrate?.(45);
        await fetchAllFinance();
      }
    } finally {
      setIsSettling(false);
    }
  }

  const budgetPercent = overview?.budgetPercent ?? 0;
  const isOverBudget =
    overview?.monthlyBudget != null &&
    overview.totalSpentThisMonth > overview.monthlyBudget;
  const isNearBudget = !isOverBudget && budgetPercent >= 85;

  const percentBadgeClass = isOverBudget
    ? "bg-[#FEE2E2] text-[#991B1B]"
    : isNearBudget
      ? "bg-[#FEF3C7] text-[#92400E]"
      : "bg-[#E0F2FE] text-[#0369A1]";

  const progressBarClass = isOverBudget
    ? "bg-[#DC2626]"
    : isNearBudget
      ? "bg-[#D97706]"
      : "bg-[#0284C7]";

  return (
    <div className="max-w-md mx-auto md:max-w-none px-4 md:px-0 pt-4 md:pt-0 space-y-4">
      {/* Pill Sub-Navigation (Sky Blue #0369A1) */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("budget")}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-full text-xs font-extrabold border transition-colors cursor-pointer font-display ${
            activeSubTab === "budget"
              ? "bg-[#0369A1] text-white border-[#0369A1]"
              : "bg-white text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
          }`}
        >
          {t("finance.tab.budget")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("split")}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-full text-xs font-extrabold border transition-colors cursor-pointer font-display ${
            activeSubTab === "split"
              ? "bg-[#0369A1] text-white border-[#0369A1]"
              : "bg-white text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
          }`}
        >
          {t("finance.tab.split")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("bills")}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-full text-xs font-extrabold border transition-colors cursor-pointer font-display ${
            activeSubTab === "bills"
              ? "bg-[#0369A1] text-white border-[#0369A1]"
              : "bg-white text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
          }`}
        >
          {t("finance.tab.bills")}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3.5 bg-[#FEE2E2] text-[#991B1B] rounded-[18px] text-xs font-bold border border-[#FCA5A5]"
        >
          {error}
        </div>
      )}

      {activeSubTab === "budget" && (
        <div className="space-y-4 md:grid md:grid-cols-[300px_1fr] md:items-start md:gap-4 md:space-y-0">
          <div className="botanical-card p-5 space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-[21px] font-bold tracking-[-0.025em] text-[#14201A] font-display">
                  {t("finance.budgetTitle")}
                </h1>
                <p className="text-xs font-semibold text-[#5B6B61] mt-1 tabular-nums">
                  {overview?.monthlyBudget != null
                    ? t("finance.monthlyCap", { amount: overview.monthlyBudget.toFixed(2) })
                    : t("finance.noMonthlyCap")}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold font-display tabular-nums shrink-0 ${percentBadgeClass}`}
              >
                {budgetPercent}%
              </span>
            </div>

            <div className="text-2xl font-extrabold text-[#14201A] font-display tabular-nums">
              €{(overview?.totalSpentThisMonth ?? 0).toFixed(2)}
            </div>

            <div className="w-full h-2 bg-[#E2ECE4] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressBarClass}`}
                style={{ width: `${Math.min(100, budgetPercent)}%` }}
              />
            </div>

            {overview && overview.categoryBreakdown.length > 0 && (
              <div className="pt-2 border-t border-[#E2ECE4] space-y-1.5">
                {overview.categoryBreakdown.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between text-xs font-semibold"
                  >
                    <span className="text-[#475B4E]">
                      {translateFinanceCategory(t, cat.name)}
                    </span>
                    <span className="text-[#14201A] font-bold tabular-nums">
                      €{cat.spentThisMonth.toFixed(2)}
                      {cat.monthlyBudget != null && (
                        <span className="text-[#5B6B61] font-normal">
                          {" "}
                          / €{cat.monthlyBudget.toFixed(0)}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setIsExpenseOpen(true);
                }}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-full bg-[#0369A1] hover:bg-[#075985] text-white text-xs font-extrabold font-display flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{t("finance.logExpense")}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBudgetOpen(true)}
                className="min-h-[44px] py-2.5 px-3.5 rounded-full bg-[#F4F9F5] hover:bg-[#EEF7F0] border border-[#E2ECE4] text-[#14201A] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                aria-label={t("finance.capsAria")}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#0369A1]" />
                <span>{t("finance.caps")}</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-xs font-extrabold text-[#5B6B61] font-display">
                {t("finance.recentExpenses", { count: expenses.length })}
              </span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label={t("finance.filterMonthAria")}
                className="px-3 py-1.5 rounded-full bg-white border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#0369A1]"
              />
            </div>

            {categories.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId("all")}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer ${
                    selectedCategoryId === "all"
                      ? "bg-[#14201A] text-white border-[#14201A]"
                      : "bg-white text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
                  }`}
                >
                  {t("common.all")}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer ${
                      selectedCategoryId === cat.id
                        ? "bg-[#14201A] text-white border-[#14201A]"
                        : "bg-white text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
                    }`}
                  >
                    {translateFinanceCategory(t, cat.name)}
                  </button>
                ))}
              </div>
            )}

            {isLoading && expenses.length === 0 ? (
              <div className="botanical-card p-6 text-center text-xs font-bold text-[#5B6B61]">
                {t("finance.loadingExpenses")}
              </div>
            ) : expenses.length === 0 ? (
              <div className="botanical-card p-8 text-center">
                <div className="w-11 h-11 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-[#14201A] font-display">
                  {t("finance.noExpensesForMonth", { month: selectedMonth })}
                </p>
                <p className="text-xs text-[#5B6B61] mt-1 max-w-xs mx-auto">
                  {t("finance.noExpensesSubtitle")}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="botanical-card p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#14201A] truncate">
                          {translateExpenseTitle(t, exp.title)}
                        </span>
                        {exp.categoryName && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1]">
                            {translateFinanceCategory(t, exp.categoryName)}
                          </span>
                        )}
                        {exp.isSplit && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                            <Users className="w-3 h-3" />
                            <span>{t("finance.splitBadge")}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#5B6B61] font-semibold">
                        <span className="tabular-nums">{formatDate(exp.date, intlLocale)}</span>
                        {exp.paidByName && (
                          <span>· {t("finance.paidBy", { name: exp.paidByName })}</span>
                        )}
                        {exp.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => setReceiptPreviewUrl(exp.receiptUrl)}
                            className="inline-flex items-center gap-1 text-[#0369A1] font-bold hover:underline cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{t("finance.receipt")}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-sm font-extrabold text-[#14201A] font-display tabular-nums mr-1">
                        €{parseFloat(exp.amount).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingExpense(exp);
                          setIsExpenseOpen(true);
                        }}
                        aria-label={t("finance.attachDocumentAria", {
                          title: translateExpenseTitle(t, exp.title),
                        })}
                        className="w-9 h-9 rounded-full hover:bg-[#E0F2FE] text-[#5B6B61] hover:text-[#0369A1] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id)}
                        aria-label={t("finance.deleteItemAria", {
                          title: translateExpenseTitle(t, exp.title),
                        })}
                        className="w-9 h-9 rounded-full hover:bg-[#FEE2E2] text-[#5B6B61] hover:text-[#DC2626] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "split" && (
        <div className="space-y-4 md:grid md:grid-cols-[300px_1fr] md:items-start md:gap-4 md:space-y-0">
          <div className="botanical-card p-5 space-y-4">
            <div>
              <h1 className="text-[21px] font-bold tracking-[-0.025em] text-[#14201A] font-display">
                {t("finance.sharedLedgerTitle")}
              </h1>
              <p className="text-xs font-semibold text-[#5B6B61] mt-1">
                {t("finance.sharedLedgerSubtitle")}
              </p>
            </div>

            {splitLedger && splitLedger.balances.length > 0 ? (
              <div className="space-y-2.5 pt-2 border-t border-[#E2ECE4]">
                {splitLedger.balances.map((edge) => (
                  <div
                    key={`${edge.fromUserId}-${edge.toUserId}`}
                    className="p-3 rounded-2xl bg-[#E0F2FE]/60 border border-[#BAE6FD] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#14201A]">
                        {t("finance.owes", { from: edge.fromUserName, to: edge.toUserName })}
                      </span>
                      <span className="text-sm font-extrabold text-[#0369A1] font-display tabular-nums">
                        €{edge.amount.toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isSettling}
                      onClick={() =>
                        handleSettle(edge.fromUserId, edge.toUserId, edge.amount)
                      }
                      className="w-full min-h-[40px] py-1.5 px-3 rounded-full bg-[#0369A1] hover:bg-[#075985] text-white text-xs font-extrabold font-display transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isSettling ? t("finance.settling") : t("finance.settle1Tap")}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-baseline justify-between pt-2 border-t border-[#E2ECE4]">
                <span className="text-xs font-bold text-[#15803D] inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t("finance.allSettled")}</span>
                </span>
                <span className="text-xl font-extrabold font-display tabular-nums text-[#475B4E]">
                  €0.00
                </span>
              </div>
            )}

            {splitLedger && splitLedger.members.length > 0 && (
              <div className="pt-2 border-t border-[#E2ECE4] space-y-1.5">
                <div className="text-[11px] font-extrabold text-[#5B6B61] font-display">
                  {t("finance.memberNetPositions")}
                </div>
                {splitLedger.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-xs font-semibold"
                  >
                    <span className="text-[#14201A]">{m.name}</span>
                    <span
                      className={`font-bold tabular-nums ${
                        m.netBalance > 0
                          ? "text-[#16A34A]"
                          : m.netBalance < 0
                            ? "text-[#DC2626]"
                            : "text-[#5B6B61]"
                      }`}
                    >
                      {m.netBalance >= 0 ? "+" : ""}€{m.netBalance.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-[#5B6B61] font-display">
                {t("finance.recentSharedTx")}
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setIsExpenseOpen(true);
                }}
                className="min-h-[36px] px-3.5 py-1 rounded-full bg-[#0369A1] hover:bg-[#075985] text-white text-xs font-bold font-display inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("finance.addSplit")}</span>
              </button>
            </div>

            {!splitLedger || splitLedger.splitExpenses.length === 0 ? (
              <div className="botanical-card p-8 text-center">
                <div className="w-11 h-11 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mx-auto mb-3">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-[#14201A] font-display">
                  {t("finance.noSplitsTitle")}
                </p>
                <p className="text-xs text-[#5B6B61] mt-1 max-w-xs mx-auto">
                  {t("finance.noSplitsSubtitle")}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {splitLedger.splitExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className={`p-3.5 flex items-center justify-between gap-3 ${
                      exp.isSettled ? "botanical-card-settled" : "botanical-card"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold truncate ${
                            exp.isSettled ? "text-[#475B4E] line-through" : "text-[#14201A]"
                          }`}
                        >
                          {translateExpenseTitle(t, exp.title)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            exp.isSettled
                              ? "bg-[#DCFCE7] text-[#15803D]"
                              : "bg-[#E0F2FE] text-[#0369A1]"
                          }`}
                        >
                          {exp.isSettled ? t("finance.settled") : t("finance.open")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#5B6B61] font-semibold mt-0.5 tabular-nums">
                        <span>
                          {formatDate(exp.date, intlLocale)} ·{" "}
                          {t("finance.paidBy", { name: exp.paidByName || t("common.member") })}
                        </span>
                        {exp.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => setReceiptPreviewUrl(exp.receiptUrl)}
                            className="inline-flex items-center gap-1 text-[#0369A1] font-bold hover:underline cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{t("finance.receipt")}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-extrabold font-display tabular-nums text-[#14201A] shrink-0">
                      €{parseFloat(exp.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "bills" && (
        <div className="space-y-4 md:grid md:grid-cols-[300px_1fr] md:items-start md:gap-4 md:space-y-0">
          <div className="botanical-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-[21px] font-bold tracking-[-0.025em] text-[#14201A] font-display">
                  {t("finance.burnRateTitle")}
                </h1>
                <p className="text-xs font-semibold text-[#5B6B61] mt-0.5">
                  {t("finance.burnRateSubtitle")}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] text-xs font-extrabold font-display tabular-nums shrink-0">
                {t("finance.activeCount", { count: overview?.activeSubscriptionCount ?? 0 })}
              </span>
            </div>

            <div className="pt-1 text-2xl font-extrabold text-[#14201A] font-display tabular-nums">
              €{(overview?.recurringMonthlyBurn ?? 0).toFixed(2)}
              <span className="text-xs font-semibold text-[#5B6B61]">
                {t("common.perMonthShort")}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingSubscription(null);
                setIsSubOpen(true);
              }}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-[#0369A1] hover:bg-[#075985] text-white text-xs font-extrabold font-display flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{t("finance.addRecurringBill")}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-extrabold text-[#5B6B61] px-1 font-display">
              {t("finance.activeSubscriptions", { count: subscriptions.length })}
            </div>

            {subscriptions.length === 0 ? (
              <div className="botanical-card p-8 text-center">
                <div className="w-11 h-11 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mx-auto mb-3">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-[#14201A] font-display">
                  {t("finance.noBillsTitle")}
                </p>
                <p className="text-xs text-[#5B6B61] mt-1 max-w-xs mx-auto">
                  {t("finance.noBillsSubtitle")}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className={`p-3.5 flex items-center justify-between gap-3 ${
                      sub.isActive ? "botanical-card" : "botanical-card-settled"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold truncate ${
                            sub.isActive ? "text-[#14201A]" : "text-[#475B4E] line-through"
                          }`}
                        >
                          {sub.title}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1]">
                          {t(`subscription.cycle.${sub.billingCycle}` as TranslationKey)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#5B6B61] font-semibold mt-0.5 tabular-nums flex-wrap">
                        <span>
                          {t("finance.nextBilling", { date: formatDate(sub.nextBillingDate, intlLocale) })} · €
                          {sub.monthlyEquivalent.toFixed(2)}
                          {t("common.perMonthEq")}
                        </span>
                        {sub.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => setReceiptPreviewUrl(sub.receiptUrl)}
                            className="inline-flex items-center gap-1 text-[#0369A1] font-bold hover:underline cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{t("finance.receipt")}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-extrabold font-display tabular-nums text-[#14201A] mr-1">
                        €{parseFloat(sub.amount).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSubscription(sub);
                          setIsSubOpen(true);
                        }}
                        aria-label={t("finance.attachDocumentAria", { title: sub.title })}
                        className="w-9 h-9 rounded-full hover:bg-[#E0F2FE] text-[#5B6B61] hover:text-[#0369A1] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSubscription(sub)}
                        aria-label={
                          sub.isActive
                            ? t("finance.pauseAria", { title: sub.title })
                            : t("finance.resumeAria", { title: sub.title })
                        }
                        className="w-9 h-9 rounded-full hover:bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        {sub.isActive ? (
                          <PauseCircle className="w-4 h-4" />
                        ) : (
                          <PlayCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubscription(sub.id)}
                        aria-label={t("finance.deleteItemAria", { title: sub.title })}
                        className="w-9 h-9 rounded-full hover:bg-[#FEE2E2] text-[#5B6B61] hover:text-[#DC2626] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ExpenseDrawer
        isOpen={isExpenseOpen}
        onClose={() => {
          setIsExpenseOpen(false);
          setEditingExpense(null);
        }}
        categories={categories}
        expense={editingExpense}
        onSaved={fetchAllFinance}
      />

      <BudgetCapDrawer
        isOpen={isBudgetOpen}
        onClose={() => setIsBudgetOpen(false)}
        currentMonthlyBudget={overview?.monthlyBudget ?? null}
        categories={categories}
        onSaved={fetchAllFinance}
      />

      <SubscriptionDrawer
        isOpen={isSubOpen}
        onClose={() => {
          setIsSubOpen(false);
          setEditingSubscription(null);
        }}
        subscription={editingSubscription}
        onSaved={fetchAllFinance}
      />

      {receiptPreviewUrl && (
        <div
          className="fixed inset-0 z-50 bg-[#14201A]/75 flex items-center justify-center p-4"
          onClick={() => setReceiptPreviewUrl(null)}
        >
          <div
            className="botanical-card max-w-md w-full p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-[#14201A] font-display">
                {t("finance.receiptPhoto")}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={receiptPreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#0369A1] inline-flex items-center gap-1 hover:underline"
                >
                  <span>{t("finance.openOriginal")}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setReceiptPreviewUrl(null)}
                  className="w-8 h-8 rounded-full bg-[#F4F9F5] flex items-center justify-center text-[#14201A] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {isImageDocument(receiptPreviewUrl) ? (
              <img
                src={receiptPreviewUrl}
                alt={t("finance.uploadedReceiptAlt")}
                className="w-full max-h-[65vh] object-contain rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4]"
              />
            ) : isPdfDocument(receiptPreviewUrl) ? (
              <iframe
                src={receiptPreviewUrl}
                title={t("finance.receiptPhoto")}
                className="w-full h-[65vh] rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4]"
              />
            ) : (
              <div className="p-6 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-xs font-extrabold text-[#14201A] break-all">
                  {getDocumentFileName(receiptPreviewUrl)}
                </div>
                <p className="text-xs text-[#5B6B61]">{t("finance.documentPreviewHint")}</p>
                <a
                  href={receiptPreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0369A1] hover:bg-[#075985] text-white text-xs font-bold font-display transition-colors"
                >
                  <span>{t("finance.openOriginal")}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancePage;
