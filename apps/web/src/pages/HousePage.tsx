import { useState } from "react";
import {
  FileText,
  QrCode,
  AlertTriangle,
  Check,
  Clock,
  X,
  Info,
} from "lucide-react";

export function HousePage() {
  const [activeSubTab, setActiveSubTab] = useState<"appliances" | "maintenance" | "chores">("appliances");
  const [choresCompleted, setChoresCompleted] = useState<Record<string, boolean>>({});
  const [maintenanceDone, setMaintenanceDone] = useState<Record<number, boolean>>({});
  const [notice, setNotice] = useState<string | null>(null);

  function toggleChore(id: string) {
    navigator.vibrate?.(20);
    setChoresCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function showActionNotice(msg: string) {
    navigator.vibrate?.(15);
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  }

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

      {/* Explicit Demo Data Notice */}
      <div className="px-4 py-2.5 rounded-2xl bg-[#EDE9FE] border border-[#DDD6FE] text-[#4C1D95] text-xs font-bold flex items-center gap-2">
        <Info className="w-4 h-4 text-[#7C3AED] shrink-0" />
        <span>Preview Data — Illustrative household dossiers, maintenance timers, and chores pending House API integration.</span>
      </div>

      {notice && (
        <div
          role="status"
          className="px-4 py-2.5 rounded-2xl bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D] text-xs font-bold flex items-center justify-between"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notice"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeSubTab === "appliances" && (
        <div className="space-y-3">
          <div className="px-1 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[21px] font-bold tracking-[-0.025em] text-[#14201A] font-display">
                Appliance Dossiers
              </h1>
              <p className="text-xs font-semibold text-[#5B6B61] mt-0.5">
                4 household assets with manuals and warranty records
              </p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#EDE9FE] text-[#6D28D9] shrink-0 font-display">
              MinIO Vault
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              {
                title: "Bosch Serie 6 Washing Machine",
                model: "WAU28S08GB · S/N 892341",
                location: "Laundry",
                warranty: "Nov 2028",
                manual: "User_Manual_Bosch_S6.pdf",
              },
              {
                title: "Samsung NoFrost Refrigerator",
                model: "RB38T600ESA · S/N 441029",
                location: "Kitchen",
                warranty: "Mar 2027",
                manual: "Samsung_Fridge_Spec.pdf",
              },
              {
                title: "Daikin Inverter Split AC",
                model: "FTXM35R · S/N 109283",
                location: "Living Room",
                warranty: "Jan 2029",
                manual: "Daikin_QuickGuide.pdf",
              },
              {
                title: "Roborock Q Revo Vacuum",
                model: "QRevo MaxV · S/N 772819",
                location: "Ground Floor",
                warranty: "Jun 2026",
                manual: "Roborock_Maintenance.pdf",
              },
            ].map((app, i) => (
              <div
                key={i}
                className="botanical-card p-3.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5"
              >
                <div className="min-w-0 flex-1 basis-52">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A] shrink-0" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-[#14201A] truncate">{app.title}</h3>
                  </div>
                  <p className="text-xs font-semibold text-[#5B6B61] mt-0.5 tabular-nums pl-4 truncate">
                    {app.model} · Warranty {app.warranty}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#EDE9FE] text-[#6D28D9] font-bold">
                    {app.location}
                  </span>
                  <button
                    type="button"
                    onClick={() => showActionNotice(`Opening ${app.manual}`)}
                    aria-label={`Open PDF manual for ${app.title}`}
                    className="min-h-[44px] px-3 py-1.5 rounded-full bg-[#F4F9F5] hover:bg-[#EDE9FE] text-[#14201A] text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#E2ECE4] cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showActionNotice(`QR Sticker queued for ${app.title}`)}
                    aria-label={`Print QR sticker for ${app.title}`}
                    className="min-h-[44px] px-3 py-1.5 rounded-full bg-[#F4F9F5] hover:bg-[#EDE9FE] text-[#14201A] text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#E2ECE4] cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#14201A]" />
                    <span>QR</span>
                  </button>
                </div>
              </div>
            ))}
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
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] shrink-0 font-display">
              1 Urgent
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              { task: "Descale DeLonghi Coffee Machine", due: "Due in 3 days", status: "urgent" },
              { task: "Replace Kitchen Water Filter (Brita)", due: "Due in 14 days", status: "soon" },
              { task: "Deep Clean Robot Vacuum Brushes", due: "Due in 20 days", status: "ok" },
              { task: "Vacuum HVAC Heat Pump Filters", due: "Due in 45 days", status: "ok" },
            ].map((m, i) => {
              const isDone = !!maintenanceDone[i];
              return (
                <div
                  key={i}
                  className={`${isDone ? "botanical-card-settled" : "botanical-card"} p-3.5 flex items-center gap-3`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      m.status === "urgent" && !isDone
                        ? "bg-[#FEF3C7] text-[#D97706]"
                        : "bg-[#F4F9F5] text-[#5B6B61]"
                    }`}
                  >
                    {m.status === "urgent" && !isDone ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-bold truncate ${
                        isDone ? "line-through text-[#475B4E]" : "text-[#14201A]"
                      }`}
                    >
                      {m.task}
                    </div>
                    <div className="text-xs font-semibold text-[#475B4E] mt-0.5 tabular-nums flex items-center gap-1.5">
                      <span
                        className={
                          isDone
                            ? "w-2 h-2 rounded-full bg-[#16A34A]"
                            : m.status === "urgent"
                            ? "w-2.5 h-2.5 rounded-[3px] bg-[#D97706]"
                            : "w-2 h-2 rounded-full bg-[#5B6B61]"
                        }
                        aria-hidden="true"
                      />
                      <span>{isDone ? "Logged today" : m.due}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.vibrate?.(20);
                      setMaintenanceDone((prev) => ({ ...prev, [i]: !prev[i] }));
                    }}
                    className={`min-h-[44px] px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 font-display ${
                      isDone
                        ? "bg-[#DCFCE7] text-[#15803D]"
                        : "bg-[#14201A] text-white hover:bg-[#23382D]"
                    }`}
                  >
                    {isDone ? "Done" : "Log Done"}
                  </button>
                </div>
              );
            })}
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
              {Object.values(choresCompleted).filter(Boolean).length}/4 Done
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              { id: "c1", title: "Take out paper recycling & glass", assigned: "Daniel", cadence: "Today" },
              { id: "c2", title: "Empty & wipe dishwasher filters", assigned: "Daniel", cadence: "Tomorrow" },
              { id: "c3", title: "Run Roborock deep mop cycle", assigned: "Auto", cadence: "Wed & Sat" },
              { id: "c4", title: "Water balcony plants & herbs", assigned: "Daniel", cadence: "Every 3d" },
            ].map((chore) => {
              const done = !!choresCompleted[chore.id];
              return (
                <div
                  key={chore.id}
                  onClick={() => toggleChore(chore.id)}
                  className={`${
                    done ? "botanical-card-settled" : "botanical-card hover:border-[#C4B5FD]"
                  } px-3.5 py-2.5 flex items-center gap-2.5 transition-colors cursor-pointer`}
                >
                  <button
                    type="button"
                    aria-label="Toggle chore"
                    className="min-w-[44px] min-h-[44px] -ml-1.5 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <span
                      className={`w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 ${
                        done
                          ? "bg-[#16A34A] border-[#16A34A] text-white"
                          : "border-[#C4B5FD] bg-transparent"
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm font-bold block truncate ${
                        done ? "line-through text-[#475B4E]" : "text-[#14201A]"
                      }`}
                    >
                      {chore.title}
                    </span>
                    <div className="text-xs font-semibold text-[#475B4E] mt-0.5">
                      Assigned: {chore.assigned}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#6D28D9] tabular-nums shrink-0 font-display">
                    {chore.cadence}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default HousePage;
