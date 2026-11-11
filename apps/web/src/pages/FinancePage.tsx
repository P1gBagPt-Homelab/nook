import { useState } from "react";
import { Receipt, CheckCircle2, ArrowRightLeft, Info } from "lucide-react";

export function FinancePage() {
  const [activeSubTab, setActiveSubTab] = useState<"budget" | "split" | "bills">("budget");
  const [isSettled, setIsSettled] = useState(false);

  const monthlyBudget = 600;
  const grocerySpent = 248.5;
  const budgetPercent = Math.min(100, Math.round((grocerySpent / monthlyBudget) * 100));

  return (
    <div className="w-full">
      {/* Full-bleed 3-Column Route Switch (Cobalt #1D4ED8) */}
      <div className="grid grid-cols-3 border-b border-[#D6D1C4] bg-[#EFECE2]">
        <button
          type="button"
          onClick={() => setActiveSubTab("budget")}
          className={`min-h-[44px] py-2.5 px-2 text-xs font-extrabold border-r border-[#D6D1C4] border-b-[3px] transition-colors cursor-pointer ${
            activeSubTab === "budget"
              ? "bg-[#F7F5EE] text-[#14191D] border-b-[#1D4ED8]"
              : "text-[#5B6268] hover:text-[#14191D] border-b-transparent"
          }`}
        >
          Budget & Trips
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("split")}
          className={`min-h-[44px] py-2.5 px-2 text-xs font-extrabold border-r border-[#D6D1C4] border-b-[3px] transition-colors cursor-pointer ${
            activeSubTab === "split"
              ? "bg-[#F7F5EE] text-[#14191D] border-b-[#1D4ED8]"
              : "text-[#5B6268] hover:text-[#14191D] border-b-transparent"
          }`}
        >
          Shared Ledger
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("bills")}
          className={`min-h-[44px] py-2.5 px-2 text-xs font-extrabold border-b-[3px] transition-colors cursor-pointer ${
            activeSubTab === "bills"
              ? "bg-[#F7F5EE] text-[#14191D] border-b-[#1D4ED8]"
              : "text-[#5B6268] hover:text-[#14191D] border-b-transparent"
          }`}
        >
          Fixed Bills
        </button>
      </div>

      {/* Explicit Demo Data Notice */}
      <div className="px-4 py-2 bg-[#EFF6FF] border-b border-[#BFDBFE] text-[#1E3A8A] text-[11px] font-bold flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
        <span>Preview Data — Illustrative household budget and ledger entries pending Finance API integration.</span>
      </div>

      {activeSubTab === "budget" && (
        <div className="md:grid md:grid-cols-[320px_1fr] md:divide-x md:divide-[#D6D1C4]">
          {/* Summary Band */}
          <div className="px-4 pt-4 pb-4 border-b md:border-b-0 border-[#D6D1C4] bg-[#F7F5EE]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-[#14191D] leading-tight font-display">
                  Groceries & Household
                </h2>
                <p className="text-xs font-semibold text-[#5B6268] mt-1 tabular-nums">
                  €{(monthlyBudget - grocerySpent).toFixed(2)} remaining of €{monthlyBudget.toFixed(0)} cap
                </p>
              </div>
              <div className="text-right tabular-nums shrink-0">
                <div className="text-[22px] font-extrabold tracking-[-0.02em] text-[#14191D] leading-tight font-display">
                  €{grocerySpent.toFixed(2)}
                </div>
                <div className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#1D4ED8] mt-1">
                  {budgetPercent}% USED
                </div>
              </div>
            </div>

            <div className="w-full h-[3px] bg-[#E2DDD0] mt-3 overflow-hidden">
              <div
                className="h-full bg-[#1D4ED8] transition-all duration-300"
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="px-4 py-2 bg-[#EFECE2] border-b border-[#D6D1C4] flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#5B6268]">
              <span>Recent Grocery Trips</span>
              <span className="flex items-center gap-1 text-[#1D4ED8]">
                <ArrowRightLeft className="w-3 h-3" />
                <span>Unpack Sync</span>
              </span>
            </div>

            <div>
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
                  className="px-4 py-3.5 border-b border-[#E2DDD0] bg-[#FAF9F4] flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-[4px] bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#14191D] truncate">{trip.store}</div>
                    <div className="text-[11px] font-semibold text-[#5B6268] truncate mt-0.5">
                      {trip.detail}
                    </div>
                  </div>
                  <div className="text-right tabular-nums shrink-0">
                    <div className="text-xs font-extrabold text-[#14191D]">{trip.amount}</div>
                    <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] px-1.5 py-0.5 rounded-[2px] bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] font-extrabold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#047857]" aria-hidden="true" />
                      <span>{trip.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "split" && (
        <div className="md:grid md:grid-cols-[320px_1fr] md:divide-x md:divide-[#D6D1C4]">
          <div className="px-4 pt-4 pb-4 border-b md:border-b-0 border-[#D6D1C4] bg-[#F7F5EE]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-[#14191D] leading-tight font-display">
                  Household Shared Ledger
                </h2>
                <p className="text-xs font-semibold text-[#5B6268] mt-1">
                  Common groceries and utilities split 50/50
                </p>
              </div>
              <div className="text-right tabular-nums shrink-0">
                <div className={`text-lg font-extrabold leading-tight font-display ${isSettled ? "text-[#43494E]" : "text-[#047857]"}`}>
                  {isSettled ? "€0.00" : "+€18.40"}
                </div>
                <div className="inline-flex items-center justify-end gap-1 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#5B6268] mt-0.5">
                  <span
                    className={
                      isSettled
                        ? "w-1.5 h-1.5 rounded-full bg-[#5B6268]"
                        : "w-2 h-2 rounded-[2px] bg-[#047857]"
                    }
                    aria-hidden="true"
                  />
                  <span>{isSettled ? "SETTLED" : "OWED TO YOU"}</span>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  navigator.vibrate?.(25);
                  setIsSettled(!isSettled);
                }}
                className={`w-full min-h-[44px] py-2.5 px-3 rounded-[4px] text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isSettled
                    ? "bg-[#EFECE2] border border-[#D6D1C4] text-[#43494E]"
                    : "bg-[#1D4ED8] hover:bg-[#1E40AF] text-white"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSettled ? "Marked Settled (Tap to Undo)" : "1-Tap Settle"}</span>
              </button>
            </div>
          </div>

          <div>
            <div className="px-4 py-2 bg-[#EFECE2] border-b border-[#D6D1C4] flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#5B6268]">
              <span>Recent Shared Transactions</span>
              <span>Your Share</span>
            </div>

            <div className="px-4 py-3.5 border-b border-[#E2DDD0] bg-[#FAF9F4] flex items-center gap-3">
              <div className="w-8 h-8 rounded-[4px] bg-[#14191D] text-[#F7F5EE] flex items-center justify-center text-xs font-extrabold shrink-0">
                D
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#14191D]">
                  Daniel paid €42.80 for Groceries
                </div>
                <div className="text-[11px] font-semibold text-[#5B6268] mt-0.5">
                  50/50 split · Continente Supermarket Run
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#047857] tabular-nums shrink-0">
                +€21.40
              </span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "bills" && (
        <div className="md:grid md:grid-cols-[320px_1fr] md:divide-x md:divide-[#D6D1C4]">
          <div className="px-4 pt-4 pb-4 border-b md:border-b-0 border-[#D6D1C4] bg-[#F7F5EE]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-[#14191D] leading-tight font-display">
                  Monthly Burn Rate
                </h2>
                <p className="text-xs font-semibold text-[#5B6268] mt-1">
                  Fixed recurring household obligations
                </p>
              </div>
              <div className="text-right tabular-nums shrink-0">
                <div className="text-[22px] font-extrabold tracking-[-0.02em] text-[#14191D] leading-tight font-display">
                  €148.90
                </div>
                <div className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#5B6268] mt-0.5">
                  PER MONTH
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="px-4 py-2 bg-[#EFECE2] border-b border-[#D6D1C4] flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#5B6268]">
              <span>Active Subscriptions & Utilities</span>
              <span>Monthly</span>
            </div>

            <div>
              {[
                { name: "Fiber Gigabit Internet (MEO)", cost: "€34.90", due: "15th each month", tag: "Utility" },
                { name: "Electricity & Gas (EDP)", cost: "€75.00", due: "22nd each month", tag: "Utility" },
                { name: "Streaming Entertainment", cost: "€15.99", due: "1st each month", tag: "Sub" },
                { name: "Janus Cloud / Domain Hosting", cost: "€8.00", due: "10th each month", tag: "Tech" },
              ].map((sub, i) => (
                <div
                  key={i}
                  className="px-4 py-3.5 border-b border-[#E2DDD0] bg-[#FAF9F4] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#14191D] truncate">{sub.name}</div>
                    <div className="text-[11px] font-semibold text-[#5B6268] mt-0.5">
                      Due {sub.due}
                    </div>
                  </div>
                  <div className="text-right tabular-nums shrink-0">
                    <div className="text-xs font-extrabold text-[#14191D]">{sub.cost}</div>
                    <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded-[2px] bg-[#EFECE2] border border-[#D6D1C4] text-[#5B6268] font-extrabold">
                      {sub.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancePage;
