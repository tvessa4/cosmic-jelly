// Маскот игры — Глип, маленький инопланетянин-слизень.
// Нарисован с нуля в SVG. Настроение меняется по ходу игры:
// idle — спокоен и моргает; happy — радуется слияниям и комбо;
// scared — пугается, когда поле почти заполнено; sad — грустит при проигрыше; party — празднует 2048.

import { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors, fonts } from '../theme';

export type MascotMood = 'idle' | 'happy' | 'scared' | 'sad' | 'party';

const INK = '#1d0b3a';

function Eyes({ mood, blink }: { mood: MascotMood; blink: boolean }) {
  const arc = { stroke: INK, strokeWidth: 3.2, strokeLinecap: 'round' as const, fill: 'none' };
  if (mood === 'happy') {
    return (
      <>
        <Path d="M34 55 Q40 46 46 55" {...arc} />
        <Path d="M54 55 Q60 46 66 55" {...arc} />
      </>
    );
  }
  if (mood === 'party') {
    const star = (cx: number, cy: number) =>
      `M${cx} ${cy - 7} L${cx + 2.2} ${cy - 2.2} L${cx + 7} ${cy} L${cx + 2.2} ${cy + 2.2} L${cx} ${cy + 7} L${cx - 2.2} ${cy + 2.2} L${cx - 7} ${cy} L${cx - 2.2} ${cy - 2.2} Z`;
    return (
      <>
        <Path d={star(40, 52)} fill={colors.gold} stroke={INK} strokeWidth={1.2} />
        <Path d={star(60, 52)} fill={colors.gold} stroke={INK} strokeWidth={1.2} />
      </>
    );
  }
  if (blink && mood === 'idle') {
    return (
      <>
        <Path d="M34 53 Q40 57 46 53" {...arc} />
        <Path d="M54 53 Q60 57 66 53" {...arc} />
      </>
    );
  }
  const big = mood === 'scared';
  const rx = big ? 7.5 : 6.2;
  const ry = big ? 9 : 7.4;
  const pupil = big ? 2.3 : 3.4;
  const dy = mood === 'sad' ? 3 : 1;
  return (
    <>
      <Ellipse cx={40} cy={52} rx={rx} ry={ry} fill="#fff" />
      <Ellipse cx={60} cy={52} rx={rx} ry={ry} fill="#fff" />
      <Circle cx={41} cy={52 + dy} r={pupil} fill={INK} />
      <Circle cx={61} cy={52 + dy} r={pupil} fill={INK} />
      <Circle cx={42.3} cy={50 + dy} r={1} fill="#fff" />
      <Circle cx={62.3} cy={50 + dy} r={1} fill="#fff" />
      {mood === 'sad' && (
        <>
          {/* Грустные брови «домиком» */}
          <Path d="M33 44 Q39 42 46 38" stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Path d="M54 38 Q61 42 67 44" stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </>
      )}
    </>
  );
}

