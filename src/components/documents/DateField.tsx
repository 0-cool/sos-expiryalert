import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useFormatters } from '@/i18n/useFormatters';
import { dateToISODate, isoDateToLocalNoon, type ISODate } from '@/lib/dates';
import { useAppTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH_TARGET } from '@/theme/tokens';

const MIN_PICKER_DATE = new Date(1950, 0, 1);
const MAX_PICKER_DATE = new Date(2150, 11, 31);

interface DateFieldProps {
  label: string;
  value: ISODate | null;
  onChange: (value: ISODate) => void;
  placeholder: string;
  error?: string | null;
  warning?: string | null;
  testID?: string;
}

/**
 * Native date selection: the system dialog on Android, an inline calendar in a
 * sheet on iOS. Values are calendar dates (YYYY-MM-DD), never time-zone shifted.
 */
export function DateField({ label, value, onChange, placeholder, error, warning, testID }: DateFieldProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors, radii, spacing } = theme;
  const { formatDate, locale } = useFormatters();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [draft, setDraft] = useState<Date>(() => isoDateToLocalNoon(value ?? '') ?? new Date());

  const current = isoDateToLocalNoon(value ?? '') ?? new Date();

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate: MIN_PICKER_DATE,
        maximumDate: MAX_PICKER_DATE,
        onValueChange: (_event, date) => onChange(dateToISODate(date)),
      });
      return;
    }
    setDraft(current);
    setSheetVisible(true);
  };

  const message = error ?? warning;

  return (
    <View style={styles.container}>
      <AppText variant="subhead" tone="secondary" importantForAccessibility="no">
        {label}
      </AppText>
      <Pressable
        testID={testID}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDate(value, 'long') : placeholder}`}
        accessibilityHint={message ?? undefined}
        style={({ pressed }) => [
          styles.field,
          {
            minHeight: Math.max(52, MIN_TOUCH_TARGET),
            backgroundColor: pressed ? colors.surfacePressed : colors.surface,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radii.md,
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        <AppText variant="body" tone={value ? 'primary' : 'tertiary'} style={styles.value}>
          {value ? formatDate(value, 'long') : placeholder}
        </AppText>
        <Icon name="calendar-blank-outline" size={22} color={colors.accent} />
      </Pressable>
      {message ? (
        <View style={styles.message}>
          <Icon name={error ? 'alert-circle' : 'alert-circle-outline'} size={16} color={error ? colors.danger : colors.warning} />
          <AppText variant="footnote" tone={error ? 'danger' : 'warning'} style={styles.messageText} accessibilityLiveRegion="polite">
            {message}
          </AppText>
        </View>
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={sheetVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSheetVisible(false)}
        >
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.separator }]}>
              <Pressable onPress={() => setSheetVisible(false)} accessibilityRole="button" hitSlop={10}>
                <AppText variant="body" tone="accent">
                  {t('common.cancel')}
                </AppText>
              </Pressable>
              <AppText variant="headline" numberOfLines={1} style={styles.sheetTitle}>
                {label}
              </AppText>
              <Pressable
                testID="date-sheet-done"
                onPress={() => {
                  onChange(dateToISODate(draft));
                  setSheetVisible(false);
                }}
                accessibilityRole="button"
                hitSlop={10}
              >
                <AppText variant="bodyStrong" tone="accent">
                  {t('common.done')}
                </AppText>
              </Pressable>
            </View>
            <View style={{ padding: spacing.lg }}>
              <DateTimePicker
                value={draft}
                mode="date"
                display="inline"
                locale={locale}
                themeVariant={theme.dark ? 'dark' : 'light'}
                accentColor={colors.accent}
                minimumDate={MIN_PICKER_DATE}
                maximumDate={MAX_PICKER_DATE}
                onValueChange={(_event, date) => setDraft(date)}
              />
              <AppText variant="title2" align="center" style={{ marginTop: spacing.md }}>
                {formatDate(dateToISODate(draft), 'long')}
              </AppText>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 8,
  },
  value: {
    flex: 1,
  },
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  messageText: {
    flex: 1,
  },
  sheet: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  sheetTitle: {
    flex: 1,
    textAlign: 'center',
  },
});
