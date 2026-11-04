export const SUPPORTED_LANGUAGES = ['en', 'es', 'pt', 'fr'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export type LanguagePreference = 'system' | SupportedLanguage;

export const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

/** Locale used for date formatting when the device has no regional variant of the app language. */
export const DEFAULT_FORMATTING_LOCALE: Record<SupportedLanguage, string> = {
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
  fr: 'fr-FR',
};

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export interface DeviceLocaleLike {
  languageCode: string | null;
  languageTag: string;
}

/** First supported language in the device's preference list, or English. */
export function detectLanguage(deviceLocales: readonly DeviceLocaleLike[]): SupportedLanguage {
  for (const locale of deviceLocales) {
    const code = (locale.languageCode ?? locale.languageTag.split(/[-_]/)[0] ?? '').toLowerCase();
    if (isSupportedLanguage(code)) return code;
  }
  return FALLBACK_LANGUAGE;
}

export function resolveLanguage(
  preference: LanguagePreference,
  deviceLocales: readonly DeviceLocaleLike[],
): SupportedLanguage {
  return preference === 'system' ? detectLanguage(deviceLocales) : preference;
}

/**
 * BCP-47 tag used for `Intl` formatting: the device's own regional variant when it
 * matches the app language (e.g. `es-DO` for Spanish in the Dominican Republic),
 * otherwise a sensible default for that language.
 */
export function resolveFormattingLocale(
  language: SupportedLanguage,
  deviceLocales: readonly DeviceLocaleLike[],
): string {
  const match = deviceLocales.find(
    (locale) => (locale.languageCode ?? '').toLowerCase() === language && locale.languageTag.includes('-'),
  );
  return match?.languageTag ?? DEFAULT_FORMATTING_LOCALE[language];
}