function Mouth({ mood }: { mood: MascotMood }) {
  const line = {
    stroke: INK,
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  switch (mood) {
    case 'happy':
    case 'party':
      return (
        <>
          <Path d="M41 64 Q50 77 59 64 Z" fill={INK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M45.5 69.5 Q50 73.5 54.5 69.5 Q50 67.5 45.5 69.5 Z" fill="#ff7aa8" />
        </>
      );
    case 'scared':
      return <Path d="M41 69 Q44 65.5 47 69 Q50 72.5 53 69 Q56 65.5 59 69" {...line} />;
    case 'sad':
      return <Path d="M43 71 Q50 64.5 57 71" {...line} />;
    default:
      return <Path d="M44 66 Q50 71 56 66" {...line} />;
  }
}

/** Сам рисунок Глипа (100×100). */
export const GlipDrawing = memo(function GlipDrawing({
  mood,
  blink,
  size,
}: {
  mood: MascotMood;
  blink: boolean;
  size: number;
}) {
  const blush = mood === 'happy' || mood === 'party';
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="glipBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#a6ffe6" />
          <Stop offset="0.55" stopColor="#4fe8c4" />
          <Stop offset="1" stopColor="#1fb39a" />
        </LinearGradient>
      </Defs>
      {/* Усики с огоньками */}
      <Path d="M43 27 Q39 15 31 11" stroke="#2bc9a9" strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <Path d="M57 27 Q61 15 69 11" stroke="#2bc9a9" strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <Circle cx={31} cy={11} r={6.5} fill="#ff7ad9" opacity={0.3} />
      <Circle cx={69} cy={11} r={6.5} fill="#ff7ad9" opacity={0.3} />
      <Circle cx={31} cy={11} r={4.2} fill="#ff7ad9" />
      <Circle cx={69} cy={11} r={4.2} fill="#ff7ad9" />
      {/* Тело-капля с «подтёками» снизу */}
      <Path
        d="M20 82 C12 82 10 72 16 66 C14 42 30 24 50 24 C70 24 86 42 84 66 C90 72 88 82 80 82 Q74 88 67 82 Q59 90 51 82 Q43 89 35 82 Q27 88 20 82 Z"
        fill="url(#glipBody)"
        stroke="#18a089"
        strokeWidth={1.5}
      />
      {/* Блики желе */}
      <G opacity={0.6}>
        <Ellipse cx={34} cy={40} rx={9} ry={4.5} fill="#fff" transform="rotate(-25 34 40)" />
        <Circle cx={46} cy={34} r={2.2} fill="#fff" />
      </G>
      {blush && (
        <>
          <Ellipse cx={30} cy={63} rx={5} ry={3} fill="#ff7ad9" opacity={0.55} />
          <Ellipse cx={70} cy={63} rx={5} ry={3} fill="#ff7ad9" opacity={0.55} />
        </>
      )}
      <Eyes mood={mood} blink={blink} />
      <Mouth mood={mood} />
      {mood === 'scared' && <Path d="M80 34 Q84 41 80 44 Q76 41 80 34 Z" fill="#8fd8ff" />}
      {mood === 'sad' && <Path d="M36 61 Q39 67 36 69 Q33 67 36 61 Z" fill="#8fd8ff" />}
    </Svg>
  );
});

type Props = { mood: MascotMood; message?: string; size?: number };

export const Mascot = memo(function Mascot({ mood, message, size = 76 }: Props) {
  const [blink, setBlink] = useState(false);
  const bob = useSharedValue(0);
  const hop = useSharedValue(0);
  const shiver = useSharedValue(0);

  // Моргание раз в несколько секунд.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      timer = setTimeout(
        () => {
          setBlink(true);
          timer = setTimeout(() => {
            setBlink(false);
            loop();
          }, 140);
        },
        2600 + Math.random() * 2400,
      );
    };
    loop();
    return () => clearTimeout(timer);
  }, []);

  // Спокойное «дыхание» желе.
  useEffect(() => {
    bob.set(withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [bob]);

  // Реакция на смену настроения.
  useEffect(() => {
    if (mood === 'happy' || mood === 'party') {
      hop.set(
        withSequence(
          withTiming(-14, { duration: 140, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 260, easing: Easing.bounce }),
        ),
      );
    }
    shiver.set(
      mood === 'scared'
        ? withRepeat(
            withSequence(withTiming(-3, { duration: 60 }), withTiming(3, { duration: 60 })),
            -1,
            true,
          )
        : withTiming(0, { duration: 80 }),
    );
  }, [mood, hop, shiver]);

  const style = useAnimatedStyle(() => {
    const b = bob.get();
    return {
      transform: [
        { translateY: hop.get() - b * 3 },
        { translateX: shiver.get() },
        { scaleX: 1 + b * 0.03 },
        { scaleY: 1 - b * 0.03 },
      ],
    };
  });

  return (
    <View style={styles.row}>
      <Animated.View style={style}>
        <GlipDrawing mood={mood} blink={blink} size={size} />
      </Animated.View>
      {message ? (
        <View style={styles.bubble}>
          <View style={styles.bubbleTail} />
          <Text style={styles.bubbleText} numberOfLines={2}>
            {message}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    maxWidth: 220,
  },
  bubbleTail: {
    position: 'absolute',
    left: -6,
    top: '50%',
    marginTop: -6,
    width: 12,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.panelBorder,
    transform: [{ rotate: '45deg' }],
  },
  bubbleText: { color: colors.text, fontFamily: fonts.text, fontSize: 15 },
});
