import { ShoppingBag, Package, UtensilsCrossed } from "lucide-react";
import { ShoppingCartView } from "../components/groceries/ShoppingCartView";
import { StockInventoryView } from "../components/groceries/StockInventoryView";
import { MealPlanView } from "../components/meals/MealPlanView";
import { useTranslation } from "../i18n/I18nContext";

export interface GroceryPageProps {
  activeSubTab?: "meals" | "cart" | "stock";
  onSubTabChange?: (tab: "meals" | "cart" | "stock") => void;
}

export function GroceryPage({
  activeSubTab = "meals",
  onSubTabChange,
}: GroceryPageProps) {
  const { t } = useTranslation();
  const currentTab = activeSubTab;

  function setTab(tab: "meals" | "cart" | "stock") {
    navigator.vibrate?.(15);
    onSubTabChange?.(tab);
  }

  return (
    <div className="max-w-md mx-auto md:max-w-none px-4 md:px-0 pt-4 md:pt-0 space-y-4">
      {/* Full-Pill Botanical Segmented Switch: 3 Pillars */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("meals")}
          className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer font-display ${
            currentTab === "meals"
              ? "bg-[#15803D] text-white border-[#15803D]"
              : "bg-white text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
          }`}
        >
          <UtensilsCrossed className="w-4 h-4 stroke-[2.2]" />
          <span>{t("grocery.tab.meals")}</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("cart")}
          className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer font-display ${
            currentTab === "cart"
              ? "bg-[#15803D] text-white border-[#15803D]"
              : "bg-white text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
          }`}
        >
          <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
          <span>{t("grocery.tab.cart")}</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("stock")}
          className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer font-display ${
            currentTab === "stock"
              ? "bg-[#15803D] text-white border-[#15803D]"
              : "bg-white text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
          }`}
        >
          <Package className="w-4 h-4 stroke-[2.2]" />
          <span>{t("grocery.tab.stock")}</span>
        </button>
      </div>

      {currentTab === "meals" ? (
        <MealPlanView />
      ) : currentTab === "cart" ? (
        <ShoppingCartView />
      ) : (
        <StockInventoryView />
      )}
    </div>
  );
}

export default GroceryPage;
