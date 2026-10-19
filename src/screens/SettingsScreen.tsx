// Настройки: звук, музыка, вибрация, «Об игре» и сброс прогресса.

import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsRows, settingsStyles } from '../components/PauseMenu';
import { SpaceBackground } from '../components/SpaceBackground';
import { JellyButton, ScreenHeader } from '../components/ui';
import { APP_VERSION } from '../config';
import { useProfile } from '../progress/ProfileContext';
import { colors, fonts } from '../theme';

export function SettingsScreen({ onBack, onReset }: { onBack: () => void; onReset: () => void }) {
  const { profile, resetProgress } = useProfile();
  const [confirm, setConfirm] = useState(false);

  return (
    <View style={styles.root}>
      <SpaceBackground />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Настройки" onBack={onBack} coins={profile.coins} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={settingsStyles.card}>
            <SettingsRows />
          </View>

          <View style={settingsStyles.card}>
            <Text style={styles.cardTitle}>Об игре</Text>
            <Text style={styles.text}>Cosmic Jelly · версия {APP_VERSION}</Text>
            <Text style={styles.text}>
              Классическая 2048 в космосе. Графика, маскот Глип, звуки и музыка созданы специально для этой
              игры.
            </Text>
            <Text style={styles.small}>
              Шрифты Fredoka и Nunito — SIL Open Font License 1.1.{'\n'}
              Код — лицензия MIT. Сделано с помощью Claude (Anthropic).
            </Text>
          </View>

          <View style={settingsStyles.card}>
            <Text style={styles.cardTitle}>Прогресс</Text>
            <Text style={styles.text}>
              Сыграно партий: {profile.gamesPlayed} · рекорд: {profile.bestScore} · лучшая плитка:{' '}
              {profile.bestTile || '—'}
            </Text>
            <JellyButton
              title={confirm ? 'Точно? Нажмите ещё раз' : 'Сбросить прогресс'}
              subtitle={confirm ? 'Монеты, рекорды и достижения удалятся' : undefined}
              variant="ghost"
              style={confirm ? styles.danger : undefined}
              onPress={async () => {
                if (!confirm) {
                  setConfirm(true);
                  return;
                }
                await resetProgress();
                setConfirm(false);
                onReset();
              }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.skyTop },
  safe: { flex: 1, alignItems: 'center' },
  content: { padding: 16, gap: 16, alignItems: 'center', paddingBottom: 40 },
  cardTitle: { fontFamily: fonts.title, fontSize: 20, color: colors.text },
  text: { fontFamily: fonts.text, fontSize: 15, color: colors.textSoft, lineHeight: 21 },
  small: { fontFamily: fonts.text, fontSize: 13, color: 'rgba(201,184,242,0.75)', lineHeight: 19 },
  danger: { borderColor: '#ff5f8a', backgroundColor: 'rgba(255,95,138,0.2)' },
});
