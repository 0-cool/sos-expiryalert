import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/ui/Icon';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { Screen } from '@/components/ui/Screen';
import { usePreferences } from '@/features/settings/PreferencesProvider';
import { SUPPORTED_LANGUAGES, type LanguagePreference } from '@/i18n/languages';
import { haptics } from '@/lib/haptics';
import { useAppTheme } from '@/theme/ThemeProvider';

export default function LanguageScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { preferences, updatePreferences, activeLanguage } = usePreferences();

  const options: { value: LanguagePreference; label: string; detail?: string }[] = [
    {
      value: 'system',
      label: t('settings.languageSystem'),
      detail: t(`languages.${activeLanguage}`),
    },
    ...SUPPORTED_LANGUAGES.map((language) => ({ value: language, label: t(`languages.${language}`) })),
  ];

  return (
    <Screen>
      <ListGroup>
        {options.map((option) => {
          const selected = preferences.language === option.value;
          return (
            <ListRow
              key={option.value}
              testID={`language-${option.value}`}
              label={option.label}
              detail={option.value === 'system' ? option.detail : undefined}
              showChevron={false}
              accessory={selected ? <Icon name="check" size={22} color={colors.accent} /> : null}
              onPress={() => {
                haptics.selection();
                updatePreferences({ language: option.value });
              }}
            />
          );
        })}
      </ListGroup>
    </Screen>
  );
}
