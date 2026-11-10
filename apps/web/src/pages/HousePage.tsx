import { useState } from "react";
import {
  Home,
  Wrench,
  FileText,
  QrCode,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";

export function HousePage() {
  const [activeSubTab, setActiveSubTab] = useState<"appliances" | "maintenance" | "chores">("appliances");
  const [choresCompleted, setChoresCompleted] = useState<Record<string, boolean>>({});

  function toggleChore(id: string) {
    navigator.vibrate?.(20);
    setChoresCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-32 space-y-4">
      {/* Top Segmented Sub-Nav */}
      <div className="flex bg-zinc-200/60 p-1 rounded-full shadow-inner mb-2 border border-zinc-200/40">
        <button
          type="button"
          onClick={() => setActiveSubTab("appliances")}
          className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition duration-200 cursor-pointer ${
            activeSubTab === "appliances" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <span>Appliances</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("maintenance")}
          className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition duration-200 cursor-pointer ${
            activeSubTab === "maintenance" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <span>Maintenance</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("chores")}
          className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition duration-200 cursor-pointer ${
            activeSubTab === "chores" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <span>Chores</span>
        </button>
      </div>

      {activeSubTab === "appliances" && (
        <div className="space-y-4">
          {/* Header Banner (Soft Lavender #8B5CF6) */}
          <div className="card-impeccable p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6] block mb-0.5">
                Physical Asset Locker
              </span>
              <h2 className="text-base font-bold text-zinc-900">Appliance Dossiers</h2>
              <p className="text-xs text-zinc-500 mt-0.5 font-medium">4 major household assets documented</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center">
              <Home className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Bosch Serie 6 Washing Machine",
                model: "WAU28S08GB • S/N 892341",
                location: "Laundry Zone",
                warranty: "Valid until Nov 2028",
                manual: "User_Manual_Bosch_S6.pdf",
              },
              {
                title: "Samsung NoFrost Smart Refrigerator",
                model: "RB38T600ESA • S/N 441029",
                location: "Kitchen",
                warranty: "Valid until Mar 2027",
                manual: "Samsung_Fridge_Spec.pdf",
              },
              {
                title: "Daikin Inverter Split AC / Heat Pump",
                model: "FTXM35R • S/N 109283",
                location: "Living Room",
                warranty: "Valid until Jan 2029",
                manual: "Daikin_QuickGuide.pdf",
              },
              {
                title: "Roborock Q Revo Robot Vacuum",
                model: "QRevo MaxV • S/N 772819",
                location: "Ground Floor Dock",
                warranty: "Valid until Jun 2026",
                manual: "Roborock_Maintenance.pdf",
              },
            ].map((app, i) => (
              <div key={i} className="card-impeccable p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900">{app.title}</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">{app.model}</p>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-50 text-[#8B5CF6] font-bold border border-purple-200/50">
                    {app.location}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => navigator.vibrate?.(15)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-[10px] font-bold flex items-center justify-center gap-1.5 transition border border-zinc-200/60"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>PDF Manual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigator.vibrate?.(15)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-[10px] font-bold flex items-center justify-center gap-1.5 transition border border-zinc-200/60"
                  >
                    <QrCode className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Print QR Sticker</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "maintenance" && (
        <div className="space-y-4">
          <div className="card-impeccable p-5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B] block">
              Proactive Home Care
            </span>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Maintenance Timers</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Automated schedules to preserve asset warranties</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#F59E0B] flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { task: "Descale DeLonghi Coffee Machine", due: "Due in 3 days", status: "urgent", icon: AlertTriangle },
              { task: "Replace Kitchen Water Filter (Brita)", due: "Due in 14 days", status: "soon", icon: Clock },
              { task: "Deep Clean Robot Vacuum Brushes & Mop", due: "Due in 20 days", status: "ok", icon: Clock },
              { task: "Inspect & Vacuum HVAC Heat Pump Filters", due: "Due in 45 days", status: "ok", icon: Clock },
            ].map((m, i) => (
              <div key={i} className="card-impeccable p-4 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  m.status === "urgent" ? "bg-amber-100 text-[#F59E0B]" : "bg-zinc-100 text-zinc-500"
                }`}>
                  <m.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-zinc-900">{m.task}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{m.due}</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.vibrate?.(20)}
                  className="px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-bold transition active:scale-95"
                >
                  Log Done
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "chores" && (
        <div className="space-y-4">
          <div className="card-impeccable p-5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6] block">
              Daily Operations
            </span>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Chores & Rotation</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Balanced household task cadence</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { id: "c1", title: "Take out paper recycling & glass", assigned: "Daniel", cadence: "Today" },
              { id: "c2", title: "Empty & wipe dishwasher filters", assigned: "Daniel", cadence: "Tomorrow" },
              { id: "c3", title: "Run Roborock deep mop cycle on kitchen", assigned: "Auto", cadence: "Wed & Sat" },
              { id: "c4", title: "Water balcony plants & herbs", assigned: "Daniel", cadence: "Every 3 days" },
            ].map((chore) => {
              const done = choresCompleted[chore.id];
              return (
                <div
                  key={chore.id}
                  onClick={() => toggleChore(chore.id)}
                  className={`card-impeccable p-3.5 flex items-center gap-3 transition cursor-pointer active:scale-[0.99] ${
                    done ? "bg-emerald-50/40 border-emerald-100" : ""
                  }`}
                >
                  <button
                    type="button"
                    aria-label="Toggle chore"
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition shrink-0 ${
                      done ? "bg-[#10B981] text-white" : "border-2 border-zinc-300"
                    }`}
                  >
                    {done && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-bold block truncate ${done ? "line-through text-zinc-400" : "text-zinc-900"}`}>
                      {chore.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                      <span>Assigned to: <strong className="text-zinc-600">{chore.assigned}</strong></span>
                      <span>• {chore.cadence}</span>
                    </div>
                  </div>
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
