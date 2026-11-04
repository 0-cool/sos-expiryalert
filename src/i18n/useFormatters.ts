import { useCalendars, useLocales } from 'expo-localization';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { createFormatters, type Formatters } from './format';
import { FALLBACK_LANGUAGE, isSupportedLanguage, resolveFormattingLocale } from './languages';

/** Locale-aware formatters for the current app language and the device's regional settings. */
export function useFormatters(): Formatters {
  const { i18n } = useTranslation();
  const locales = useLocales();
  const calendars = useCalendars();

  const language = isSupportedLanguage(i18n.language) ? i18n.language : FALLBACK_LANGUAGE;
  const formattingLocale = resolveFormattingLocale(language, locales);
  const uses24HourClock = calendars[0]?.uses24hourClock ?? undefined;

  return useMemo(
    () => createFormatters(formattingLocale, uses24HourClock ?? undefined),
    [formattingLocale, uses24HourClock],
  );
}
