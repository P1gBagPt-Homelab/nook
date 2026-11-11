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
    <div className="w-full">
      {/* 2-Column Market Hall Route Switch */}
      <div className="grid grid-cols-2 border-b border-[#D6D1C4] bg-[#EFECE2]">
        <button
          type="button"
          onClick={() => setTab("cart")}
          className={`min-h-[44px] py-2.5 px-3 text-xs font-extrabold flex items-center justify-center gap-2 border-r border-[#D6D1C4] border-b-[3px] transition-colors cursor-pointer ${
            currentTab === "cart"
              ? "bg-[#F7F5EE] text-[#14191D] border-b-[#D9381E]"
              : "text-[#5B6268] hover:text-[#14191D] border-b-transparent"
          }`}
        >
          <ShoppingBag
            className={`w-4 h-4 stroke-[2.2] ${
              currentTab === "cart" ? "text-[#D9381E]" : "text-[#5B6268]"
            }`}
          />
          <span>Shopping Cart</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("stock")}
          className={`min-h-[44px] py-2.5 px-3 text-xs font-extrabold flex items-center justify-center gap-2 border-b-[3px] transition-colors cursor-pointer ${
            currentTab === "stock"
              ? "bg-[#F7F5EE] text-[#14191D] border-b-[#047857]"
              : "text-[#5B6268] hover:text-[#14191D] border-b-transparent"
          }`}
        >
          <Package
            className={`w-4 h-4 stroke-[2.2] ${
              currentTab === "stock" ? "text-[#047857]" : "text-[#5B6268]"
            }`}
          />
          <span>My Stock</span>
        </button>
      </div>

      {currentTab === "cart" ? <ShoppingCartView /> : <StockInventoryView />}
    </div>
  );
}

export default GroceryPage;
