// Список достижений: открытые — яркие, закрытые — приглушённые с замочком.

import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CoinIcon, LockIcon, TrophyIcon } from '../components/Icons';
import { SpaceBackground } from '../components/SpaceBackground';
import { TilePattern } from '../components/TilePattern';
import { ScreenHeader } from '../components/ui';
import { tileStyle } from '../design/palette';
import { ACHIEVEMENTS, type Achievement } from '../progress/achievements';
import { useProfile } from '../progress/ProfileContext';
import { colors, fonts } from '../theme';

function Badge({ a, open }: { a: Achievement; open: boolean }) {
  if (a.tile) {
    const st = tileStyle(a.tile);
    return (
      <View style={[styles.badge, { backgroundColor: open ? st.color : 'rgba(255,255,255,0.1)' }]}>
        <TilePattern name={st.pattern} size={26} color={open ? st.text : colors.textSoft} />
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: open ? colors.accent : 'rgba(255,255,255,0.1)' }]}>
      <TrophyIcon size={26} color={open ? colors.gold : colors.textSoft} />
    </View>
  );
}

export function AchievementsScreen({ onBack }: { onBack: () => void }) {
  const { profile } = useProfile();
  const have = new Set(profile.achievements);

  return (
    <View style={styles.root}>
      <SpaceBackground />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Достижения" onBack={onBack} coins={profile.coins} />
        <Text style={styles.progress}>
          Открыто {profile.achievements.length} из {ACHIEVEMENTS.length}
        </Text>
        <FlatList
          data={ACHIEVEMENTS}
          keyExtractor={(a) => a.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const open = have.has(item.id);
            return (
              <View
                style={[styles.card, !open && styles.locked]}
                accessibilityLabel={`${item.title}. ${item.description}. ${open ? 'Открыто' : 'Закрыто'}`}
              >
                <Badge a={item} open={open} />
                <View style={styles.texts}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.desc}>{item.description}</Text>
                </View>
                {open ? (
                  <View style={styles.reward}>
                    <CoinIcon size={16} />
                    <Text style={styles.rewardText}>{item.reward}</Text>
                  </View>
                ) : (
                  <LockIcon color={colors.textSoft} />
                )}
              </View>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.skyTop },
  safe: { flex: 1, alignItems: 'center' },
  progress: { color: colors.textSoft, fontFamily: fonts.text, fontSize: 15, marginBottom: 8 },
  list: { width: '100%', maxWidth: 520 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.panel,
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
  },
  locked: { opacity: 0.55 },
  badge: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
  title: { color: colors.text, fontFamily: fonts.title, fontSize: 17 },
  desc: { color: colors.textSoft, fontFamily: fonts.text, fontSize: 13 },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rewardText: { color: colors.gold, fontFamily: fonts.number, fontSize: 15 },
});
