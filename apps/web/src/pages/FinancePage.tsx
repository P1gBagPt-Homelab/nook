import { useState } from "react";
import {
  Sparkles,
  Receipt,
  Users,
} from "lucide-react";

export function FinancePage() {
  const [activeSubTab, setActiveSubTab] = useState<"budget" | "split" | "bills">("budget");

  // Sample dynamic metrics
  const monthlyBudget = 600;
  const grocerySpent = 248.5;
  const budgetPercent = Math.min(100, Math.round((grocerySpent / monthlyBudget) * 100));

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-32 space-y-4">
      {/* Top Segmented Sub-Nav */}
      <div className="flex bg-zinc-200/60 p-1 rounded-full shadow-inner mb-2 border border-zinc-200/40">
        <button
          type="button"
          onClick={() => setActiveSubTab("budget")}
          className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition duration-200 cursor-pointer ${
            activeSubTab === "budget" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <span>Budget & Trips</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("split")}
          className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition duration-200 cursor-pointer ${
            activeSubTab === "split" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <span>Shared Ledger</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("bills")}
          className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition duration-200 cursor-pointer ${
            activeSubTab === "bills" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <span>Fixed Bills</span>
        </button>
      </div>

      {activeSubTab === "budget" && (
        <div className="space-y-4">
          {/* Monthly Groceries Envelope Card (Sky Mist #0EA5E9) */}
          <div className="card-impeccable p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0EA5E9] block mb-0.5">
                  Monthly Envelope
                </span>
                <h2 className="text-base font-bold text-zinc-900">Groceries & Household</h2>
                <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                  €{(monthlyBudget - grocerySpent).toFixed(2)} remaining this month
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Spent</span>
                <div className="text-lg font-black tracking-tight text-zinc-900">
                  €{grocerySpent.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Sky Mist Progress Bar */}
            <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-[#0EA5E9] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(14,165,233,0.4)]"
                style={{ width: `${budgetPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold pt-1">
              <span>€0.00</span>
              <span className="text-zinc-700 font-bold">{budgetPercent}% used</span>
              <span>€{monthlyBudget.toFixed(2)}</span>
            </div>
          </div>

          {/* Recent Trip Expenses Logged via Grocery Unpack */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                Recent Grocery Trips
              </span>
              <span className="text-[10px] font-bold text-[#0EA5E9] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto-synced from Unpack
              </span>
            </div>

            <div className="space-y-2">
              <div className="card-impeccable p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0EA5E9] flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-zinc-900 truncate">Supermarket Run (Continente)</div>
                  <div className="text-[11px] text-zinc-400 font-medium">12 items transferred to Pantry • Yesterday</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-zinc-900">€42.80</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">Paid</span>
                </div>
              </div>

              <div className="card-impeccable p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0EA5E9] flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-zinc-900 truncate">Pingo Doce Weekly Restock</div>
                  <div className="text-[11px] text-zinc-400 font-medium">8 items transferred to Fridge • 4 days ago</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-zinc-900">€31.45</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">Paid</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "split" && (
        <div className="space-y-4">
          {/* Shared Ledger Overview */}
          <div className="card-impeccable p-5 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0EA5E9] block">
              Splitwise Replacement
            </span>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Household Shared Ledger</h2>
                <p className="text-xs text-zinc-500 mt-0.5 font-medium">All common groceries & bills split 50/50</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0EA5E9] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 font-semibold block">Settlement Balance:</span>
                <span className="text-sm font-black text-emerald-600">You are owed €18.40</span>
              </div>
              <button
                type="button"
                onClick={() => navigator.vibrate?.(25)}
                className="px-4 py-2 rounded-full bg-[#0EA5E9] text-white text-xs font-bold shadow-xs hover:bg-sky-600 active:scale-95 transition cursor-pointer"
              >
                1-Tap Settle
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-black text-zinc-400 uppercase tracking-wider px-1">
              Recent Shared Transactions
            </div>
            <div className="card-impeccable p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">
                D
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-zinc-900">Daniel paid €42.80 for Groceries</div>
                <div className="text-[10px] text-zinc-400">Your share: €21.40</div>
              </div>
              <span className="text-xs font-black text-emerald-600">+€21.40</span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "bills" && (
        <div className="space-y-4">
          {/* Monthly Burn Rate Card */}
          <div className="card-impeccable p-5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0EA5E9] block">
              Fixed Baseline
            </span>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Monthly Burn Rate</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Fixed obligations before discretionary spending</p>
              </div>
              <div className="text-lg font-black text-zinc-900">€148.90<span className="text-xs font-normal text-zinc-400">/mo</span></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-black text-zinc-400 uppercase tracking-wider px-1">
              Active Household Subscriptions
            </div>
            {[
              { name: "Fiber Gigabit Internet (MEO)", cost: "€34.90", due: "15th each month", tag: "Utility" },
              { name: "Electricity & Gas (EDP)", cost: "€75.00", due: "22nd each month", tag: "Utility" },
              { name: "Streaming Entertainment", cost: "€15.99", due: "1st each month", tag: "Sub" },
              { name: "Janus Cloud / Domain Hosting", cost: "€8.00", due: "10th each month", tag: "Tech" },
            ].map((sub, i) => (
              <div key={i} className="card-impeccable p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-zinc-900">{sub.name}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Due {sub.due}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-zinc-900">{sub.cost}</div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-bold">{sub.tag}</span>
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
