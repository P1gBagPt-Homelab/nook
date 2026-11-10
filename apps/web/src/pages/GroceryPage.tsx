import { useState } from "react";
import { ShoppingCartView } from "../components/groceries/ShoppingCartView";
import { StockInventoryView } from "../components/groceries/StockInventoryView";
import { ShoppingBag, Package } from "lucide-react";

export function GroceryPage() {
  const [activeTab, setActiveTab] = useState<"cart" | "stock">("cart");

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28">
      {/* Top Segmented Control */}
      <div className="flex bg-zinc-100 p-1 rounded-full shadow-inner mb-6">
        <button
          onClick={() => setActiveTab("cart")}
          className={`flex-1 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition ${
            activeTab === "cart" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-[#FF7A59]" />
          <span>Shopping Cart</span>
        </button>

        <button
          onClick={() => setActiveTab("stock")}
          className={`flex-1 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition ${
            activeTab === "stock" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Package className="w-4 h-4 text-[#10B981]" />
          <span>My Stock</span>
        </button>
      </div>

      {activeTab === "cart" ? <ShoppingCartView /> : <StockInventoryView />}
    </div>
  );
}

export default GroceryPage;
