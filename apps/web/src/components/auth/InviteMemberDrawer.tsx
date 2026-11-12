import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import { Check, Copy, Loader2, ShieldCheck, UserPlus, Users } from "lucide-react";
import type { HouseholdMember } from "@nook/shared";
import { useTranslation } from "../../i18n/I18nContext";
import { translateApiError } from "../../i18n/helpers";
import type { TranslationKey } from "../../i18n/locales/en";

interface InviteMemberDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLES: { id: "member" | "admin" | "viewer"; labelKey: TranslationKey }[] = [
  { id: "member", labelKey: "invite.role.member" },
  { id: "admin", labelKey: "invite.role.admin" },
  { id: "viewer", labelKey: "invite.role.viewer" },
];

export function InviteMemberDrawer({ isOpen, onClose }: InviteMemberDrawerProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin" | "viewer">("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  async function fetchMembers() {
    try {
      const res = await fetch("/api/auth/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCopied(false);
      fetchMembers();
    }
  }, [isOpen]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(translateApiError(t, data.detail, "invite.failedGenerate"));
      }

      const originUrl = data.inviteToken
        ? `${window.location.origin}/join?token=${data.inviteToken}`
        : data.inviteUrl;

      setGeneratedLink(originUrl);
      setCopied(false);
      setName("");
      setEmail("");
      navigator.vibrate?.(30);
      await fetchMembers();
    } catch (err: any) {
      setError(err.message || t("invite.couldNotCreate"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      navigator.vibrate?.(20);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-[#14201A]/50 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[24px] z-50 border-t border-[#E2ECE4] max-h-[92vh] flex flex-col focus:outline-none">
          <div className="w-10 h-1.5 bg-[#E2ECE4] rounded-full mx-auto mt-3 mb-2 shrink-0" />
          <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">

          <div className="px-5 py-3 border-b border-[#E2ECE4] flex items-center justify-between">
            <div>
              <Drawer.Title className="text-base font-bold text-[#14201A] font-display">
                {t("invite.title")}
              </Drawer.Title>
              <p className="text-xs text-[#5B6B61] font-medium mt-0.5">
                {t("invite.subtitle")}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>

          <div className="p-5 space-y-5">
            {error && (
              <div
                role="alert"
                className="p-3 bg-[#FEE2E2] text-[#991B1B] rounded-2xl text-xs font-bold border border-[#FCA5A5]"
              >
                {error}
              </div>
            )}

            {generatedLink && (
              <div className="p-4 rounded-2xl bg-[#EEF7F0] border border-[#CDE5D3] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#15803D] font-display">
                    {t("invite.linkReady")}
                  </span>
                  <span className="text-[11px] font-bold text-[#475B4E]">
                    {t("invite.expiresIn7Days")}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#CDE5D3] text-[11px] font-semibold text-[#14201A] break-all select-all">
                  {generatedLink}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full min-h-[44px] py-2 px-4 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold font-display flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t("invite.copied")}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{t("invite.copyLink")}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5B6B61] mb-1">
                  {t("invite.nameLabel")}
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  placeholder={t("invite.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] focus:border-[#15803D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5B6B61] mb-1">
                  {t("invite.emailLabel")}
                </label>
                <input
                  type="email"
                  required
                  placeholder={t("invite.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] focus:border-[#15803D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5B6B61] mb-1.5">
                  {t("invite.roleLabel")}
                </label>
                <div className="flex gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`flex-1 min-h-[40px] py-1.5 px-3 rounded-full text-xs font-bold border transition-colors cursor-pointer font-display ${
                        role === r.id
                          ? "bg-[#15803D] text-white border-[#15803D]"
                          : "bg-[#F4F9F5] text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
                      }`}
                    >
                      {t(r.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !email.trim()}
                className="w-full min-h-[48px] py-3 px-4 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-sm font-bold font-display flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{t("invite.generateLink")}</span>
                  </>
                )}
              </button>
            </form>

            {members.length > 0 && (
              <div className="pt-3 border-t border-[#E2ECE4] space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#5B6B61] font-display">
                  <Users className="w-3.5 h-3.5" />
                  <span>{t("invite.currentHousehold", { count: members.length })}</span>
                </div>
                <div className="space-y-2">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-[#14201A] truncate">
                          {m.name}
                        </div>
                        <div className="text-[11px] font-medium text-[#5B6B61] truncate">
                          {m.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {m.mustSetPassword && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
                            {t("common.pending")}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                          {m.role === "admin" && <ShieldCheck className="w-3 h-3" />}
                          {t(`invite.role.${m.role}` as TranslationKey)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export default InviteMemberDrawer;
