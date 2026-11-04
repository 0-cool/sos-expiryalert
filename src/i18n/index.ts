// Hermes does not ship Intl.PluralRules on every platform; i18next needs it for plurals.
import 'intl-pluralrules';

import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { FALLBACK_LANGUAGE, detectLanguage, type SupportedLanguage } from './languages';
import en from './locales/en';
import es from './locales/es';
import fr from './locales/fr';
import pt from './locales/pt';

export const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
  fr: { translation: fr },
} as const;

function safeDeviceLocales() {
  try {
    return getLocales();
  } catch {
    return [];
  }
}

/** Language used before preferences are loaded: the device language, or English. */
export const initialLanguage: SupportedLanguage = detectLanguage(safeDeviceLocales());

const i18n = createInstance();

// Resources are bundled, so initialisation is synchronous.
void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: ['en', 'es', 'pt', 'fr'],
  nonExplicitSupportedLngs: false,
  interpolation: {
    // React Native renders plain text, there is no HTML to escape.
    escapeValue: false,
  },
  returnNull: false,
  initAsync: false,
  react: {
    useSuspense: false,
  },
});

export default i18n;
