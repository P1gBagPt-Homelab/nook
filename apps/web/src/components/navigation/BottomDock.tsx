import { ShoppingBag, Package, Camera, PieChart, Home } from "lucide-react";
import { useTranslation } from "../../i18n/I18nContext";

export type NavTab = "grocery" | "stock" | "finance" | "house";

interface BottomDockProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenScanner: () => void;
}

export function BottomDock({ activeTab, onTabChange, onOpenScanner }: BottomDockProps) {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("nav.primaryLabel")}
      className="md:hidden shrink-0 z-40 bg-white border-t border-[#E2ECE4]"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center py-1.5 px-2 gap-1">
        <button
          type="button"
          onClick={() => onTabChange("grocery")}
          aria-label={t("nav.groceryAria")}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === "grocery"
              ? "text-[#15803D] bg-[#DCFCE7]"
              : "text-[#5B6B61] hover:text-[#14201A]"
          }`}
        >
          <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold tracking-tight mt-1">{t("nav.grocery")}</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("stock")}
          aria-label={t("nav.pantryAria")}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === "stock"
              ? "text-[#15803D] bg-[#DCFCE7]"
              : "text-[#5B6B61] hover:text-[#14201A]"
          }`}
        >
          <Package className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold tracking-tight mt-1">{t("nav.pantry")}</span>
        </button>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              navigator.vibrate?.(25);
              onOpenScanner();
            }}
            aria-label={t("nav.scanBarcode")}
            className="w-full min-h-[44px] py-1.5 px-2 rounded-full bg-[#FF6B4A] hover:bg-[#FF5530] active:scale-[0.97] text-[#14201A] flex flex-col items-center justify-center transition-transform cursor-pointer"
          >
            <Camera className="w-4 h-4 stroke-[2.4]" />
            <span className="text-[10px] font-extrabold tracking-wide uppercase mt-0.5 leading-none font-display">
              {t("nav.scan")}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onTabChange("finance")}
          aria-label={t("nav.financeAria")}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === "finance"
              ? "text-[#0369A1] bg-[#E0F2FE]"
              : "text-[#5B6B61] hover:text-[#14201A]"
          }`}
        >
          <PieChart className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold tracking-tight mt-1">{t("nav.finance")}</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("house")}
          aria-label={t("nav.houseAria")}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === "house"
              ? "text-[#7C3AED] bg-[#EDE9FE]/60"
              : "text-[#5B6B61] hover:text-[#14201A]"
          }`}
        >
          <Home className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold tracking-tight mt-1">{t("nav.house")}</span>
        </button>
      </div>
    </nav>
  );
}
