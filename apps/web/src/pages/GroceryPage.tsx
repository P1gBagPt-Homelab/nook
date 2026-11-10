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
    <div className="max-w-md mx-auto px-4 pt-4 pb-32">
      {/* Top Segmented Control (Blueprint Section 2) */}
      <div className="flex bg-zinc-200/60 p-1 rounded-full shadow-inner mb-5 border border-zinc-200/40">
        <button
          type="button"
          onClick={() => setTab("cart")}
          className={`flex-1 py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition duration-200 cursor-pointer ${
            currentTab === "cart"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <ShoppingBag className={`w-4 h-4 stroke-[2.2] ${currentTab === "cart" ? "text-[#FF7A59]" : "text-zinc-400"}`} />
          <span>Shopping Cart</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("stock")}
          className={`flex-1 py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition duration-200 cursor-pointer ${
            currentTab === "stock"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Package className={`w-4 h-4 stroke-[2.2] ${currentTab === "stock" ? "text-[#10B981]" : "text-zinc-400"}`} />
          <span>My Stock</span>
        </button>
      </div>

      {currentTab === "cart" ? <ShoppingCartView /> : <StockInventoryView />}
    </div>
  );
}

export default GroceryPage;
