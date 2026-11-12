import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { en, type TranslationKey, type Translations } from "./locales/en";
import { ptPT } from "./locales/pt-PT";
import {
  SUPPORTED_LANGUAGES,
  type Language,
  type TranslationParams,
} from "./types";

const STORAGE_KEY = "nook-language";

const LOCALE_MAP: Record<Language, Translations> = {
  en,
  "pt-PT": ptPT,
};

function detectInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "pt-PT") {
      return saved;
    }
    const browserLang = navigator.language?.toLowerCase() || "";
    if (browserLang.startsWith("pt")) {
      return "pt-PT";
    }
  } catch {
    // Ignore storage/navigator errors in restricted environments
  }
  return "en";
}

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  intlLocale: string;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const intlLocale = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === language)?.intlLocale || "en-US"
    );
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams): string => {
      const dict = LOCALE_MAP[language] || en;
      let text = dict[key] ?? en[key] ?? key;
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          text = text.replace(
            new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"),
            String(paramValue)
          );
        }
      }
      return text;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, intlLocale, t }),
    [language, setLanguage, intlLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return ctx;
}
