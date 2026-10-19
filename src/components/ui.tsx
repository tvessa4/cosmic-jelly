// Общие элементы интерфейса: кнопки, счётчик монет, заголовок экрана.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { haptic } from '../feedback/haptics';
import { playSound } from '../feedback/sounds';
import { colors, fonts } from '../theme';
import { BackIcon, CoinIcon } from './Icons';

type ButtonProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'ghost' | 'gold';
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Большая «желейная» кнопка, удобная для большого пальца (высота ≥ 56). */
export function JellyButton({
  title,
  subtitle,
  icon,
  variant = 'primary',
  onPress,
  disabled,
  style,
}: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        playSound('tap');
        haptic.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'gold' && styles.gold,
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
    >
      <View style={styles.shine} />
      {icon}
      <View style={styles.texts}>
        <Text style={[styles.title, variant === 'gold' && styles.darkText]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, variant === 'gold' && styles.darkSub]}>{subtitle}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Счётчик монет. */
export function CoinBadge({ coins }: { coins: number }) {
  return (
    <View style={styles.coins} accessibilityLabel={`Монеты: ${coins}`}>
      <CoinIcon />
      <Text style={styles.coinsText}>{coins}</Text>
    </View>
  );
}

/** Шапка экрана: кнопка «назад», заголовок, справа — монеты. */
export function ScreenHeader({
  title,
  onBack,
  coins,
}: {
  title: string;
  onBack: () => void;
  coins?: number;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => {
          playSound('tap');
          haptic.tap();
          onBack();
        }}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        accessibilityLabel="Назад"
      >
        <BackIcon />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerRight}>{coins !== undefined && <CoinBadge coins={coins} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 60,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  primary: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  gold: {
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  ghost: { backgroundColor: colors.panel, borderColor: colors.panelBorder },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  shine: {
    position: 'absolute',
    top: 5,
    left: 18,
    right: 18,
    height: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  texts: { alignItems: 'center' },
  title: { color: colors.text, fontFamily: fonts.text, fontSize: 20 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.text, fontSize: 13, marginTop: 1 },
  darkText: { color: '#3a1e00' },
  darkSub: { color: 'rgba(58,30,0,0.75)' },
  coins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.panel,
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 14,
  },
  coinsText: { color: colors.gold, fontFamily: fonts.number, fontSize: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    width: '100%',
    maxWidth: 520,
  },
  back: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.panel,
    borderColor: colors.panelBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, color: colors.text, fontFamily: fonts.title, fontSize: 26 },
  headerRight: { minWidth: 48, alignItems: 'flex-end' },
});
