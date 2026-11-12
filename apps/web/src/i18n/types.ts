export type Language = "en" | "pt-PT";

export interface LanguageOption {
  code: Language;
  label: string;
  shortLabel: string;
  intlLocale: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: "en",
    label: "English",
    shortLabel: "EN",
    intlLocale: "en-US",
  },
  {
    code: "pt-PT",
    label: "Português (Portugal)",
    shortLabel: "PT-PT",
    intlLocale: "pt-PT",
  },
];

export type TranslationParams = Record<string, string | number>;
