import { useState } from "react";
import { Receipt, ArrowRightLeft, CalendarClock } from "lucide-react";

export function FinancePage() {
  const [activeSubTab, setActiveSubTab] = useState<"budget" | "split" | "bills">("budget");

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

      {activeSubTab === "budget" && (
        <div className="space-y-4 md:grid md:grid-cols-[300px_1fr] md:items-start md:gap-4 md:space-y-0">
          <div className="botanical-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-[21px] font-bold tracking-[-0.025em] text-[#14201A] font-display">
                  Groceries & Household
                </h1>
                <p className="text-xs font-semibold text-[#5B6B61] mt-1 tabular-nums">
                  No monthly cap set
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] text-xs font-extrabold font-display tabular-nums shrink-0">
                0%
              </span>
            </div>

            <div className="text-2xl font-extrabold text-[#14201A] font-display tabular-nums">
              €0.00
            </div>

            <div className="w-full h-2 bg-[#E2ECE4] rounded-full overflow-hidden">
              <div className="h-full bg-[#0284C7] rounded-full w-0" />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-[#5B6B61] font-display">
                Recent Grocery Trips
              </span>
            </div>

            <div className="botanical-card p-8 text-center">
              <div className="w-11 h-11 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-[#14201A] font-display">
                No grocery trips recorded yet
              </p>
              <p className="text-xs text-[#5B6B61] mt-1 max-w-xs mx-auto">
                Unpack a completed shopping cart with expense logging enabled once the Finance API is connected.
              </p>
            </div>
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
                Common groceries and utilities split between members
              </p>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-[#E2ECE4]">
              <span className="text-xs font-bold text-[#5B6B61]">Settled</span>
              <span className="text-xl font-extrabold font-display tabular-nums text-[#475B4E]">
                €0.00
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-extrabold text-[#5B6B61] px-1 font-display">
              Recent Shared Transactions
            </div>
            <div className="botanical-card p-8 text-center">
              <div className="w-11 h-11 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mx-auto mb-3">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-[#14201A] font-display">
                No shared transactions yet
              </p>
              <p className="text-xs text-[#5B6B61] mt-1 max-w-xs mx-auto">
                Split household expenses and member balances will appear here once recorded.
              </p>
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
              €0.00<span className="text-xs font-semibold text-[#5B6B61]">/mo</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-extrabold text-[#5B6B61] px-1 font-display">
              Active Subscriptions & Utilities
            </div>
            <div className="botanical-card p-8 text-center">
              <div className="w-11 h-11 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mx-auto mb-3">
                <CalendarClock className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-[#14201A] font-display">
                No recurring bills added yet
              </p>
              <p className="text-xs text-[#5B6B61] mt-1 max-w-xs mx-auto">
                Track household utilities and subscriptions here once the Finance API is connected.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancePage;
