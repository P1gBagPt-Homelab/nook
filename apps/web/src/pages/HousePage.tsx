import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Clock,
  CheckSquare,
  Plus,
  QrCode,
  ExternalLink,
  Trash2,
  ShoppingCart,
  Check,
  Flame,
  Wrench,
} from "lucide-react";
import type { HouseholdMember } from "@nook/shared";
import { AssetDrawer } from "../components/house/AssetDrawer";
import { QrLabelModal } from "../components/house/QrLabelModal";
import { MaintenanceDrawer } from "../components/house/MaintenanceDrawer";
import { ChoreDrawer } from "../components/house/ChoreDrawer";

interface AssetItem {
  id: string;
  name: string;
  roomLocation: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  warrantyUntil: string | null;
  manualKey: string | null;
  manualUrl: string | null;
  qrCodeToken: string;
}

interface MaintenanceItem {
  id: string;
  assetId: string;
  assetName: string;
  roomLocation: string;
  title: string;
  intervalDays: number;
  lastCompletedAt: string | null;
  nextDueDate: string;
  replacementPartTitle: string | null;
  isDue: boolean;
  daysUntilDue: number;
}

interface ChoreItem {
  id: string;
  title: string;
  cadence: "daily" | "weekly" | "biweekly" | "monthly" | "once";
  assignedToUserId: string | null;
  assignedToName: string | null;
  isCompleted: boolean;
  streakCount: number;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function HousePage() {
  const [activeSubTab, setActiveSubTab] = useState<
    "appliances" | "maintenance" | "chores"
  >("appliances");

  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queuedNoticeId, setQueuedNoticeId] = useState<string | null>(null);

  const [isAssetOpen, setIsAssetOpen] = useState(false);
  const [qrAsset, setQrAsset] = useState<AssetItem | null>(null);
  const [isMaintOpen, setIsMaintOpen] = useState(false);
  const [maintDefaultAssetId, setMaintDefaultAssetId] = useState<string | null>(null);
  const [isChoreOpen, setIsChoreOpen] = useState(false);

