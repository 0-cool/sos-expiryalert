import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type ScrollViewInstance,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useNotifications } from '@/features/notifications/NotificationsProvider';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { DEFAULT_REMINDER_DAYS } from '@/features/reminders/reminderOptions';
import { useAppTheme } from '@/theme/ThemeProvider';

const SLIDES: readonly { key: 'track' | 'remind' | 'privacy'; icon: IconName }[] = [
  { key: 'track', icon: 'calendar-check-outline' },
  { key: 'remind', icon: 'bell-ring-outline' },
  { key: 'privacy', icon: 'shield-lock-outline' },
];

function PageDot({ active }: { active: boolean }) {
  const { colors } = useAppTheme();
  const width = useSharedValue(active ? 24 : 8);
  useEffect(() => {
    width.value = withTiming(active ? 24 : 8, { duration: 220 });
  }, [active, width]);
  const style = useAnimatedStyle(() => ({ width: width.value }));
  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: active ? colors.primary : colors.border }, style]}
    />
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useAppTheme();
  const { width } = useWindowDimensions();
  const { completeOnboarding } = useOnboarding();
  const { requestPermission } = useNotifications();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'slides' | 'notifications'>('slides');
  const [requesting, setRequesting] = useState(false);

  const isLast = index === SLIDES.length - 1;

  const goTo = (next: number) => {
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
    setIndex(next);
  };

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1)));
  };

  const enableReminders = async () => {
    setRequesting(true);
    try {
      await requestPermission();
    } finally {
      setRequesting(false);
      await completeOnboarding();
    }
  };

  if (phase === 'notifications') {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Animated.View entering={FadeIn.duration(300)} style={[styles.flex, styles.center, { padding: spacing.xxl }]}>
          <View style={[styles.illustration, { backgroundColor: colors.accentSoft }]}>
            <Icon name="bell-ring-outline" size={64} color={colors.accent} />
          </View>
          <AppText variant="title" align="center" accessibilityRole="header">
            {t('onboarding.notifications.title')}
          </AppText>
          <AppText variant="body" tone="secondary" align="center" style={styles.body}>
            {t('onboarding.notifications.body')}
          </AppText>
          <View style={styles.previewChips} accessible={false} importantForAccessibility="no-hide-descendants">
            {DEFAULT_REMINDER_DAYS.map((day) => (
              <Chip key={day} label={t('reminders.optionShort', { count: day })} selected onPress={() => undefined} />
            ))}
          </View>
        </Animated.View>
        <View style={[styles.actions, { paddingHorizontal: spacing.xxl, paddingBottom: spacing.lg }]}>
          <Button
            testID="onboarding-enable-notifications"
            label={t('onboarding.notifications.enable')}
            icon="bell-outline"
            loading={requesting}
            onPress={() => void enableReminders()}
          />
          <Button
            testID="onboarding-notifications-later"
            label={t('onboarding.notifications.later')}
            variant="ghost"
            size="medium"
            disabled={requesting}
            onPress={() => void completeOnboarding()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.topBar, { paddingHorizontal: spacing.lg }]}>
        <View style={styles.brand}>
          <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
            <Icon name="bell-ring" size={18} color={colors.onPrimary} />
          </View>
          <AppText variant="headline">{t('common.appName')}</AppText>
        </View>
        <Pressable
          testID="onboarding-skip"
          onPress={() => setPhase('notifications')}
          accessibilityRole="button"
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 8 })}
        >
          <AppText variant="subhead" tone="accent">
            {t('onboarding.skip')}
          </AppText>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        style={styles.flex}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width, padding: spacing.xxl }]}>
            <Animated.View entering={FadeInDown.duration(400)} style={styles.center}>
              <View style={[styles.illustration, { backgroundColor: colors.accentSoft }]}>
                <Icon name={slide.icon} size={64} color={colors.accent} />
              </View>
              <AppText variant="title" align="center" accessibilityRole="header">
                {t(`onboarding.slides.${slide.key}.title`)}
              </AppText>
              <AppText variant="body" tone="secondary" align="center" style={styles.body}>
                {t(`onboarding.slides.${slide.key}.body`)}
              </AppText>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.actions, { paddingHorizontal: spacing.xxl, paddingBottom: spacing.lg }]}>
        <View style={styles.dots} accessibilityRole="adjustable" accessibilityLabel={`${index + 1} / ${SLIDES.length}`}>
          {SLIDES.map((slide, slideIndex) => (
            <PageDot key={slide.key} active={slideIndex === index} />
          ))}
        </View>
        <Button
          testID="onboarding-next"
          label={isLast ? t('onboarding.getStarted') : t('common.next')}
          icon={isLast ? 'check' : undefined}
          onPress={() => (isLast ? setPhase('notifications') : goTo(index + 1))}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
  },
  illustration: {
    width: 136,
    height: 136,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  body: {
    maxWidth: 360,
  },
  previewChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  actions: {
    gap: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
