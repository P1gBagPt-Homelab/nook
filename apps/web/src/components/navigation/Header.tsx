import { useState } from "react";
import { Sparkles, LogOut, ShieldCheck } from "lucide-react";

interface HeaderProps {
  user: {
    name?: string;
    email?: string;
    role?: string;
    householdId?: string;
  } | null;
  onLogout?: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200/60 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Nook Logo & Subtitle */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs ring-2 ring-[#FF7A59]/20 relative">
            <Sparkles className="w-4 h-4 text-amber-300 stroke-[2.2]" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF7A59]" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-zinc-900 flex items-center gap-1.5 leading-none">
              <span>Nook</span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-semibold tracking-tight mt-0.5">
              Household & Life OS
            </p>
          </div>
        </div>

        {/* Profile / Household Pill (Blueprint: [Profile]) */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 py-1.5 px-2.5 rounded-full bg-[#FAFAF8] hover:bg-zinc-100 border border-zinc-200/80 transition active:scale-95 cursor-pointer"
            aria-label="User Profile"
          >
            <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-black">
              {user?.name?.[0]?.toUpperCase() || "D"}
            </div>
            <span className="text-xs font-bold text-zinc-800 max-w-[90px] truncate">
              {user?.name || "Daniel"}
            </span>
          </button>

          {/* Profile Dropdown Popover */}
          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-zinc-100 p-3 z-50 space-y-2 animate-scale-in">
                <div className="px-2 py-1.5 border-b border-zinc-100">
                  <div className="text-xs font-bold text-zinc-900">{user?.name || "Daniel"}</div>
                  <div className="text-[10px] text-zinc-400 truncate">{user?.email || "daniel@test.com"}</div>
                  <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{user?.role === "admin" ? "Household Admin" : "Member"}</span>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
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
