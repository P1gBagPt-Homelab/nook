import { Globe } from "lucide-react";
import { useTranslation } from "../../i18n/I18nContext";
import { SUPPORTED_LANGUAGES } from "../../i18n/types";

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useTranslation();

  if (compact) {
    return (
      <div
        role="group"
        aria-label={t("common.language")}
        className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-[#F4F9F5] border border-[#E2ECE4]"
      >
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              aria-pressed={active}
              title={lang.label}
              className={`min-h-[30px] px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-colors cursor-pointer font-display ${
                active
                  ? "bg-[#15803D] text-white"
                  : "text-[#5B6B61] hover:text-[#14201A]"
              }`}
            >
              {lang.shortLabel}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5 border-b border-[#E2ECE4] space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5B6B61]">
        <Globe className="w-3.5 h-3.5 text-[#15803D]" />
        <span>{t("common.language")}</span>
      </div>
      <div
        role="group"
        aria-label={t("common.language")}
        className="grid grid-cols-2 gap-1.5"
      >
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              aria-pressed={active}
              className={`min-h-[36px] px-2.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer font-display ${
                active
                  ? "bg-[#15803D] text-white border-[#15803D]"
                  : "bg-[#F4F9F5] text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
              }`}
            >
              {lang.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
