import i18n from '@/i18n';
import { buildReminderContent } from '@/features/notifications/reminderContent';

const document = {
  id: 'a',
  documentType: 'passport' as const,
  documentName: 'Juan Rojas',
  expirationDate: '2030-11-15',
  reminderDays: [30] as const,
};

const formatDate = () => '15 Nov 2030';

afterAll(async () => {
  await i18n.changeLanguage('en');
});

describe('buildReminderContent', () => {
  it('describes upcoming expirations with plural-aware text', async () => {
    await i18n.changeLanguage('en');
    const t = i18n.t.bind(i18n);
    expect(buildReminderContent({ ...document, reminderDays: [30] }, 30, { t, formatDate, showDetails: true })).toEqual({
      title: 'Passport expiring soon',
      body: '“Juan Rojas” expires in 30 days, on 15 Nov 2030.',
    });
    expect(buildReminderContent({ ...document, reminderDays: [1] }, 1, { t, formatDate, showDetails: true }).body).toBe(
      '“Juan Rojas” expires tomorrow, 15 Nov 2030.',
    );
    expect(buildReminderContent({ ...document, reminderDays: [0] }, 0, { t, formatDate, showDetails: true })).toEqual({
      title: 'Passport expires today',
      body: '“Juan Rojas” expires today. Time to renew it.',
    });
  });

  it('hides the document name and type when details are disabled', async () => {
    await i18n.changeLanguage('en');
    const t = i18n.t.bind(i18n);
    const content = buildReminderContent({ ...document, reminderDays: [7] }, 7, { t, formatDate, showDetails: false });
    expect(content.title).toBe('Document reminder');
    expect(content.body).not.toContain('Juan');
    expect(content.body).not.toContain('Passport');
    expect(content.body).toContain('7 days');
  });

  it('is translated', async () => {
    await i18n.changeLanguage('es');
    const t = i18n.t.bind(i18n);
    expect(buildReminderContent({ ...document, reminderDays: [7] }, 7, { t, formatDate, showDetails: true })).toEqual({
      title: 'Pasaporte por vencer',
      body: '«Juan Rojas» vence en 7 días, el 15 Nov 2030.',
    });
    await i18n.changeLanguage('fr');
    expect(i18n.t('notifications.privateBody', { count: 0 })).toBe(
      'L’un de vos documents expire aujourd’hui. Ouvrez l’app pour voir les détails.',
    );
  });
});
