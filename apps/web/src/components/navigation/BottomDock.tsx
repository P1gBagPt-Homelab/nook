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
      className="md:hidden sticky bottom-0 z-40 bg-[#14191D] border-t border-[#2A3137]"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-stretch">
        <button
          type="button"
          onClick={() => onTabChange("grocery")}
          aria-label="Grocery Shopping Cart"
          className={`flex flex-col items-center justify-center min-h-[54px] py-2 px-1 border-t-[3px] cursor-pointer ${
            activeTab === "grocery"
              ? "border-[#D9381E] text-white bg-[#1D2329]"
              : "border-transparent text-[#A1AAB3] hover:text-white"
          }`}
        >
          <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold tracking-tight mt-1">Grocery</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("stock")}
          aria-label="Home Stock Inventory"
          className={`flex flex-col items-center justify-center min-h-[54px] py-2 px-1 border-t-[3px] cursor-pointer ${
            activeTab === "stock"
              ? "border-[#047857] text-white bg-[#1D2329]"
              : "border-transparent text-[#A1AAB3] hover:text-white"
          }`}
        >
          <Package className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold tracking-tight mt-1">Pantry</span>
        </button>

        <div className="flex items-center justify-center p-1.5">
          <button
            type="button"
            onClick={() => {
              navigator.vibrate?.(25);
              onOpenScanner();
            }}
            aria-label="Scan Barcode"
            className="w-full h-full min-h-[44px] rounded-[4px] bg-[#D9381E] hover:bg-[#B92B14] active:scale-[0.97] text-white flex flex-col items-center justify-center transition-transform cursor-pointer"
          >
            <Camera className="w-4 h-4 stroke-[2.4]" />
            <span className="text-[10px] font-extrabold tracking-wide uppercase mt-0.5 leading-none">
              Scan
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onTabChange("finance")}
          aria-label="Finance Ledger"
          className={`flex flex-col items-center justify-center min-h-[54px] py-2 px-1 border-t-[3px] cursor-pointer ${
            activeTab === "finance"
              ? "border-[#1D4ED8] text-white bg-[#1D2329]"
              : "border-transparent text-[#A1AAB3] hover:text-white"
          }`}
        >
          <PieChart className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold tracking-tight mt-1">Finance</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("house")}
          aria-label="House Management"
          className={`flex flex-col items-center justify-center min-h-[54px] py-2 px-1 border-t-[3px] cursor-pointer ${
            activeTab === "house"
              ? "border-[#6D28D9] text-white bg-[#1D2329]"
              : "border-transparent text-[#A1AAB3] hover:text-white"
          }`}
        >
          <Home className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold tracking-tight mt-1">House</span>
        </button>
      </div>
    </nav>
  );
}
