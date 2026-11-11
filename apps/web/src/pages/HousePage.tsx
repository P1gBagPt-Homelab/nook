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
    <div className="w-full">
      {/* Full-bleed 3-Column Route Switch (Plum #6D28D9) */}
      <div className="grid grid-cols-3 border-b border-[#D6D1C4] bg-[#EFECE2]">
        <button
          type="button"
          onClick={() => setActiveSubTab("appliances")}
          className={`min-h-[44px] py-2.5 px-2 text-xs font-extrabold border-r border-[#D6D1C4] border-b-[3px] transition-colors cursor-pointer ${
            activeSubTab === "appliances"
              ? "bg-[#F7F5EE] text-[#14191D] border-b-[#6D28D9]"
              : "text-[#5B6268] hover:text-[#14191D] border-b-transparent"
          }`}
        >
          Appliances
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("maintenance")}
          className={`min-h-[44px] py-2.5 px-2 text-xs font-extrabold border-r border-[#D6D1C4] border-b-[3px] transition-colors cursor-pointer ${
            activeSubTab === "maintenance"
              ? "bg-[#F7F5EE] text-[#14191D] border-b-[#6D28D9]"
              : "text-[#5B6268] hover:text-[#14191D] border-b-transparent"
          }`}
        >
          Maintenance
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("chores")}
          className={`min-h-[44px] py-2.5 px-2 text-xs font-extrabold border-b-[3px] transition-colors cursor-pointer ${
            activeSubTab === "chores"
              ? "bg-[#F7F5EE] text-[#14191D] border-b-[#6D28D9]"
              : "text-[#5B6268] hover:text-[#14191D] border-b-transparent"
          }`}
        >
          Chores
        </button>
      </div>

      {/* Explicit Demo Data Notice */}
      <div className="px-4 py-2 bg-[#F5F3FF] border-b border-[#DDD6FE] text-[#4C1D95] text-[11px] font-bold flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-[#6D28D9] shrink-0" />
        <span>Preview Data — Illustrative household dossiers, maintenance timers, and chores pending House API integration.</span>
      </div>

      {notice && (
        <div
          role="status"
          className="px-4 py-2.5 bg-[#ECFDF5] border-b border-[#A7F3D0] text-[#065F46] text-xs font-bold flex items-center justify-between"
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
        <div>
          <div className="px-4 pt-4 pb-3 border-b border-[#D6D1C4] bg-[#F7F5EE] flex items-end justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-[#14191D] leading-tight font-display">
                Appliance Dossiers
              </h2>
              <p className="text-xs font-semibold text-[#5B6268] mt-1">
                4 household assets with manuals and warranty records
              </p>
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.04em] px-2 py-1 rounded-[3px] bg-[#F5F3FF] border border-[#DDD6FE] text-[#6D28D9] shrink-0">
              MinIO Vault
            </span>
          </div>

          <div className="px-4 py-2 bg-[#EFECE2] border-b border-[#D6D1C4] flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#5B6268]">
            <span>Equipment & Warranty</span>
            <span>Zone / Files</span>
          </div>

          <div>
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
                className="px-3 sm:px-4 py-2.5 border-b border-[#E2DDD0] bg-[#FAF9F4] flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5"
              >
                <div className="min-w-0 flex-1 basis-52">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#047857] shrink-0" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-[#14191D] truncate">{app.title}</h3>
                  </div>
                  <p className="text-[11px] font-semibold text-[#5B6268] mt-0.5 tabular-nums pl-3.5 truncate">
                    {app.model} · Warranty {app.warranty}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] px-2 py-1 rounded-[3px] bg-[#F5F3FF] text-[#6D28D9] font-extrabold border border-[#DDD6FE]">
                    {app.location}
                  </span>
                  <button
                    type="button"
                    onClick={() => showActionNotice(`Opening ${app.manual}`)}
                    aria-label={`Open PDF manual for ${app.title}`}
                    className="min-h-[44px] px-2.5 py-1.5 rounded-[3px] bg-[#F7F5EE] hover:bg-[#EFECE2] text-[#14191D] text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#D6D1C4] cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#6D28D9]" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showActionNotice(`QR Sticker queued for ${app.title}`)}
                    aria-label={`Print QR sticker for ${app.title}`}
                    className="min-h-[44px] px-2.5 py-1.5 rounded-[3px] bg-[#F7F5EE] hover:bg-[#EFECE2] text-[#14191D] text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#D6D1C4] cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#14191D]" />
                    <span>QR</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "maintenance" && (
        <div>
          <div className="px-4 pt-4 pb-3 border-b border-[#D6D1C4] bg-[#F7F5EE] flex items-end justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-[#14191D] leading-tight font-display">
                Maintenance Timers
              </h2>
              <p className="text-xs font-semibold text-[#5B6268] mt-1">
                Scheduled service intervals to preserve warranties
              </p>
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.04em] px-2 py-1 rounded-[3px] bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] shrink-0">
              1 Urgent
            </span>
          </div>

          <div className="px-4 py-2 bg-[#EFECE2] border-b border-[#D6D1C4] flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#5B6268]">
            <span>Service Queue</span>
            <span>Action</span>
          </div>

          <div>
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
                  className={`px-4 py-3 border-b border-[#E2DDD0] flex items-center gap-3 ${
                    isDone ? "bg-[#F2EFE6]" : "bg-[#FAF9F4]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-[3px] flex items-center justify-center shrink-0 border ${
                      m.status === "urgent" && !isDone
                        ? "bg-[#FEF3C7] border-[#F59E0B] text-[#B45309]"
                        : "bg-[#EFECE2] border-[#D6D1C4] text-[#5B6268]"
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
                        isDone ? "line-through text-[#43494E]" : "text-[#14191D]"
                      }`}
                    >
                      {m.task}
                    </div>
                    <div className="text-[11px] font-semibold text-[#43494E] mt-0.5 tabular-nums flex items-center gap-1.5">
                      <span
                        className={
                          isDone
                            ? "w-1.5 h-1.5 rounded-full bg-[#047857]"
                            : m.status === "urgent"
                            ? "w-2.5 h-2.5 rounded-[1px] bg-[#B45309]"
                            : "w-1.5 h-1.5 rounded-full bg-[#5B6268]"
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
                    className={`min-h-[44px] px-3.5 py-1.5 rounded-[3px] text-xs font-extrabold transition-colors cursor-pointer shrink-0 border ${
                      isDone
                        ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]"
                        : "bg-[#14191D] border-[#14191D] text-white hover:bg-[#2A3137]"
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
        <div>
          <div className="px-4 pt-4 pb-3 border-b border-[#D6D1C4] bg-[#F7F5EE] flex items-end justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-[#14191D] leading-tight font-display">
                Chores & Rotation
              </h2>
              <p className="text-xs font-semibold text-[#5B6268] mt-1">
                Household task cadence and member assignments
              </p>
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#6D28D9] tabular-nums shrink-0">
              {Object.values(choresCompleted).filter(Boolean).length}/4 Done
            </span>
          </div>

          <div className="px-4 py-2 bg-[#EFECE2] border-b border-[#D6D1C4] flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#5B6268]">
            <span>Active Tasks</span>
            <span>Cadence</span>
          </div>

          <div>
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
                  className={`px-3 sm:px-4 py-2 border-b border-[#E2DDD0] flex items-center gap-2.5 transition-colors cursor-pointer ${
                    done ? "bg-[#F2EFE6]" : "bg-[#FAF9F4] hover:bg-white"
                  }`}
                >
                  <button
                    type="button"
                    aria-label="Toggle chore"
                    className="min-w-[44px] min-h-[44px] -ml-1.5 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <span
                      className={`w-5 h-5 rounded-[3px] flex items-center justify-center border-2 ${
                        done
                          ? "bg-[#047857] border-[#047857] text-white"
                          : "border-[#14191D] bg-transparent"
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm font-bold block truncate ${
                        done ? "line-through text-[#43494E]" : "text-[#14191D]"
                      }`}
                    >
                      {chore.title}
                    </span>
                    <div className="text-[11px] font-semibold text-[#43494E] mt-0.5">
                      Assigned: {chore.assigned}
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold text-[#6D28D9] tabular-nums shrink-0">
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
