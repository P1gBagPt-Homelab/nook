import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useTranslation } from "../i18n/I18nContext";
import { LanguageSwitcher } from "../components/common/LanguageSwitcher";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t("auth.login.invalidCredentials"));
      }

      navigator.vibrate?.(35);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || t("auth.login.genericError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F9F5] text-[#14201A] flex flex-col">
      <header className="bg-white border-b border-[#E2ECE4]">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
            <span className="text-lg font-extrabold tracking-[-0.02em] font-display">
              {t("common.nook")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
              {t("auth.login.badge")}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center px-4 py-10 max-w-md w-full mx-auto">
        <div className="botanical-card p-6 space-y-5">
          <div className="border-b border-[#E2ECE4] pb-4">
            <h1 className="text-xl font-extrabold tracking-[-0.025em] text-[#14201A] font-display">
              {t("auth.login.title")}
            </h1>
            <p className="text-xs text-[#5B6B61] font-medium mt-1">
              {t("auth.login.subtitle")}
            </p>
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
                {t("auth.login.emailLabel")}
              </label>
              <input
                type="email"
                placeholder={t("auth.login.emailPlaceholder")}
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-sm font-semibold text-[#14201A] focus:border-[#15803D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475B4E] mb-1.5">
                {t("auth.login.passwordLabel")}
              </label>
              <input
                type="password"
                placeholder={t("auth.login.passwordPlaceholder")}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-sm font-semibold text-[#14201A] focus:border-[#15803D]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] mt-2 py-3 px-4 rounded-full bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold text-sm font-display flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? t("auth.login.submitting") : t("auth.login.submit")}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#5B6B61] font-semibold pt-2 border-t border-[#E2ECE4]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>{t("common.selfHostedInstance")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
