import { useState } from "react";
import { FileText, Clock, CheckSquare } from "lucide-react";

export function HousePage() {
  const [activeSubTab, setActiveSubTab] = useState<"appliances" | "maintenance" | "chores">("appliances");

  return (
    <div className="max-w-md mx-auto md:max-w-none px-4 md:px-0 pt-4 md:pt-0 space-y-4">
      {/* Pill Sub-Navigation (Iris Violet #7C3AED) */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("appliances")}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-full text-xs font-extrabold border transition-colors cursor-pointer font-display ${
            activeSubTab === "appliances"
              ? "bg-[#7C3AED] text-white border-[#7C3AED]"
              : "bg-white text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
          }`}
        >
          Appliances
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("maintenance")}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-full text-xs font-extrabold border transition-colors cursor-pointer font-display ${
            activeSubTab === "maintenance"
              ? "bg-[#7C3AED] text-white border-[#7C3AED]"
              : "bg-white text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
          }`}
        >
          Maintenance
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("chores")}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-full text-xs font-extrabold border transition-colors cursor-pointer font-display ${
            activeSubTab === "chores"
              ? "bg-[#7C3AED] text-white border-[#7C3AED]"
              : "bg-white text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
          }`}
        >
          Chores
        </button>
      </div>

      {activeSubTab === "appliances" && (
        <div className="space-y-3">
          <div className="px-1 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[21px] font-bold tracking-[-0.025em] text-[#14201A] font-display">
                Appliance Dossiers
              </h1>
              <p className="text-xs font-semibold text-[#5B6B61] mt-0.5 tabular-nums">
                0 household assets tracked
              </p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#EDE9FE] text-[#6D28D9] shrink-0 font-display">
              MinIO Vault
            </span>
          </div>

          <div className="botanical-card p-8 text-center">
            <div className="w-11 h-11 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center mx-auto mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-[#14201A] font-display">
              No appliances registered yet
            </p>
            <p className="text-xs text-[#5B6B61] mt-1 max-w-xs mx-auto">
              Appliance manuals, warranty dates, and QR codes will appear here once the House API is connected.
            </p>
          </div>
        </div>
      )}

      {activeSubTab === "maintenance" && (
        <div className="space-y-3">
          <div className="px-1 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[21px] font-bold tracking-[-0.025em] text-[#14201A] font-display">
                Maintenance Timers
              </h1>
              <p className="text-xs font-semibold text-[#5B6B61] mt-0.5">
                Scheduled service intervals to preserve warranties
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EDE9FE] text-[#6D28D9] shrink-0 font-display tabular-nums">
              0 Due
            </span>
          </div>

          <div className="botanical-card p-8 text-center">
            <div className="w-11 h-11 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center mx-auto mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-[#14201A] font-display">
              No maintenance timers scheduled
            </p>
            <p className="text-xs text-[#5B6B61] mt-1 max-w-xs mx-auto">
              Recurring filter replacements, descaling, and service reminders will appear here once configured.
            </p>
          </div>
        </div>
      )}

      {activeSubTab === "chores" && (
        <div className="space-y-3">
          <div className="px-1 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[21px] font-bold tracking-[-0.025em] text-[#14201A] font-display">
                Chores & Rotation
              </h1>
              <p className="text-xs font-semibold text-[#5B6B61] mt-0.5">
                Household task cadence and member assignments
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EDE9FE] text-[#6D28D9] tabular-nums shrink-0 font-display">
              0/0 Done
            </span>
          </div>

          <div className="botanical-card p-8 text-center">
            <div className="w-11 h-11 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-[#14201A] font-display">
              No chores configured yet
            </p>
            <p className="text-xs text-[#5B6B61] mt-1 max-w-xs mx-auto">
              Recurring household chores and member rotations will appear here once the House API is connected.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HousePage;
