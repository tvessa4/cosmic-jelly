// Окно ежедневной награды: 7 дней подряд, сегодняшний день подсвечен.

import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { DAILY_REWARDS } from '../progress/daily';
import { colors, fonts } from '../theme';
import { CoinIcon } from './Icons';
import { GlipDrawing } from './Mascot';
import { JellyButton } from './ui';

type Props = { day: number; onClaim: () => void };

export function DailyRewardModal({ day, onClaim }: Props) {
  // День в недельной полосе: после 7-го дня подсвечиваем последний.
  const slot = Math.min(day, 7);
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
      <Animated.View entering={ZoomIn.duration(260)} style={styles.card}>
        <GlipDrawing mood="happy" blink={false} size={90} />
        <Text style={styles.title}>Ежедневная награда</Text>
        <Text style={styles.text}>
          {day > 1
            ? `${day}-й день подряд! Заходи завтра — будет ещё больше.`
            : 'Заходи каждый день — награда растёт!'}
        </Text>
        <View style={styles.days}>
          {DAILY_REWARDS.map((r, i) => {
            const n = i + 1;
            const today = n === slot;
            const past = n < slot;
            return (
              <View key={n} style={[styles.day, past && styles.dayPast, today && styles.dayToday]}>
                <Text style={[styles.dayLabel, today && styles.dayLabelToday]}>{n}</Text>
                <CoinIcon size={16} />
                <Text style={[styles.dayReward, today && styles.dayLabelToday]}>{r}</Text>
              </View>
            );
          })}
        </View>
        <JellyButton
          variant="gold"
          title={`Забрать +${DAILY_REWARDS[slot - 1]}`}
          icon={<CoinIcon size={24} />}
          onPress={onClaim}
          style={styles.button}
        />
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
    paddingHorizontal: 18,
    zIndex: 50,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(60,30,110,0.95)',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.gold,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  title: { fontFamily: fonts.title, fontSize: 26, color: colors.text, textAlign: 'center' },
  text: { fontFamily: fonts.text, fontSize: 15, color: colors.textSoft, textAlign: 'center' },
  days: { flexDirection: 'row', gap: 5, marginVertical: 8 },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dayPast: { opacity: 0.45 },
  dayToday: { backgroundColor: colors.accent, borderWidth: 1.5, borderColor: colors.gold },
  dayLabel: { fontFamily: fonts.number, fontSize: 13, color: colors.textSoft },
  dayLabelToday: { color: colors.text },
  dayReward: { fontFamily: fonts.number, fontSize: 12, color: colors.textSoft },
  button: { alignSelf: 'stretch', marginTop: 4 },
});
