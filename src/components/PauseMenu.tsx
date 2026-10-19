// Меню паузы и общие выключатели настроек (используются и на экране «Настройки»).

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { haptic } from '../feedback/haptics';
import { playSound } from '../feedback/sounds';
import { useSettings, type Settings } from '../settings/SettingsContext';
import { colors, fonts } from '../theme';
import { MusicIcon, SoundIcon, VibrateIcon } from './Icons';
import { JellyButton } from './ui';

/** Выключатель в виде «желейной» таблетки. */
function Toggle({ on }: { on: boolean }) {
  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(on ? 24 : 0, { duration: 150 }) }],
  }));
  return (
    <View style={[styles.toggle, on && styles.toggleOn]}>
      <Animated.View style={[styles.knob, knob]} />
    </View>
  );
}

function Row({ icon, label, setting }: { icon: ReactNode; label: string; setting: keyof Settings }) {
  const s = useSettings();
  return (
    <Pressable
      style={styles.row}
      onPress={() => {
        s.toggle(setting);
        haptic.tap();
        playSound('tap');
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: s[setting] }}
      accessibilityLabel={label}
    >
      {icon}
      <Text style={styles.rowLabel}>{label}</Text>
      <Toggle on={s[setting]} />
    </Pressable>
  );
}

/** Три выключателя: звуки, музыка, вибрация. */
export function SettingsRows() {
  return (
    <>
      <Row icon={<SoundIcon />} label="Звуки" setting="sound" />
      <Row icon={<MusicIcon />} label="Музыка" setting="music" />
      <Row icon={<VibrateIcon />} label="Вибрация" setting="haptics" />
    </>
  );
}

type Props = { onResume: () => void; onNewGame: () => void; onMenu: () => void };

export function PauseMenu({ onResume, onNewGame, onMenu }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Пауза</Text>
        <SettingsRows />
        <JellyButton title="Продолжить" onPress={onResume} style={styles.first} />
        <JellyButton title="Начать заново" variant="ghost" onPress={onNewGame} />
        <JellyButton title="В меню" variant="ghost" onPress={onMenu} />
      </View>
    </Animated.View>
  );
}

export const settingsStyles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(60,30,110,0.9)',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.panelBorder,
    padding: 20,
    gap: 12,
  },
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: settingsStyles.card,
  title: { fontFamily: fonts.title, fontSize: 32, color: colors.text, textAlign: 'center', marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  rowLabel: { flex: 1, fontFamily: fonts.text, fontSize: 18, color: colors.text },
  toggle: {
    width: 54,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    padding: 3,
  },
  toggleOn: { backgroundColor: colors.mint },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  first: { marginTop: 8 },
});
