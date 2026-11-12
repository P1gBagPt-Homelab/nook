import { useState, useEffect } from "react";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { useTranslation } from "../i18n/I18nContext";
import { translateApiError } from "../i18n/helpers";
import { LanguageSwitcher } from "../components/common/LanguageSwitcher";
import { NookMark } from "../components/common/NookMark";

interface JoinPageProps {
  onJoinSuccess: () => void;
  onNavigateLogin: () => void;
}

export function JoinPage({ onJoinSuccess, onNavigateLogin }: JoinPageProps) {
  const { t } = useTranslation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError(t("auth.join.missingToken"));
      return;
    }

    if (password.length < 8) {
      setError(t("auth.join.passwordMinLength"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.join.passwordMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(translateApiError(t, data.detail, "auth.join.activateFailed"));
      }

      navigator.vibrate?.(45);
      onJoinSuccess();
    } catch (err: any) {
      setError(err.message || t("auth.setup.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F9F5] text-[#14201A] flex flex-col">
      <header className="bg-white border-b border-[#E2ECE4]">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <NookMark className="w-7 h-7" />
            <span className="text-lg font-extrabold tracking-[-0.02em] font-display">
              {t("common.nook")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
              {t("auth.join.badge")}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center px-4 py-10 max-w-md w-full mx-auto">
        <div className="botanical-card p-6 space-y-5">
          <div className="border-b border-[#E2ECE4] pb-4 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold tracking-[-0.025em] text-[#14201A] font-display">
                {t("auth.join.title")}
              </h1>
              <p className="text-xs text-[#5B6B61] font-medium mt-1">
                {t("auth.join.subtitle")}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 bg-[#FEE2E2] text-[#991B1B] rounded-2xl text-xs font-bold border border-[#FCA5A5]"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#475B4E] mb-1.5">
                {t("auth.join.tokenLabel")}
              </label>
              <input
                type="text"
                placeholder="act_..."
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#15803D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475B4E] mb-1.5">
                {t("auth.join.passwordLabel")}
              </label>
              <input
                type="password"
                placeholder={t("auth.join.passwordPlaceholder")}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-sm font-semibold text-[#14201A] focus:border-[#15803D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475B4E] mb-1.5">
                {t("auth.join.confirmLabel")}
              </label>
              <input
                type="password"
                placeholder={t("auth.join.confirmPlaceholder")}
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-sm font-semibold text-[#14201A] focus:border-[#15803D]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] mt-2 py-3 px-4 rounded-full bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold text-sm font-display flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? t("auth.join.submitting") : t("auth.join.submit")}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] font-semibold pt-2 border-t border-[#E2ECE4]">
            <div className="flex items-center gap-1.5 text-[#5B6B61]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>{t("auth.join.footerBadge")}</span>
            </div>
            <button
              type="button"
              onClick={onNavigateLogin}
              className="text-[#15803D] font-bold hover:underline cursor-pointer"
            >
              {t("auth.join.backToLogin")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinPage;
