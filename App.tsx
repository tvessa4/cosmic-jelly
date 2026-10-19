// Корневой компонент: загружает шрифты, звуки и профиль, переключает экраны.
// Экранов немного, поэтому навигация сделана простым переключателем состояния —
// так игра одинаково работает и на телефоне, и как сайт (GitHub Pages / itch.io).

import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { AppState, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from './src/components/Toast';
import { initSounds, onAppActive } from './src/feedback/sounds';
import { createGame, dailySeed, type GameState } from './src/game';
import { ProfileProvider, useProfile } from './src/progress/ProfileContext';
import { AchievementsScreen } from './src/screens/AchievementsScreen';
import { GameScreen } from './src/screens/GameScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SplashIntro } from './src/screens/SplashIntro';
import { SettingsProvider } from './src/settings/SettingsContext';
import { loadGame, type GameMode } from './src/storage/storage';
import { colors } from './src/theme';

// Системная заставка остаётся на экране, пока не загрузятся шрифты.
SplashScreen.preventAutoHideAsync().catch(() => {});

type Screen =
  | { name: 'splash' }
  | { name: 'menu' }
  | { name: 'game'; mode: GameMode; initial: GameState; key: number }
  | { name: 'settings' }
  | { name: 'achievements' };

const newGameFor = (mode: GameMode) => (mode === 'daily' ? createGame(dailySeed()) : createGame());

function Navigator() {
  const { ready } = useProfile();
  const [screen, setScreen] = useState<Screen>({ name: 'splash' });
  const [saved, setSaved] = useState<GameState | null>(null);
  const [introDone, setIntroDone] = useState(false);

  // Сохранённая обычная партия — для кнопки «Продолжить».
  const refreshSaved = useCallback(() => {
    loadGame('classic').then(setSaved);
  }, []);
  useEffect(refreshSaved, [refreshSaved]);

  const onIntroDone = useCallback(() => setIntroDone(true), []);

  const toMenu = useCallback(() => {
    refreshSaved();
    setScreen({ name: 'menu' });
  }, [refreshSaved]);

  // В меню переходим, когда закончилась заставка И загрузился профиль (что бы ни случилось раньше).
  useEffect(() => {
    if (introDone && ready && screen.name === 'splash') toMenu();
  }, [introDone, ready, screen.name, toMenu]);

  const startGame = (mode: GameMode, initial: GameState) =>
    setScreen({ name: 'game', mode, initial, key: Date.now() });

  const openDaily = async () => {
    const s = await loadGame('daily');
    startGame('daily', s && !s.gameOver ? s : newGameFor('daily'));
  };

  switch (screen.name) {
    case 'splash':
      return <SplashIntro onDone={onIntroDone} />;
    case 'menu':
      return (
        <MenuScreen
          saved={saved}
          onContinue={() => saved && startGame('classic', saved)}
          onNewGame={() => startGame('classic', newGameFor('classic'))}
          onDaily={openDaily}
          onAchievements={() => setScreen({ name: 'achievements' })}
          onSettings={() => setScreen({ name: 'settings' })}
        />
      );
    case 'game':
      return (
        <GameScreen
          key={screen.key}
          mode={screen.mode}
          initial={screen.initial}
          makeNewGame={() => newGameFor(screen.mode)}
          onMenu={toMenu}
        />
      );
    case 'settings':
      return <SettingsScreen onBack={toMenu} onReset={toMenu} />;
    case 'achievements':
      return <AchievementsScreen onBack={toMenu} />;
  }
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  const fontsReady = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady]);

  useEffect(() => {
    initSounds();
    // Музыка ставится на паузу, когда приложение уходит в фон.
    const sub = AppState.addEventListener('change', (state) => onAppActive(state === 'active'));
    return () => sub.remove();
  }, []);

  if (!fontsReady) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <SettingsProvider>
          <ProfileProvider>
            <ToastProvider>
              <Navigator />
            </ToastProvider>
          </ProfileProvider>
        </SettingsProvider>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.skyTop } });
