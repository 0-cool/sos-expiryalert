import i18n from '@/i18n';
import { createFormatters } from '@/i18n/format';
import { detectLanguage, resolveFormattingLocale, resolveLanguage } from '@/i18n/languages';

const locale = (languageTag: string) => ({ languageTag, languageCode: languageTag.split('-')[0] ?? null });

describe('language detection', () => {
  it('uses the first supported device language', () => {
    expect(detectLanguage([locale('de-DE'), locale('es-DO'), locale('en-US')])).toBe('es');
    expect(detectLanguage([locale('pt-BR')])).toBe('pt');
    expect(detectLanguage([locale('fr-CA')])).toBe('fr');
  });

  it('defaults to English when no device language is supported', () => {
    expect(detectLanguage([locale('de-DE'), locale('ja-JP')])).toBe('en');
    expect(detectLanguage([])).toBe('en');
  });

  it('respects a manual choice over the device language', () => {
    expect(resolveLanguage('fr', [locale('es-DO')])).toBe('fr');
    expect(resolveLanguage('system', [locale('es-DO')])).toBe('es');
  });

  it('keeps the regional format of the device when it matches the app language', () => {
    expect(resolveFormattingLocale('es', [locale('es-DO')])).toBe('es-DO');
    expect(resolveFormattingLocale('fr', [locale('es-DO')])).toBe('fr-FR');
    expect(resolveFormattingLocale('pt', [])).toBe('pt-BR');
  });
});

describe('language switching', () => {
  afterAll(async () => {
    await i18n.changeLanguage('en');
  });

  it('translates at runtime', async () => {
    await i18n.changeLanguage('pt');
    expect(i18n.t('tabs.documents')).toBe('Documentos');
    await i18n.changeLanguage('fr');
    expect(i18n.t('time.daysLeft', { count: 2 })).toBe('2 jours restants');
    expect(i18n.t('time.daysLeft', { count: 1 })).toBe('1 jour restant');
    await i18n.changeLanguage('es');
    expect(i18n.t('reminders.option', { count: 0 })).toBe('El día del vencimiento');
    expect(i18n.t('reminders.option', { count: 1 })).toBe('1 día antes');
    expect(i18n.t('reminders.option', { count: 30 })).toBe('30 días antes');
  });
});

describe('localized date formats', () => {
  it('formats calendar dates per locale without shifting the day', () => {
    expect(createFormatters('en-US').formatDate('2030-11-15')).toBe('November 15, 2030');
    expect(createFormatters('es-DO').formatDate('2030-11-15')).toBe('15 de noviembre de 2030');
    expect(createFormatters('fr-FR').formatDate('2030-11-15')).toBe('15 novembre 2030');
    expect(createFormatters('pt-BR').formatDate('2030-11-15')).toBe('15 de novembro de 2030');
  });

  it('formats leap days', () => {
    expect(createFormatters('en-US').formatDate('2028-02-29')).toBe('February 29, 2028');
  });

  it('respects 12/24-hour clocks', () => {
    expect(createFormatters('en-US', false).formatTime(9, 0)).toMatch(/^9:00\sAM$/);
    expect(createFormatters('en-US', true).formatTime(21, 5)).toBe('21:05');
  });

  it('falls back to the raw value for invalid dates', () => {
    expect(createFormatters('en-US').formatDate('bad')).toBe('bad');
  });
});
