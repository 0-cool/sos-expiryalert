import * as Haptics from 'expo-haptics';

/** Haptic feedback that never throws (unsupported devices, simulators, tests). */
export const haptics = {
  selection() {
    void Haptics.selectionAsync().catch(() => undefined);
  },
  success() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  },
  warning() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
  },
  impact() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  },
};
