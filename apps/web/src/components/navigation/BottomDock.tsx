import { ShoppingBag, Package, Camera, PieChart, Home } from "lucide-react";

export type NavTab = "grocery" | "stock" | "finance" | "house";

interface BottomDockProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenScanner: () => void;
}

export function BottomDock({ activeTab, onTabChange, onOpenScanner }: BottomDockProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-5 pointer-events-none">
      <div className="max-w-md mx-auto relative pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-zinc-200/70 px-4 py-2 flex items-center justify-between">
          {/* Grocery Tab */}
          <button
            onClick={() => onTabChange("grocery")}
            aria-label="Grocery Shopping Cart"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition duration-200 ${
              activeTab === "grocery"
                ? "text-[#FF7A59]"
                : "text-zinc-400 hover:text-zinc-600 active:scale-95"
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === "grocery" ? "bg-[#FF7A59]/10" : ""}`}>
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Grocery</span>
          </button>

          {/* Pantry / Stock Tab */}
          <button
            onClick={() => onTabChange("stock")}
            aria-label="Home Stock Inventory"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition duration-200 ${
              activeTab === "stock"
                ? "text-[#10B981]"
                : "text-zinc-400 hover:text-zinc-600 active:scale-95"
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === "stock" ? "bg-[#10B981]/10" : ""}`}>
              <Package className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Pantry</span>
          </button>

          {/* Center Elevated Floating Camera SCAN Button */}
          <div className="relative -top-4 px-1">
            <button
              onClick={() => {
                navigator.vibrate?.(25);
                onOpenScanner();
              }}
              aria-label="Scan Barcode"
              className="w-14 h-14 rounded-full bg-[#FF7A59] hover:bg-[#ff6842] active:scale-90 text-white flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(255,122,89,0.5)] transition duration-200 border-3 border-white ring-4 ring-[#FF7A59]/20 cursor-pointer"
            >
              <Camera className="w-6 h-6 stroke-[2.4]" />
              <span className="text-[8px] font-black uppercase tracking-wider mt-0.5 leading-none">Scan</span>
            </button>
          </div>

          {/* Finance Tab */}
          <button
            onClick={() => onTabChange("finance")}
            aria-label="Finance Ledger"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition duration-200 ${
              activeTab === "finance"
                ? "text-[#0EA5E9]"
                : "text-zinc-400 hover:text-zinc-600 active:scale-95"
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === "finance" ? "bg-[#0EA5E9]/10" : ""}`}>
              <PieChart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Finance</span>
          </button>

          {/* House Tab */}
          <button
            onClick={() => onTabChange("house")}
            aria-label="House Management"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition duration-200 ${
              activeTab === "house"
                ? "text-[#8B5CF6]"
                : "text-zinc-400 hover:text-zinc-600 active:scale-95"
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === "house" ? "bg-[#8B5CF6]/10" : ""}`}>
              <Home className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">House</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
