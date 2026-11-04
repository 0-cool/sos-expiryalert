import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import {
  REMINDER_DAY_OPTIONS,
  toggleReminderDay,
  type ReminderDay,
} from '@/features/reminders/reminderOptions';

interface ReminderDaysPickerProps {
  value: readonly ReminderDay[];
  onChange: (value: ReminderDay[]) => void;
}

export function ReminderDaysPicker({ value, onChange }: ReminderDaysPickerProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.grid}>
      {REMINDER_DAY_OPTIONS.map((day) => (
        <Chip
          key={day}
          testID={`reminder-${day}`}
          role="checkbox"
          label={t('reminders.optionShort', { count: day })}
          selected={value.includes(day)}
          onPress={() => onChange(toggleReminderDay(value, day))}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
