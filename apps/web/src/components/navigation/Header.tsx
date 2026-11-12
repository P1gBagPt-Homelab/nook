import { useState } from "react";
import { LogOut, ShieldCheck, ChevronDown, UserPlus } from "lucide-react";
import { NavTab } from "./BottomDock";
import { InviteMemberDrawer } from "../auth/InviteMemberDrawer";
import { LanguageSwitcher } from "../common/LanguageSwitcher";
import { NookMark } from "../common/NookMark";
import { useTranslation } from "../../i18n/I18nContext";
import type { TranslationKey } from "../../i18n/locales/en";

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

const ROUTE_PILLS: Record<NavTab, { dot: string; badge: string; labelKey: TranslationKey }> = {
  grocery: {
    dot: "bg-[#16A34A]",
    badge: "bg-[#DCFCE7] text-[#15803D]",
    labelKey: "nav.grocery",
  },
  stock: {
    dot: "bg-[#16A34A]",
    badge: "bg-[#DCFCE7] text-[#15803D]",
    labelKey: "nav.pantry",
  },
  finance: {
    dot: "bg-[#0284C7]",
    badge: "bg-[#E0F2FE] text-[#0369A1]",
    labelKey: "nav.finance",
  },
  house: {
    dot: "bg-[#7C3AED]",
    badge: "bg-[#EDE9FE] text-[#6D28D9]",
    labelKey: "nav.house",
  },
};

export function Header({ user, activeTab = "grocery", onLogout }: HeaderProps) {
  const { t } = useTranslation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const route = ROUTE_PILLS[activeTab];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E2ECE4]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <NookMark className="w-7 h-7" />
          <span className="text-lg font-extrabold tracking-[-0.02em] text-[#14201A] leading-none font-display">
            {t("common.nook")}
          </span>
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${route.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${route.dot} shrink-0`} aria-hidden="true" />
            {t(route.labelKey)}
          </span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 min-h-[38px] py-1.5 px-3 rounded-full bg-[#F4F9F5] hover:bg-[#EEF7F0] border border-[#E2ECE4] text-[#14201A] text-xs font-bold transition-colors cursor-pointer"
            aria-label={t("header.userProfile")}
            aria-expanded={showProfileMenu}
          >
            <span className="max-w-[120px] truncate">{user?.name || t("header.account")}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#5B6B61]" />
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-60 rounded-[18px] bg-white text-[#14201A] border border-[#E2ECE4] shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E2ECE4]">
                  <div className="text-xs font-extrabold text-[#14201A]">
                    {user?.name || t("header.account")}
                  </div>
                  {user?.email && (
                    <div className="text-xs text-[#5B6B61] truncate mt-0.5">
                      {user.email}
                    </div>
                  )}
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#15803D] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    <span>
                      {user?.role === "admin" ? t("header.householdAdmin") : t("common.member")}
                    </span>
                  </div>
                </div>

                <LanguageSwitcher />

                {user?.role === "admin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setIsInviteOpen(true);
                    }}
                    className="w-full min-h-[44px] flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#15803D] hover:bg-[#DCFCE7]/50 border-b border-[#E2ECE4] transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t("header.inviteMember")}</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full min-h-[44px] flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#DC2626] hover:bg-[#FEE2E2]/50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t("header.signOut")}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <InviteMemberDrawer
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </header>
  );
}
