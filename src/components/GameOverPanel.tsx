// Окно конца игры: счёт «набегает» от нуля, рекорд, заработанные монеты.

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { colors, fonts } from '../theme';
import { CoinIcon, UndoIcon } from './Icons';
import { GlipDrawing } from './Mascot';
import { JellyButton } from './ui';

/** Число плавно растёт от 0 до value за duration мс. */
function useCountUp(value: number, duration = 900) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return shown;
}

type Props = {
  score: number;
  best: number;
  bestLabel: string;
  isNewBest: boolean;
  coinsEarned: number;
  undoCount: number;
  canUndo: boolean;
  onUndo: () => void;
  onRestart: () => void;
  onMenu: () => void;
};

export function GameOverPanel(p: Props) {
  const shown = useCountUp(p.score);
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.overlay}>
      <Animated.View entering={ZoomIn.delay(100).duration(280)} style={styles.card}>
        <GlipDrawing mood={p.isNewBest ? 'party' : 'sad'} blink={false} size={84} />
        <Text style={styles.title}>{p.isNewBest ? 'Новый рекорд!' : 'Ходов больше нет'}</Text>
        <Text style={styles.score} accessibilityLabel={`Счёт ${p.score}`}>
          {shown}
        </Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{p.bestLabel}</Text>
            <Text style={styles.statValue}>{p.best}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>МОНЕТЫ</Text>
            <View style={styles.coinRow}>
              <CoinIcon size={18} />
              <Text style={[styles.statValue, styles.gold]}>+{p.coinsEarned}</Text>
            </View>
          </View>
        </View>
        {p.canUndo && (
          <JellyButton
            title={`Отменить ход (${p.undoCount})`}
            icon={<UndoIcon />}
            variant="ghost"
            onPress={p.onUndo}
            style={styles.button}
          />
        )}
        <JellyButton title="Ещё раз" onPress={p.onRestart} style={styles.button} />
        <JellyButton title="В меню" variant="ghost" onPress={p.onMenu} style={styles.button} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(60,30,110,0.92)',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.panelBorder,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  title: { fontFamily: fonts.title, fontSize: 28, color: colors.text, textAlign: 'center' },
  score: { fontFamily: fonts.number, fontSize: 56, color: colors.gold, lineHeight: 64 },
  stats: { flexDirection: 'row', gap: 12, alignSelf: 'stretch', marginBottom: 4 },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 8,
  },
  statLabel: { fontFamily: fonts.text, fontSize: 12, color: colors.textSoft, letterSpacing: 1 },
  statValue: { fontFamily: fonts.number, fontSize: 22, color: colors.text },
  gold: { color: colors.gold },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  button: { alignSelf: 'stretch' },
});
