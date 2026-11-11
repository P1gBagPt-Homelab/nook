import { ShoppingBag, Package } from "lucide-react";
import { ShoppingCartView } from "../components/groceries/ShoppingCartView";
import { StockInventoryView } from "../components/groceries/StockInventoryView";

export interface GroceryPageProps {
  activeSubTab?: "cart" | "stock";
  onSubTabChange?: (tab: "cart" | "stock") => void;
}

export function GroceryPage({
  activeSubTab = "cart",
  onSubTabChange,
}: GroceryPageProps) {
  const currentTab = activeSubTab;

  function setTab(tab: "cart" | "stock") {
    navigator.vibrate?.(15);
    onSubTabChange?.(tab);
  }

  return (
    <div className="max-w-md mx-auto md:max-w-none px-4 md:px-0 pt-4 md:pt-0 space-y-4">
      {/* Full-Pill Botanical Segmented Switch */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("cart")}
          className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 border transition-colors cursor-pointer font-display ${
            currentTab === "cart"
              ? "bg-[#15803D] text-white border-[#15803D]"
              : "bg-white text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
          }`}
        >
          <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
          <span>Shopping Cart</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("stock")}
          className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 border transition-colors cursor-pointer font-display ${
            currentTab === "stock"
              ? "bg-[#15803D] text-white border-[#15803D]"
              : "bg-white text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
          }`}
        >
          <Package className="w-4 h-4 stroke-[2.2]" />
          <span>My Stock</span>
        </button>
      </div>

      {currentTab === "cart" ? <ShoppingCartView /> : <StockInventoryView />}
    </div>
  );
}

export default GroceryPage;
