import { forwardRef, useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH_TARGET } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon } from './Icon';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string | null;
  warning?: string | null;
  helper?: string | null;
  /** Element rendered inside the field on the right (e.g. show/hide password). */
  accessory?: ReactNode;
  /** Shows "12/80" under the field. */
  maxLengthCounter?: number;
  optionalLabel?: string;
}

export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField(
  { label, error, warning, helper, accessory, maxLengthCounter, optionalLabel, multiline, value, onFocus, onBlur, ...inputProps },
  ref,
) {
  const theme = useAppTheme();
  const { colors, spacing, radii } = theme;
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.accent : colors.border;
  const message = error ?? warning ?? helper;
  const messageTone = error ? 'danger' : warning ? 'warning' : 'secondary';

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <AppText variant="subhead" tone="secondary" importantForAccessibility="no">
          {label}
        </AppText>
        {optionalLabel ? (
          <AppText variant="caption" tone="tertiary">
            {optionalLabel}
          </AppText>
        ) : null}
      </View>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor,
            borderRadius: radii.md,
            minHeight: multiline ? 104 : Math.max(52, MIN_TOUCH_TARGET),
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        <TextInput
          ref={ref}
          value={value}
          multiline={multiline}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.accent}
          accessibilityLabel={label}
          accessibilityHint={message ?? undefined}
          maxFontSizeMultiplier={1.6}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            theme.typography.body,
            styles.input,
            { color: colors.text, paddingVertical: multiline ? spacing.md : spacing.sm },
            multiline ? styles.multiline : null,
          ]}
          {...inputProps}
        />
        {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
      </View>
      {message || maxLengthCounter ? (
        <View style={styles.footer}>
          {message ? (
            <View style={styles.message}>
              {error || warning ? (
                <Icon
                  name={error ? 'alert-circle' : 'alert-circle-outline'}
                  size={16}
                  color={error ? colors.danger : colors.warning}
                />
              ) : null}
              <AppText variant="footnote" tone={messageTone} style={styles.messageText} accessibilityLiveRegion="polite">
                {message}
              </AppText>
            </View>
          ) : (
            <View style={styles.messageText} />
          )}
          {maxLengthCounter ? (
            <AppText variant="caption" tone="tertiary">
              {`${value?.length ?? 0}/${maxLengthCounter}`}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  accessory: {
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  message: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  messageText: {
    flex: 1,
  },
});
