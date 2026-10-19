// Одна «желейная» плитка:
// - полупрозрачная, с градиентом, бликом, мягкой цветной тенью и значком-узором;
// - плавно скользит в новую клетку;
// - при слиянии коротко вспыхивает (без изменения размера — числа не прыгают);
// - новая плитка мягко появляется;
// - при касании слегка покачивается.

import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { shade, tileStyle, withAlpha } from '../design/palette';
import { fonts } from '../theme';
import { TilePattern } from './TilePattern';

/** Длительность скольжения плиток, мс. */
export const SLIDE_MS = 110;

export type DisplayTile = {
  id: number;
  value: number;
  row: number;
  col: number;
  /** new — только что появилась; consumed — въезжает в другую плитку и исчезнет. */
  kind: 'normal' | 'new' | 'consumed';
};

/** Длинные числа — мельче шрифт, чтобы влезли в плитку. */
function fontSizeFor(value: number, size: number): number {
  const digits = String(value).length;
  const k = digits <= 2 ? 0.46 : digits === 3 ? 0.38 : digits === 4 ? 0.3 : digits === 5 ? 0.25 : 0.21;
  return Math.round(size * k);
}

type Props = { tile: DisplayTile; size: number; step: number; wobble: number };

export const TileView = memo(function TileView({ tile, size, step, wobble }: Props) {
  const x = useSharedValue(tile.col * step);
  const y = useSharedValue(tile.row * step);
  const scale = useSharedValue(tile.kind === 'new' ? 0.5 : 1);
  const opacity = useSharedValue(tile.kind === 'new' ? 0 : 1);
  const flash = useSharedValue(0);
  const rotate = useSharedValue(0);
  const prevValue = useRef(tile.value);

  // Скольжение в новую клетку.
  useEffect(() => {
    const cfg = { duration: SLIDE_MS, easing: Easing.out(Easing.quad) };
    x.set(withTiming(tile.col * step, cfg));
    y.set(withTiming(tile.row * step, cfg));
  }, [tile.col, tile.row, step, x, y]);

  // Новая плитка плавно вырастает и проявляется — без «пружинки».
  useEffect(() => {
    if (tile.kind !== 'new') return;
    const cfg = { duration: 120, easing: Easing.out(Easing.quad) };
    scale.set(withTiming(1, cfg));
    opacity.set(withTiming(1, cfg));
  }, [tile.kind, scale, opacity]);

  // Слияние: короткая белая вспышка внутри плитки.
  useEffect(() => {
    if (tile.value > prevValue.current) {
      flash.set(withSequence(withTiming(0.6, { duration: 60 }), withTiming(0, { duration: 260 })));
    }
    prevValue.current = tile.value;
  }, [tile.value, flash]);

  // Покачивание при касании.
  useEffect(() => {
    if (wobble === 0) return;
    rotate.set(
      withSequence(
        withTiming(6, { duration: 60 }),
        withTiming(-5, { duration: 90 }),
        withTiming(3, { duration: 90 }),
        withTiming(-1.5, { duration: 80 }),
        withTiming(0, { duration: 70 }),
      ),
    );
  }, [wobble, rotate]);

  const moveStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [
      { translateX: x.get() },
      { translateY: y.get() },
      { scale: scale.get() },
      { rotate: `${rotate.get()}deg` },
    ],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.get() }));

  const st = tileStyle(tile.value);
  const radius = Math.round(size * 0.24);
  const round = { borderRadius: radius };

  // Анимацию исчезновения вешаем на внешнюю «обёртку» без transform:
  // иначе она перезаписывает сдвиг, и плитка на миг отпрыгивает в угол поля.
  return (
    <Animated.View
      exiting={FadeOut.duration(100)}
      pointerEvents="none"
      style={[styles.wrapper, { zIndex: tile.kind === 'consumed' ? 1 : 2 }]}
    >
      <Animated.View
        style={[
          styles.tile,
          round,
          { width: size, height: size, backgroundColor: withAlpha(st.color, 0.9), shadowColor: st.color },
          moveStyle,
        ]}
      >
        <LinearGradient
          colors={[
            withAlpha(shade(st.color, 0.4), 0.95),
            withAlpha(st.color, 0.88),
            withAlpha(shade(st.color, -0.2), 0.95),
          ]}
          locations={[0, 0.5, 1]}
          style={[StyleSheet.absoluteFill, round]}
        />
        {/* Внутренний блик и «капля» света — делают плитку похожей на желе. */}
        <View
          style={[
            styles.highlight,
            { top: size * 0.07, left: size * 0.12, width: size * 0.52, height: size * 0.17 },
          ]}
        />
        <View
          style={[
            styles.glint,
            { top: size * 0.09, left: size * 0.69, width: size * 0.09, height: size * 0.09 },
          ]}
        />
        <View style={[StyleSheet.absoluteFill, round, styles.rim]} />
        <View style={[styles.pattern, { bottom: size * 0.08, right: size * 0.08 }]}>
          <TilePattern name={st.pattern} size={size * 0.23} color={st.text} />
        </View>
        <Text
          style={[styles.text, { fontSize: fontSizeFor(tile.value, size), color: st.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {tile.value}
        </Text>
        <Animated.View style={[StyleSheet.absoluteFill, round, styles.flash, flashStyle]} />
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 0, top: 0 },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    shadowOpacity: 0.55,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
  },
  highlight: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
    transform: [{ rotate: '-6deg' }],
  },
  glint: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.7)' },
  rim: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  pattern: { position: 'absolute', opacity: 0.5 },
  text: { fontFamily: fonts.number },
  flash: { backgroundColor: '#ffffff' },
});
