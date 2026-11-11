import { useState } from "react";
import { LogOut, ShieldCheck, ChevronDown } from "lucide-react";
import { NavTab } from "./BottomDock";

interface HeaderProps {
  user: {
    name?: string;
    email?: string;
    role?: string;
    householdId?: string;
  } | null;
  activeTab?: NavTab;
  onLogout?: () => void;
}

const ROUTE_ACCENTS: Record<NavTab, { bar: string; dot: string; label: string }> = {
  grocery: { bar: "border-[#D9381E]", dot: "bg-[#D9381E]", label: "Grocery" },
  stock: { bar: "border-[#047857]", dot: "bg-[#047857]", label: "Pantry" },
  finance: { bar: "border-[#1D4ED8]", dot: "bg-[#1D4ED8]", label: "Finance" },
  house: { bar: "border-[#6D28D9]", dot: "bg-[#6D28D9]", label: "House" },
};

export function Header({ user, activeTab = "grocery", onLogout }: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const route = ROUTE_ACCENTS[activeTab];

  return (
    <header className={`sticky top-0 z-30 bg-[#14191D] text-[#F7F5EE] border-b-[3px] ${route.bar}`}>
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-[2px] ${route.dot} shrink-0`} aria-hidden="true" />
          <h1 className="text-base font-extrabold tracking-[-0.02em] text-[#F7F5EE] leading-none font-display">
            Nook
          </h1>
          <span className="text-xs font-bold text-[#A1AAB3] pl-2.5 border-l border-[#2A3137]">
            {route.label}
          </span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 min-h-[36px] py-1 px-2.5 rounded-[4px] border border-[#F7F5EE]/25 hover:border-[#F7F5EE]/50 text-[#F7F5EE] text-xs font-bold transition-colors cursor-pointer"
            aria-label="User Profile"
            aria-expanded={showProfileMenu}
          >
            <span className="max-w-[120px] truncate">{user?.name || "Daniel"}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#A1AAB3]" />
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-60 rounded-[4px] bg-[#FAF9F4] text-[#14191D] border border-[#14191D] z-50">
                <div className="px-3.5 py-3 border-b border-[#D6D1C4]">
                  <div className="text-xs font-extrabold text-[#14191D]">
                    {user?.name || "Daniel"}
                  </div>
                  <div className="text-xs text-[#5B6268] truncate mt-0.5">
                    {user?.email || "daniel@test.com"}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-[2px]">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{user?.role === "admin" ? "Household Admin" : "Member"}</span>
                  </div>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-[#B91C1C] hover:bg-[#FEE2E2]/50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