  const fetchHouseData = useCallback(async () => {
    try {
      setError(null);
      const [assetsRes, maintRes, choresRes, membersRes] = await Promise.all([
        fetch("/api/house/assets"),
        fetch("/api/house/maintenance"),
        fetch("/api/house/chores"),
        fetch("/api/auth/members"),
      ]);

      if (!assetsRes.ok) throw new Error("Failed to load house management data");

      const [assetsData, maintData, choresData, membersData] = await Promise.all([
        assetsRes.json(),
        maintRes.ok ? maintRes.json() : [],
        choresRes.ok ? choresRes.json() : [],
        membersRes.ok ? membersRes.json() : { members: [] },
      ]);

      setAssets(assetsData);
      setMaintenance(maintData);
      setChores(choresData);
      setMembers(membersData.members || []);
    } catch (err: any) {
      setError(err.message || "Could not load house data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHouseData();
  }, [fetchHouseData]);

  async function handleDeleteAsset(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/house/assets/${id}`, { method: "DELETE" });
    fetchHouseData();
  }

  async function handleCompleteMaintenance(id: string) {
    const res = await fetch(`/api/house/maintenance/${id}/complete`, {
      method: "POST",
    });
    if (res.ok) {
      navigator.vibrate?.(35);
      await fetchHouseData();
    }
  }

  async function handleQueueReplacement(id: string) {
    const res = await fetch(`/api/house/maintenance/${id}/queue-replacement`, {
      method: "POST",
    });
    if (res.ok) {
      navigator.vibrate?.(30);
      setQueuedNoticeId(id);
      setTimeout(() => setQueuedNoticeId(null), 3500);
    }
  }

  async function handleDeleteMaintenance(id: string) {
    setMaintenance((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/house/maintenance/${id}`, { method: "DELETE" });
    fetchHouseData();
  }

  async function handleToggleChore(chore: ChoreItem) {
    const nextCompleted = !chore.isCompleted;
    setChores((prev) =>
      prev.map((c) =>
        c.id === chore.id
          ? {
              ...c,
              isCompleted: nextCompleted,
              streakCount: nextCompleted
                ? c.streakCount + 1
                : Math.max(0, c.streakCount - 1),
            }
          : c
      )
    );
    navigator.vibrate?.(20);

    await fetch(`/api/house/chores/${chore.id}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: nextCompleted }),
    });
    fetchHouseData();
  }

  async function handleDeleteChore(id: string) {
    setChores((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/house/chores/${id}`, { method: "DELETE" });
    fetchHouseData();
  }

  const dueCount = maintenance.filter((m) => m.isDue).length;
  const doneChoresCount = chores.filter((c) => c.isCompleted).length;

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

      {error && (
        <div
          role="alert"
          className="p-3.5 bg-[#FEE2E2] text-[#991B1B] rounded-[18px] text-xs font-bold border border-[#FCA5A5]"
        >
          {error}
        </div>
      )}

      {activeSubTab === "appliances" && (
        <div className="space-y-3">
          <div className="px-1 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[21px] font-bold tracking-[-0.025em] text-[#14201A] font-display">
                Appliance Dossiers
              </h1>
              <p className="text-xs font-semibold text-[#5B6B61] mt-0.5 tabular-nums">
                {assets.length} household {assets.length === 1 ? "asset" : "assets"} tracked
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAssetOpen(true)}
              className="min-h-[40px] px-4 py-2 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-extrabold font-display inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Appliance</span>
            </button>
          </div>

          {isLoading && assets.length === 0 ? (
            <div className="botanical-card p-6 text-center text-xs font-bold text-[#5B6B61]">
              Loading appliance dossiers...
            </div>
          ) : assets.length === 0 ? (
            <div className="botanical-card p-8 text-center">
              <div className="w-11 h-11 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center mx-auto mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-[#14201A] font-display">
                No appliances registered yet
              </p>
              <p className="text-xs text-[#5B6B61] mt-1 max-w-xs mx-auto">
                Add appliances with PDF user manuals, warranty dates, and printable QR stickers.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="botanical-card p-4 space-y-3 hover:border-[#C4B5FD] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-extrabold text-[#14201A] font-display truncate">
                          {asset.name}
                        </h2>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#6D28D9]">
                          {asset.roomLocation}
                        </span>
                      </div>
                      {(asset.brand || asset.model) && (
                        <p className="text-xs font-semibold text-[#475B4E] mt-1">
                          {[asset.brand, asset.model].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px] font-semibold text-[#5B6B61] tabular-nums">
                        {asset.serialNumber && <span>S/N: {asset.serialNumber}</span>}
                        {asset.warrantyUntil && (
                          <span>· Warranty until {formatShortDate(asset.warrantyUntil)}</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAsset(asset.id)}
                      aria-label={`Delete ${asset.name}`}
                      className="w-9 h-9 rounded-full hover:bg-[#FEE2E2] text-[#5B6B61] hover:text-[#DC2626] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E2ECE4]">
                    {asset.manualUrl && (
                      <a
                        href={asset.manualUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-[38px] px-3 py-1.5 rounded-full bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#6D28D9] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF Manual</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setQrAsset(asset)}
                      className="min-h-[38px] px-3 py-1.5 rounded-full bg-[#F4F9F5] hover:bg-[#EEF7F0] border border-[#E2ECE4] text-[#14201A] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <span>QR Label</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMaintDefaultAssetId(asset.id);
                        setIsMaintOpen(true);
                      }}
                      className="min-h-[38px] px-3 py-1.5 rounded-full bg-[#F4F9F5] hover:bg-[#EEF7F0] border border-[#E2ECE4] text-[#14201A] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <span>+ Timer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full font-display tabular-nums ${
                  dueCount > 0
                    ? "bg-[#FEF3C7] text-[#92400E]"
                    : "bg-[#EDE9FE] text-[#6D28D9]"
                }`}
              >
                {dueCount} Due
              </span>
              {assets.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMaintDefaultAssetId(assets[0].id);
                    setIsMaintOpen(true);
                  }}
                  className="min-h-[40px] px-4 py-2 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-extrabold font-display inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Timer</span>
                </button>
              )}
            </div>
          </div>

          {maintenance.length === 0 ? (
            <div className="botanical-card p-8 text-center">
              <div className="w-11 h-11 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-[#14201A] font-display">
                No maintenance timers scheduled
              </p>
              <p className="text-xs text-[#5B6B61] mt-1 max-w-xs mx-auto">
                {assets.length === 0
                  ? "Register an appliance first, then attach recurring filter or descale timers."
                  : "Add a recurring filter change or descale timer to get timely reminders."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {maintenance.map((task) => {
                const isDue = task.isDue;
                return (
                  <div
                    key={task.id}
                    className={`p-4 space-y-3 ${
                      isDue ? "botanical-card border-[#FCD34D]" : "botanical-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold text-[#14201A] font-display">
                            {task.title}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full tabular-nums ${
                              isDue
                                ? "bg-[#FEF3C7] text-[#92400E]"
                                : "bg-[#EDE9FE] text-[#6D28D9]"
                            }`}
                          >
                            {isDue
                              ? task.daysUntilDue < 0
                                ? `Overdue ${Math.abs(task.daysUntilDue)}d`
                                : "Due today"
                              : `In ${task.daysUntilDue}d`}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#5B6B61] mt-1 tabular-nums">
                          {task.assetName} ({task.roomLocation}) · Every {task.intervalDays}d · Next:{" "}
                          {formatShortDate(task.nextDueDate)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteMaintenance(task.id)}
                        aria-label={`Delete ${task.title}`}
                        className="w-9 h-9 rounded-full hover:bg-[#FEE2E2] text-[#5B6B61] hover:text-[#DC2626] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCompleteMaintenance(task.id)}
                        className="min-h-[40px] px-4 py-2 rounded-full bg-[#14201A] hover:bg-[#2A3B31] text-white text-xs font-bold font-display inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Log Done</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQueueReplacement(task.id)}
                        className="min-h-[40px] px-4 py-2 rounded-full bg-[#FF6B4A] hover:bg-[#FF5530] text-[#14201A] text-xs font-extrabold font-display inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>
                          {queuedNoticeId === task.id
                            ? "Added to Shopping Cart!"
                            : "+ Add to Shopping Cart"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EDE9FE] text-[#6D28D9] tabular-nums font-display">
                {doneChoresCount}/{chores.length} Done
              </span>
              <button
                type="button"
                onClick={() => setIsChoreOpen(true)}
                className="min-h-[40px] px-4 py-2 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-extrabold font-display inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Chore</span>
              </button>
            </div>
          </div>

          {chores.length === 0 ? (
            <div className="botanical-card p-8 text-center">
              <div className="w-11 h-11 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center mx-auto mb-3">
                <CheckSquare className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-[#14201A] font-display">
                No chores configured yet
              </p>
              <p className="text-xs text-[#5B6B61] mt-1 max-w-xs mx-auto">
                Create recurring household chores and assign them across household members.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {chores.map((chore) => (
                <div
                  key={chore.id}
                  className={`px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                    chore.isCompleted
                      ? "botanical-card-settled"
                      : "botanical-card hover:border-[#C4B5FD]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleChore(chore)}
                      aria-label={`Mark ${chore.title} as ${chore.isCompleted ? "pending" : "completed"}`}
                      className="w-11 h-11 flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <span
                        className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-colors ${
                          chore.isCompleted
                            ? "bg-[#16A34A] border-[#16A34A] text-white"
                            : "border-[#C4B5FD] bg-white"
                        }`}
                      >
                        {chore.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </span>
                    </button>

                    <div className="min-w-0">
                      <div
                        className={`text-sm font-bold truncate ${
                          chore.isCompleted
                            ? "text-[#475B4E] line-through"
                            : "text-[#14201A]"
                        }`}
                      >
                        {chore.title}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[11px] font-bold">
                        <span className="px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#6D28D9] capitalize">
                          {chore.cadence}
                        </span>
                        {chore.assignedToName && (
                          <span className="text-[#5B6B61]">{chore.assignedToName}</span>
                        )}
                        {chore.streakCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[#D97706] tabular-nums">
                            <Flame className="w-3 h-3" />
                            <span>{chore.streakCount}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteChore(chore.id)}
                    aria-label={`Delete ${chore.title}`}
                    className="w-9 h-9 rounded-full hover:bg-[#FEE2E2] text-[#5B6B61] hover:text-[#DC2626] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AssetDrawer
        isOpen={isAssetOpen}
        onClose={() => setIsAssetOpen(false)}
        onSaved={fetchHouseData}
      />

      <QrLabelModal asset={qrAsset} onClose={() => setQrAsset(null)} />

      <MaintenanceDrawer
        isOpen={isMaintOpen}
        onClose={() => setIsMaintOpen(false)}
        assets={assets}
        defaultAssetId={maintDefaultAssetId}
        onSaved={fetchHouseData}
      />

      <ChoreDrawer
        isOpen={isChoreOpen}
        onClose={() => setIsChoreOpen(false)}
        members={members}
        onSaved={fetchHouseData}
      />
    </div>
  );
}

export default HousePage;
