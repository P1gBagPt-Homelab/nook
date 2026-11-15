import { useState } from "react";
import { Drawer } from "vaul";
import { X, ShoppingBag, CheckCircle, Package, ShieldCheck } from "lucide-react";
import { useTranslation } from "../../i18n/I18nContext";

interface SyncToCartModalProps {
  planId: string;
  isOpen: boolean;
  onClose: () => void;
  onCartSynced: () => void;
}

export function SyncToCartModal({
  planId,
  isOpen,
  onClose,
  onCartSynced,
}: SyncToCartModalProps) {
  const { t } = useTranslation();
  const [deductStock, setDeductStock] = useState(true);
  const [roundToPackage, setRoundToPackage] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  async function handleSync() {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/meals/sync-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          deductStock,
          roundToPackageUnit: roundToPackage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSyncResult(data);
        onCartSynced();
      }
    } catch {
      // error
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-[#14201A]/50 z-50 backdrop-blur-xs" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[#F4F9F5] rounded-t-[24px] z-50 border-t border-[#E2ECE4] max-h-[90vh] flex flex-col focus:outline-none overflow-hidden">
          {/* Grab Handle */}
          <div className="w-12 h-1.5 bg-[#CDE5D3] rounded-full mx-auto my-3 shrink-0" />

          {/* Header */}
          <div className="px-5 pb-3 border-b border-[#E2ECE4] flex items-center justify-between bg-white">
            <div>
              <Drawer.Title className="text-lg font-extrabold text-[#14201A] font-display flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#15803D]" />
                <span>{t("meals.sync.title")}</span>
              </Drawer.Title>
              <p className="text-xs text-[#5B6B61] mt-0.5">
                {t("meals.sync.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#5B6B61] hover:text-[#14201A] bg-[#F4F9F5] border border-[#E2ECE4] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {!syncResult ? (
              <>
                {/* Value Prop Banner */}
                <div className="bg-[#EEF7F0] p-4 rounded-[18px] border border-[#CDE5D3] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#15803D] font-display">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t("meals.sync.bannerTitle")}</span>
                  </div>
                  <p className="text-xs text-[#475B4E] leading-relaxed">
                    {t("meals.sync.bannerDesc")}
                  </p>
                </div>

                {/* Options */}
                <div className="bg-white p-4 rounded-[18px] border border-[#E2ECE4] space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-[#15803D]" />
                      <div>
                        <div className="text-xs font-bold text-[#14201A]">
                          {t("meals.sync.deductStockTitle")}
                        </div>
                        <div className="text-[11px] text-[#5B6B61]">
                          {t("meals.sync.deductStockDesc")}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={deductStock}
                      onChange={(e) => setDeductStock(e.target.checked)}
                      className="w-4 h-4 accent-[#15803D] rounded cursor-pointer"
                    />
                  </label>

                  <div className="h-px bg-[#E2ECE4]" />

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <ShoppingBag className="w-4 h-4 text-[#0284C7]" />
                      <div>
                        <div className="text-xs font-bold text-[#14201A]">
                          {t("meals.sync.roundPackTitle")}
                        </div>
                        <div className="text-[11px] text-[#5B6B61]">
                          {t("meals.sync.roundPackDesc")}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={roundToPackage}
                      onChange={(e) => setRoundToPackage(e.target.checked)}
                      className="w-4 h-4 accent-[#15803D] rounded cursor-pointer"
                    />
                  </label>
                </div>
              </>
            ) : (
              /* Success / Result View */
              <div className="space-y-4">
                <div className="bg-[#DCFCE7] p-4 rounded-[18px] border border-[#86EFAC] text-center space-y-1">
                  <CheckCircle className="w-8 h-8 text-[#15803D] mx-auto mb-1 stroke-[2.2]" />
                  <h4 className="text-base font-extrabold text-[#14201A] font-display">
                    {t("meals.sync.successTitle", { count: syncResult.itemsAdded })}
                  </h4>
                  <p className="text-xs text-[#15803D] font-semibold">
                    {t("meals.sync.successEst", { cost: syncResult.estimatedTotalCost })}
                  </p>
                </div>

                {/* Covered by Stock Section */}
                {syncResult.itemsCovered?.length > 0 && (
                  <div className="bg-white p-4 rounded-[18px] border border-[#E2ECE4] space-y-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#15803D] font-display">
                      {t("meals.sync.coveredTitle", { count: syncResult.itemsCovered.length })}
                    </span>
                    <div className="divide-y divide-[#E2ECE4]/70">
                      {syncResult.itemsCovered.map((item: any, idx: number) => (
                        <div key={idx} className="py-1.5 flex justify-between text-xs text-[#5B6B61]">
                          <span>{item.name}</span>
                          <span className="font-semibold text-[#15803D]">{t("meals.sync.covered")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#E2ECE4] bg-white">
            {!syncResult ? (
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleSync}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 bg-[#15803D] text-white hover:bg-[#166534] transition-colors cursor-pointer font-display disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
                <span>{isSyncing ? t("meals.sync.btnChecking") : t("meals.sync.btn")}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 bg-[#14201A] text-white hover:bg-[#2A3F33] transition-colors cursor-pointer font-display"
              >
                <span>{t("meals.sync.done")}</span>
              </button>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
