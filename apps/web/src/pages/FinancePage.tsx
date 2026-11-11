import { useState } from "react";
import { Receipt, CheckCircle2, ArrowRightLeft, Info } from "lucide-react";

export function FinancePage() {
  const [activeSubTab, setActiveSubTab] = useState<"budget" | "split" | "bills">("budget");
  const [isSettled, setIsSettled] = useState(false);

  const monthlyBudget = 600;
  const grocerySpent = 248.5;
  const budgetPercent = Math.min(100, Math.round((grocerySpent / monthlyBudget) * 100));

  return (
    <div className="max-w-md mx-auto md:max-w-none px-4 md:px-0 pt-4 md:pt-0 space-y-4">
      {/* Pill Sub-Navigation (Sky Blue #0284C7) */}
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
          Budget & Trips
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
          Shared Ledger
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
          Fixed Bills
        </button>
      </div>

      {/* Explicit Demo Data Notice */}
      <div className="px-4 py-2.5 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] text-[#075985] text-xs font-bold flex items-center gap-2">
        <Info className="w-4 h-4 text-[#0284C7] shrink-0" />
        <span>Preview Data — Illustrative household budget and ledger entries pending Finance API integration.</span>
      </div>

      {activeSubTab === "budget" && (
        <div className="space-y-4 md:grid md:grid-cols-[300px_1fr] md:items-start md:gap-4 md:space-y-0">
          <div className="botanical-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-[21px] font-bold tracking-[-0.025em] text-[#14201A] font-display">
                  Groceries & Household
                </h1>
                <p className="text-xs font-semibold text-[#5B6B61] mt-1 tabular-nums">
                  €{(monthlyBudget - grocerySpent).toFixed(2)} left of €{monthlyBudget.toFixed(0)} cap
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] text-xs font-extrabold font-display tabular-nums shrink-0">
                {budgetPercent}%
              </span>
            </div>

            <div className="text-2xl font-extrabold text-[#14201A] font-display tabular-nums">
              €{grocerySpent.toFixed(2)}
            </div>

            <div className="w-full h-2 bg-[#E2ECE4] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0284C7] rounded-full transition-all duration-300"
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-[#5B6B61] font-display">
                Recent Grocery Trips
              </span>
              <span className="text-xs font-bold text-[#0284C7] flex items-center gap-1">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Unpack Sync</span>
              </span>
            </div>

            {[
              {
                store: "Supermarket Run (Continente)",
                detail: "12 items transferred to Pantry · Yesterday",
                amount: "€42.80",
                status: "Paid",
              },
              {
                store: "Pingo Doce Weekly Restock",
                detail: "8 items transferred to Fridge · 4 days ago",
                amount: "€31.45",
                status: "Paid",
              },
            ].map((trip, idx) => (
              <div
                key={idx}
                className="botanical-card p-3.5 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#14201A] truncate">{trip.store}</div>
                  <div className="text-xs font-semibold text-[#5B6B61] truncate mt-0.5">
                    {trip.detail}
                  </div>
                </div>
                <div className="text-right tabular-nums shrink-0">
                  <div className="text-sm font-bold text-[#14201A] font-display">{trip.amount}</div>
                  <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
                    <span>{trip.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "split" && (
        <div className="space-y-4 md:grid md:grid-cols-[300px_1fr] md:items-start md:gap-4 md:space-y-0">
          <div className="botanical-card p-5 space-y-4">
            <div>
              <h1 className="text-[21px] font-bold tracking-[-0.025em] text-[#14201A] font-display">
                Household Shared Ledger
              </h1>
              <p className="text-xs font-semibold text-[#5B6B61] mt-1">
                Common groceries and utilities split 50/50
              </p>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-[#E2ECE4]">
              <span className="text-xs font-bold text-[#5B6B61]">
                {isSettled ? "Settled" : "Owed to you"}
              </span>
              <span
                className={`text-xl font-extrabold font-display tabular-nums ${
                  isSettled ? "text-[#475B4E]" : "text-[#16A34A]"
                }`}
              >
                {isSettled ? "€0.00" : "+€18.40"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.vibrate?.(25);
                setIsSettled(!isSettled);
              }}
              className={`w-full min-h-[44px] py-2.5 px-4 rounded-full text-xs font-bold font-display flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isSettled
                  ? "bg-[#F4F9F5] border border-[#E2ECE4] text-[#475B4E]"
                  : "bg-[#0369A1] hover:bg-[#075985] text-white"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSettled ? "Marked Settled (Tap to Undo)" : "1-Tap Settle"}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-extrabold text-[#5B6B61] px-1 font-display">
              Recent Shared Transactions
            </div>
            <div className="botanical-card p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center text-xs font-extrabold font-display shrink-0">
                D
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#14201A]">
                  Daniel paid €42.80 for Groceries
                </div>
                <div className="text-xs font-semibold text-[#5B6B61] mt-0.5">
                  50/50 split · Continente Supermarket Run
                </div>
              </div>
              <span className="text-sm font-bold text-[#16A34A] font-display tabular-nums shrink-0">
                +€21.40
              </span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "bills" && (
        <div className="space-y-4 md:grid md:grid-cols-[300px_1fr] md:items-start md:gap-4 md:space-y-0">
          <div className="botanical-card p-5 space-y-2">
            <h1 className="text-[21px] font-bold tracking-[-0.025em] text-[#14201A] font-display">
              Monthly Burn Rate
            </h1>
            <p className="text-xs font-semibold text-[#5B6B61]">
              Fixed recurring household obligations
            </p>
            <div className="pt-2 text-2xl font-extrabold text-[#14201A] font-display tabular-nums">
              €148.90<span className="text-xs font-semibold text-[#5B6B61]">/mo</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-extrabold text-[#5B6B61] px-1 font-display">
              Active Subscriptions & Utilities
            </div>
            {[
              { name: "Fiber Gigabit Internet (MEO)", cost: "€34.90", due: "15th each month", tag: "Utility" },
              { name: "Electricity & Gas (EDP)", cost: "€75.00", due: "22nd each month", tag: "Utility" },
              { name: "Streaming Entertainment", cost: "€15.99", due: "1st each month", tag: "Sub" },
              { name: "Janus Cloud / Domain Hosting", cost: "€8.00", due: "10th each month", tag: "Tech" },
            ].map((sub, i) => (
              <div
                key={i}
                className="botanical-card p-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#14201A] truncate">{sub.name}</div>
                  <div className="text-xs font-semibold text-[#5B6B61] mt-0.5">
                    Due {sub.due}
                  </div>
                </div>
                <div className="text-right tabular-nums shrink-0">
                  <div className="text-sm font-bold text-[#14201A] font-display">{sub.cost}</div>
                  <span className="inline-block mt-0.5 text-[11px] px-2.5 py-0.5 rounded-full bg-[#F4F9F5] border border-[#E2ECE4] text-[#5B6B61] font-bold">
                    {sub.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancePage;
