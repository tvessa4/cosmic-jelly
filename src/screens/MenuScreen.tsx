// Главное меню: продолжить или начать игру, испытание дня, достижения, настройки.
// При первом заходе за день показывается ежедневная награда.

import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DailyRewardModal } from '../components/DailyRewardModal';
import { CalendarIcon, GearIcon, PlayIcon, TrophyIcon } from '../components/Icons';
import { Mascot } from '../components/Mascot';
import { SpaceBackground } from '../components/SpaceBackground';
import { useToast } from '../components/Toast';
import { CoinBadge, JellyButton } from '../components/ui';
import { haptic } from '../feedback/haptics';
import { playSound } from '../feedback/sounds';
import type { GameState } from '../game';
import { ACHIEVEMENTS, unlockAchievements } from '../progress/achievements';
import { challengeBestToday, claimDaily, nextDailyDay } from '../progress/daily';
import { useProfile } from '../progress/ProfileContext';
import { colors, fonts } from '../theme';

type Props = {
  /** Незаконченная обычная партия (если есть) — для кнопки «Продолжить». */
  saved: GameState | null;
  onContinue: () => void;
  onNewGame: () => void;
  onDaily: () => void;
  onAchievements: () => void;
  onSettings: () => void;
};

export function MenuScreen({ saved, onContinue, onNewGame, onDaily, onAchievements, onSettings }: Props) {
  const { profile, update } = useProfile();
  const toast = useToast();
  const [dailyDay, setDailyDay] = useState<number | null>(() => nextDailyDay(profile));

  const claim = () => {
    const r = claimDaily(profile);
    setDailyDay(null);
    if (!r) return;
    playSound('booster');
    haptic.win();
    const ach = unlockAchievements(r.profile, { dailyStreak: r.day });
    update(() => ach.profile);
    for (const a of ach.unlocked) {
      toast.show({
        title: `Достижение: ${a.title}`,
        subtitle: `+${a.reward} монет`,
        icon: <TrophyIcon color={colors.gold} />,
      });
    }
  };

  const canContinue = saved !== null && !saved.gameOver;
  const todayBest = challengeBestToday(profile);

  return (
    <View style={styles.root}>
      <SpaceBackground />
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <View style={styles.best}>
            <Text style={styles.bestLabel}>РЕКОРД</Text>
            <Text style={styles.bestValue}>{profile.bestScore}</Text>
          </View>
          <CoinBadge coins={profile.coins} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
            <Mascot mood="idle" size={120} />
            <Text style={styles.title}>Cosmic Jelly</Text>
            <Text style={styles.subtitle}>соединяй желе — собери 2048</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.buttons}>
            {canContinue && (
              <JellyButton
                title="Продолжить"
                subtitle={`Счёт: ${saved.score}`}
                icon={<PlayIcon />}
                onPress={onContinue}
              />
            )}
            <JellyButton
              title="Новая игра"
              icon={canContinue ? undefined : <PlayIcon />}
              variant={canContinue ? 'ghost' : 'primary'}
              onPress={onNewGame}
            />
            <JellyButton
              title="Испытание дня"
              subtitle={todayBest > 0 ? `Лучший сегодня: ${todayBest}` : 'Одинаковые плитки у всех игроков'}
              icon={<CalendarIcon color="#3a1e00" />}
              variant="gold"
              onPress={onDaily}
            />
            <View style={styles.row}>
              <JellyButton
                title="Достижения"
                subtitle={`${profile.achievements.length} из ${ACHIEVEMENTS.length}`}
                icon={<TrophyIcon />}
                variant="ghost"
                onPress={onAchievements}
                style={styles.half}
              />
              <JellyButton
                title="Настройки"
                icon={<GearIcon />}
                variant="ghost"
                onPress={onSettings}
                style={styles.half}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {dailyDay !== null && <DailyRewardModal day={dailyDay} onClaim={claim} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.skyTop },
  safe: { flex: 1, alignItems: 'center' },
  topBar: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  best: { alignItems: 'flex-start' },
  bestLabel: { color: colors.textSoft, fontFamily: fonts.text, fontSize: 12, letterSpacing: 1 },
  bestValue: { color: colors.text, fontFamily: fonts.number, fontSize: 22 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 28 },
  hero: { alignItems: 'center', gap: 4 },
  title: {
    fontFamily: fonts.title,
    fontSize: 46,
    color: colors.text,
    textShadowColor: colors.pink,
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
  },
  subtitle: { fontFamily: fonts.text, fontSize: 16, color: colors.textSoft },
  buttons: { gap: 14, width: '100%', maxWidth: 420, alignSelf: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1, paddingHorizontal: 10 },
});
