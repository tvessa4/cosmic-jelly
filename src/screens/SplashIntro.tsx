// Заставка при запуске: Глип выпрыгивает, появляется название, через ~1,5 с — главное меню.

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { GlipDrawing } from '../components/Mascot';
import { SpaceBackground } from '../components/SpaceBackground';
import { colors, fonts } from '../theme';

export function SplashIntro({ onDone }: { onDone: () => void }) {
  const y = useSharedValue(60);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    y.set(
      withSequence(
        withTiming(-18, { duration: 380, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 420, easing: Easing.bounce }),
      ),
    );
    scale.set(withTiming(1, { duration: 380 }));
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [y, scale, onDone]);

  const glip = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }, { scale: scale.get() }] }));
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.set(withDelay(300, withTiming(1, { duration: 700 })));
  }, [glow]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.get() }));

  return (
    <View style={styles.root}>
      <SpaceBackground />
      {/* Мягкое свечение за Глипом (радиальный градиент — одинаково выглядит на телефоне и в браузере) */}
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
        <Svg width={320} height={320}>
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.mint} stopOpacity={0.55} />
              <Stop offset="1" stopColor={colors.mint} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={160} cy={160} r={160} fill="url(#halo)" />
        </Svg>
      </Animated.View>
      <Animated.View style={glip}>
        <GlipDrawing mood="happy" blink={false} size={150} />
      </Animated.View>
      <Animated.Text entering={FadeIn.delay(350).duration(500)} style={styles.title}>
        Cosmic Jelly
      </Animated.Text>
      <Animated.View entering={FadeIn.delay(650).duration(500)}>
        <Text style={styles.subtitle}>космическая головоломка</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.skyTop, gap: 8 },
  glow: { position: 'absolute', width: 320, height: 320, marginTop: -110 },
  title: {
    fontFamily: fonts.title,
    fontSize: 44,
    color: colors.text,
    marginTop: 8,
    textShadowColor: colors.pink,
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 0 },
  },
  subtitle: { fontFamily: fonts.text, fontSize: 16, color: colors.textSoft, letterSpacing: 1 },
});
