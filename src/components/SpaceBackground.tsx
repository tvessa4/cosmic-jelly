// Фон «ночное космическое небо»: фиолетовый градиент, туманности и мерцающие звёзды.
// Все анимации идут на UI-потоке (Reanimated), поэтому не мешают игре.

import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { nextRandom } from '../game/rng';
import { colors } from '../theme';

type StarData = { x: number; y: number; size: number; delay: number; duration: number; min: number };

/** Звёзды генерируются по фиксированному сиду — при каждой отрисовке на тех же местах. */
function makeStars(count: number, width: number, height: number): StarData[] {
  let rng = 20261019;
  const next = () => {
    const [r, s] = nextRandom(rng);
    rng = s;
    return r;
  };
  return Array.from({ length: count }, () => ({
    x: next() * width,
    y: next() * height,
    size: 1 + next() * 2.2,
    delay: next() * 3000,
    duration: 1400 + next() * 2600,
    min: 0.15 + next() * 0.3,
  }));
}

const Star = memo(function Star({ x, y, size, delay, duration, min }: StarData) {
  const opacity = useSharedValue(min);
  useEffect(() => {
    const ease = Easing.inOut(Easing.sin);
    opacity.set(
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration, easing: ease }),
            withTiming(min, { duration, easing: ease }),
          ),
          -1,
        ),
      ),
    );
  }, [opacity, delay, duration, min]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return (
    <Animated.View
      style={[
        styles.star,
        { left: x, top: y, width: size, height: size, borderRadius: size, shadowRadius: size * 2 },
        style,
      ]}
    />
  );
});

export const SpaceBackground = memo(function SpaceBackground() {
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => makeStars(55, width, height), [width, height]);

  // Туманности медленно «дышат».
  const breath = useSharedValue(0.75);
  useEffect(() => {
    breath.set(withRepeat(withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [breath]);
  const nebulaStyle = useAnimatedStyle(() => ({ opacity: breath.get() }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[colors.skyTop, colors.skyMid, colors.skyBottom]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, nebulaStyle]}>
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id="nebPink" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#ff6fd8" stopOpacity={0.35} />
              <Stop offset="1" stopColor="#ff6fd8" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="nebTeal" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#3ff0d0" stopOpacity={0.22} />
              <Stop offset="1" stopColor="#3ff0d0" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="nebViolet" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#8d5bff" stopOpacity={0.4} />
              <Stop offset="1" stopColor="#8d5bff" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse
            cx={width * 0.15}
            cy={height * 0.18}
            rx={width * 0.7}
            ry={height * 0.22}
            fill="url(#nebViolet)"
          />
          <Ellipse
            cx={width * 0.95}
            cy={height * 0.45}
            rx={width * 0.6}
            ry={height * 0.2}
            fill="url(#nebPink)"
          />
          <Ellipse
            cx={width * 0.2}
            cy={height * 0.85}
            rx={width * 0.65}
            ry={height * 0.18}
            fill="url(#nebTeal)"
          />
        </Svg>
      </Animated.View>
      {stars.map((s, i) => (
        <Star key={i} {...s} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
  },
});
