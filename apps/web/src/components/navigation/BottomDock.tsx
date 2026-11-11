import { ShoppingBag, Package, Camera, PieChart, Home } from "lucide-react";

export type NavTab = "grocery" | "stock" | "finance" | "house";

interface BottomDockProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenScanner: () => void;
}

export function BottomDock({ activeTab, onTabChange, onOpenScanner }: BottomDockProps) {
  return (
    <nav
      aria-label="Primary Navigation"
      className="md:hidden shrink-0 z-40 bg-white border-t border-[#E2ECE4]"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center py-1.5 px-2 gap-1">
        <button
          type="button"
          onClick={() => onTabChange("grocery")}
          aria-label="Grocery Shopping Cart"
          className={`flex flex-col items-center justify-center min-h-[48px] py-1.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === "grocery"
              ? "text-[#15803D] bg-[#DCFCE7]"
              : "text-[#5B6B61] hover:text-[#14201A]"
          }`}
        >
          <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold tracking-tight mt-1">Grocery</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("stock")}
          aria-label="Home Stock Inventory"
          className={`flex flex-col items-center justify-center min-h-[48px] py-1.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === "stock"
              ? "text-[#15803D] bg-[#DCFCE7]"
              : "text-[#5B6B61] hover:text-[#14201A]"
          }`}
        >
          <Package className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold tracking-tight mt-1">Pantry</span>
        </button>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              navigator.vibrate?.(25);
              onOpenScanner();
            }}
            aria-label="Scan Barcode"
            className="w-full min-h-[44px] py-1.5 px-2 rounded-full bg-[#FF6B4A] hover:bg-[#FF5530] active:scale-[0.97] text-[#14201A] flex flex-col items-center justify-center transition-transform cursor-pointer"
          >
            <Camera className="w-4 h-4 stroke-[2.4]" />
            <span className="text-[10px] font-extrabold tracking-wide uppercase mt-0.5 leading-none font-display">
              Scan
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onTabChange("finance")}
          aria-label="Finance Ledger"
          className={`flex flex-col items-center justify-center min-h-[48px] py-1.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === "finance"
              ? "text-[#0369A1] bg-[#E0F2FE]"
              : "text-[#5B6B61] hover:text-[#14201A]"
          }`}
        >
          <PieChart className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold tracking-tight mt-1">Finance</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("house")}
          aria-label="House Management"
          className={`flex flex-col items-center justify-center min-h-[48px] py-1.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === "house"
              ? "text-[#7C3AED] bg-[#EDE9FE]/60"
              : "text-[#5B6B61] hover:text-[#14201A]"
          }`}
        >
          <Home className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold tracking-tight mt-1">House</span>
        </button>
      </div>
    </nav>
  );
}
