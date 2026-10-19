// Игровые эффекты: частицы при слиянии, всплывающие надписи и конфетти.
// Каждый эффект сам проигрывает анимацию; родитель убирает его по таймеру.

import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { TILE_STYLES } from '../design/palette';
import { nextRandom } from '../game/rng';
import { fonts } from '../theme';

// ---------- Частицы ----------

/** Сколько живёт эффект частиц, мс (родитель удаляет его после этого времени). */
export const BURST_MS = 450;

const Particle = memo(function Particle({
  angle,
  dist,
  size,
  color,
}: {
  angle: number;
  dist: number;
  size: number;
  color: string;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }));
  }, [t]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.get(),
    transform: [
      { translateX: Math.cos(angle) * dist * t.get() },
      { translateY: Math.sin(angle) * dist * t.get() },
      { scale: 1 - 0.5 * t.get() },
    ],
  }));
  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
          marginLeft: -size / 2,
          marginTop: -size / 2,
        },
        style,
      ]}
    />
  );
});

/** Россыпь из 8 «капелек желе» из центра клетки. */
export const ParticleBurst = memo(function ParticleBurst({
  x,
  y,
  color,
  radius,
}: {
  x: number;
  y: number;
  color: string;
  radius: number;
}) {
  const parts = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        angle: (i / 8) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1),
        dist: radius * (0.85 + (i % 3) * 0.15),
        size: 5 + (i % 3) * 2,
      })),
    [radius],
  );
  return (
    <View pointerEvents="none" style={[styles.burst, { left: x, top: y }]}>
      {parts.map((p, i) => (
        <Particle key={i} {...p} color={i % 3 === 0 ? '#ffffff' : color} />
      ))}
    </View>
  );
});

// ---------- Всплывающая надпись ----------

/** Сколько живёт надпись, мс. */
export const FLOAT_MS = 900;

/** Надпись «Combo x2!», «+128» и т. п.: появляется, всплывает и тает. */
export const FloatingText = memo(function FloatingText({
  text,
  color,
  size,
  rise = 28,
}: {
  text: string;
  color: string;
  size: number;
  rise?: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withTiming(1, { duration: FLOAT_MS, easing: Easing.out(Easing.quad) }));
  }, [t]);
  const style = useAnimatedStyle(() => {
    const v = t.get();
    return {
      opacity: v < 0.15 ? v / 0.15 : v > 0.65 ? (1 - v) / 0.35 : 1,
      transform: [{ translateY: -rise * v }],
    };
  });
  return (
    <Animated.Text pointerEvents="none" style={[styles.floating, { color, fontSize: size }, style]}>
      {text}
    </Animated.Text>
  );
});

// ---------- Конфетти ----------

export const CONFETTI_MS = 3200;

const ConfettiPiece = memo(function ConfettiPiece({
  x,
  delay,
  duration,
  color,
  w,
  h,
  sway,
  spin,
  height,
}: {
  x: number;
  delay: number;
  duration: number;
  color: string;
  w: number;
  h: number;
  sway: number;
  spin: number;
  height: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(delay, withTiming(1, { duration, easing: Easing.in(Easing.quad) })));
  }, [t, delay, duration]);
  const style = useAnimatedStyle(() => {
    const v = t.get();
    return {
      opacity: v === 0 ? 0 : v > 0.85 ? (1 - v) / 0.15 : 1,
      transform: [
        { translateX: x + Math.sin(v * Math.PI * 3) * sway },
        { translateY: -30 + v * (height + 60) },
        { rotate: `${v * spin}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.confetti, { width: w, height: h, backgroundColor: color }, style]} />;
});

/** Праздничное конфетти на весь экран. */
export const Confetti = memo(function Confetti({ seed }: { seed: number }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => {
    let rng = seed;
    const r = () => {
      const [v, s] = nextRandom(rng);
      rng = s;
      return v;
    };
    return Array.from({ length: 70 }, () => ({
      x: r() * width,
      delay: r() * 600,
      duration: 1800 + r() * 900,
      color: TILE_STYLES[Math.floor(r() * 12)].color,
      w: 6 + r() * 6,
      h: 10 + r() * 8,
      sway: 10 + r() * 25,
      spin: (r() > 0.5 ? 1 : -1) * (360 + r() * 540),
      height,
    }));
  }, [seed, width, height]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} {...p} />
      ))}
    </View>
  );
});

// ---------- Тряска ----------

/** Последовательность для лёгкой тряски поля (в пикселях). */
export function shakeSequence() {
  return withSequence(
    withTiming(-4, { duration: 40 }),
    withTiming(4, { duration: 50 }),
    withTiming(-3, { duration: 50 }),
    withTiming(2, { duration: 40 }),
    withTiming(0, { duration: 40 }),
  );
}

const styles = StyleSheet.create({
  particle: { position: 'absolute', left: 0, top: 0 },
  burst: { position: 'absolute', width: 0, height: 0, zIndex: 5 },
  floating: {
    fontFamily: fonts.title,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  confetti: { position: 'absolute', left: 0, top: 0, borderRadius: 2 },
});
