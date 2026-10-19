// Всплывающие уведомления сверху экрана («Достижение открыто!», «Не хватает монет» …).
// Показываются по очереди, каждое ~2,4 секунды.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

export type ToastData = { title: string; subtitle?: string; icon?: ReactNode };

type Ctx = { show: (t: ToastData) => void };
const ToastContext = createContext<Ctx>({ show: () => {} });

const TOAST_MS = 2400;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<(ToastData & { key: number })[]>([]);
  const insets = useSafeAreaInsets();
  const current = queue[0];

  const show = useCallback((t: ToastData) => {
    setQueue((q) => [...q, { ...t, key: Date.now() + Math.random() }]);
  }, []);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => setQueue((q) => q.slice(1)), TOAST_MS);
    return () => clearTimeout(timer);
  }, [current]);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="none" style={[styles.layer, { top: insets.top + 8 }]}>
        {current && (
          <Animated.View
            key={current.key}
            entering={FadeInUp.duration(220)}
            exiting={FadeOutUp.duration(180)}
            style={styles.toast}
          >
            {current.icon}
            <View style={styles.texts}>
              <Text style={styles.title}>{current.title}</Text>
              {current.subtitle ? <Text style={styles.subtitle}>{current.subtitle}</Text> : null}
            </View>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 100 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(70,35,130,0.96)',
    borderColor: colors.gold,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  texts: { flexShrink: 1 },
  title: { color: colors.text, fontFamily: fonts.title, fontSize: 16 },
  subtitle: { color: colors.textSoft, fontFamily: fonts.text, fontSize: 13 },
});
