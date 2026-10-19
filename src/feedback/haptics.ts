// Вибрация (тактильный отклик) разной силы. Если вибрация выключена в настройках — ничего не делает.

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// В браузере вибрации нет (а на телефоне в браузере она без касания блокируется) — отключаем.
const supported = Platform.OS !== 'web';
let enabled = supported;

export function setHapticsEnabled(on: boolean) {
  enabled = supported && on;
}

// Ошибки вибрации (например, на симуляторе) просто игнорируем.
const safe = (p: Promise<void>) => p.catch(() => {});

export const haptic = {
  /** Касание кнопки / свайп без слияний — самый лёгкий щелчок. */
  tap() {
    if (enabled) safe(Haptics.selectionAsync());
  },
  /** Ход со слияниями: чем больше слияний за ход, тем сильнее. */
  merge(count: number) {
    if (!enabled || count <= 0) return;
    const style =
      count === 1
        ? Haptics.ImpactFeedbackStyle.Light
        : count === 2
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Heavy;
    safe(Haptics.impactAsync(style));
  },
  /** Бустер сработал. */
  booster() {
    if (enabled) safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid));
  },
  win() {
    if (enabled) safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  lose() {
    if (enabled) safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  },
};
