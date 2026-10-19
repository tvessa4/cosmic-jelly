// Игровой экран: космический фон, счёт, маскот Глип, поле 4×4, бустеры,
// окна паузы, победы и конца игры. Здесь же — звуки, вибрация, эффекты, монеты,
// достижения и автосохранение после каждого хода.
// Свайп распознаётся по всему экрану (в браузере — ещё и стрелки/WASD).
// Пока плитки едут, следующий свайп ждёт в очереди (максимум один).

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Board, type Burst } from '../components/Board';
import {
  BURST_MS,
  Confetti,
  CONFETTI_MS,
  FloatingText,
  FLOAT_MS,
  shakeSequence,
} from '../components/Effects';
import { GameOverPanel } from '../components/GameOverPanel';
import {
  CoinIcon,
  HammerIcon,
  PauseIcon,
  ShuffleIcon,
  StarIcon,
  TrophyIcon,
  UndoIcon,
} from '../components/Icons';
import { Mascot, type MascotMood } from '../components/Mascot';
import { PauseMenu } from '../components/PauseMenu';
import { SpaceBackground } from '../components/SpaceBackground';
import { SLIDE_MS, type DisplayTile } from '../components/TileView';
import { useToast } from '../components/Toast';
import { JellyButton } from '../components/ui';
import { haptic } from '../feedback/haptics';
import { playMerges, playSound } from '../feedback/sounds';
import {
  addBooster,
  emptyCells,
  hammer,
  maxValue,
  move,
  shuffle,
  undo,
  type Direction,
  type GameState,
  type Grid,
  type MoveResult,
} from '../game';
import { unlockAchievements, type ProgressEvent } from '../progress/achievements';
import { challengeBestToday, recordChallenge } from '../progress/daily';
import { BOOSTER_PRICES, coinsForScore, spendCoins, type Profile } from '../progress/profile';
import { useProfile } from '../progress/ProfileContext';
import { saveGame, type GameMode } from '../storage/storage';
import { colors, fonts } from '../theme';

/** Плитки поля → список для отрисовки. newId — плитка, которая мягко появится. */
function tilesFromGrid(grid: Grid, newId?: number): DisplayTile[] {
  const out: DisplayTile[] = [];
  grid.forEach((row, r) =>
    row.forEach((t, c) => {
      if (t) out.push({ id: t.id, value: t.value, row: r, col: c, kind: t.id === newId ? 'new' : 'normal' });
    }),
  );
  return out;
}

/** Направление свайпа по смещению пальца. */
function directionOf(dx: number, dy: number): Direction {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

/** Надпись за несколько слияний одним ходом. */
function comboLabel(merges: number): string | null {
  if (merges >= 4) return 'Cosmic!';
  if (merges === 3) return 'Awesome!';
  if (merges === 2) return 'Combo x2!';
  return null;
}

const HAPPY_LINES = ['Супер!', 'Вкусненько!', 'Ещё, ещё!', 'Вот это да!'];

/** Клавиши для игры в браузере. */
const KEY_DIRS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

/** Сколько пикселей нужно провести пальцем, чтобы засчитать свайп. */
const SWIPE_DISTANCE = 14;

type Floating = { key: number; text: string; color: string };

type Props = {
  mode: GameMode;
  initial: GameState;
  /** Создать новую партию этого режима (для испытания дня — с тем же сидом). */
  makeNewGame: () => GameState;
  onMenu: () => void;
};

export function GameScreen({ mode, initial, makeNewGame, onMenu }: Props) {
  const { profile, update } = useProfile();
  const toast = useToast();

  const [game, setGame] = useState<GameState>(initial);
  const [tiles, setTiles] = useState<DisplayTile[]>(() => tilesFromGrid(initial.grid));
  const [showWin, setShowWin] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hammerMode, setHammerMode] = useState(false);
  const [boardKey, setBoardKey] = useState(0); // меняется при новой партии, чтобы плитки не «переезжали» из старой

  // Эффекты
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [wobbles, setWobbles] = useState<Record<number, number>>({});
  const [combos, setCombos] = useState<Floating[]>([]);
  const [scorePops, setScorePops] = useState<Floating[]>([]);
  const [confetti, setConfetti] = useState<number | null>(null);
  const [happy, setHappy] = useState<string | null>(null);
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.get() }] }));

  // Ссылки (ref) нужны, чтобы очередь свайпов всегда видела самое свежее состояние.
  const gameRef = useRef(game);
  const profileRef = useRef(profile);
  const busy = useRef(false);
  const pending = useRef<Direction | null>(null);
  const swipeFired = useRef(false);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const happyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effectKey = useRef(1);
  // Итоги текущей партии
  const [coinsEarned, setCoinsEarned] = useState(0);
  const ended = useRef(initial.gameOver);
  const [bestAtStart, setBestAtStart] = useState(() =>
    mode === 'daily' ? challengeBestToday(profile) : profile.bestScore,
  );

  // Профиль в ref — чтобы изменения из обработчиков всегда строились от последней версии.
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  /** Изменить профиль и сразу запомнить новую версию в ref. */
  const changeProfile = (fn: (p: Profile) => Profile) => {
    const next = fn(profileRef.current);
    profileRef.current = next;
    update(() => next);
  };

  // Автосохранение: после каждого изменения партии.
  useEffect(() => {
    saveGame(mode, game);
  }, [mode, game]);

  const { width, height } = useWindowDimensions();
  const boardWidth = Math.min(width - 28, 440, height * 0.5);

  /** Показать новое состояние без анимации хода (отмена, бустеры, новая партия). */
  const commit = (state: GameState) => {
    // Сбрасываем незаконченную анимацию хода, чтобы игра никогда не «застряла» в занятом состоянии.
    if (moveTimer.current) clearTimeout(moveTimer.current);
    moveTimer.current = null;
    busy.current = false;
    pending.current = null;
    gameRef.current = state;
    setGame(state);
    setTiles(tilesFromGrid(state.grid));
  };

  /** Добавляет временный эффект и убирает его через ms миллисекунд. */
  function addTemp<T extends { key: number }>(set: (fn: (list: T[]) => T[]) => void, item: T, ms: number) {
    set((list) => [...list, item]);
    setTimeout(() => set((list) => list.filter((x) => x.key !== item.key)), ms);
  }

  const cheer = (text: string) => {
    if (happyTimer.current) clearTimeout(happyTimer.current);
    setHappy(text);
    happyTimer.current = setTimeout(() => setHappy(null), 1400);
  };

  const celebrate = () => {
    setConfetti(effectKey.current++);
    setTimeout(() => setConfetti(null), CONFETTI_MS);
  };

  /** Проверка достижений + уведомления о них. */
  const checkAchievements = (e: ProgressEvent) => {
    const r = unlockAchievements(profileRef.current, e);
    if (r.unlocked.length === 0) return;
    changeProfile(() => r.profile);
    for (const a of r.unlocked) {
      toast.show({
        title: `Достижение: ${a.title}`,
        subtitle: `${a.description} · +${a.reward} монет`,
        icon: <TrophyIcon color={colors.gold} />,
      });
    }
  };

  // Испытание дня засчитывается как сыгранное при первом входе.
  useEffect(() => {
    if (mode === 'daily') checkAchievements({ playedDaily: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только при открытии экрана
  }, []);

  /** Монеты, рекорды и достижения после хода. */
  const updateProgress = (result: MoveResult) => {
    const s = result.state;
    const prevScore = s.score - result.points;
    const coins = coinsForScore(prevScore, s.score);
    const tile = maxValue(s.grid);
    const p = profileRef.current;
    const newRecordTile = tile >= 128 && tile > p.bestTile;

    changeProfile((pr) => {
      let next: Profile = {
        ...pr,
        coins: pr.coins + coins,
        bestTile: Math.max(pr.bestTile, tile),
        bestScore: mode === 'classic' ? Math.max(pr.bestScore, s.score) : pr.bestScore,
      };
      if (mode === 'daily') next = recordChallenge(next, s.score);
      if (s.gameOver && !ended.current) next = { ...next, gamesPlayed: next.gamesPlayed + 1 };
      return next;
    });
    setCoinsEarned((c) => c + coins);
    if (s.gameOver) ended.current = true;

    if (newRecordTile && !result.justWon) {
      celebrate();
      toast.show({
        title: `Новая рекордная плитка: ${tile}!`,
        subtitle: 'Глип в восторге',
        icon: <StarIcon size={28} />,
      });
    }
    checkAchievements({ maxTile: tile, mergesInMove: result.merges.length, score: s.score });
  };

  /** Звуки, вибрация и эффекты после того, как плитки доехали. */
  const playMoveEffects = (result: MoveResult) => {
    const n = result.merges.length;
    if (n > 0) {
      playMerges(result.merges.map((m) => m.value));
      for (const m of result.merges) {
        addTemp(setBursts, { key: effectKey.current++, row: m.row, col: m.col, value: m.value }, BURST_MS);
      }
      addTemp(
        setScorePops,
        { key: effectKey.current++, text: `+${result.points}`, color: colors.gold },
        FLOAT_MS,
      );
      haptic.merge(n);
    } else {
      playSound('spawn');
      haptic.tap();
    }

    const label = comboLabel(n);
    if (label) {
      addTemp(
        setCombos,
        { key: effectKey.current++, text: label, color: n >= 3 ? colors.pink : colors.gold },
        FLOAT_MS,
      );
    }
    if (n >= 3) shakeX.set(shakeSequence());
    if (n >= 2 || result.merges.some((m) => m.value >= 128)) {
      cheer(label ?? HAPPY_LINES[result.state.moves % HAPPY_LINES.length]);
    }

    if (result.justWon) {
      playSound('win');
      haptic.win();
      celebrate();
    } else if (result.state.gameOver) {
      playSound('lose');
      haptic.lose();
    }
  };

  const runMove = (dir: Direction) => {
    const result = move(gameRef.current, dir);
    if (!result.moved) return; // ничего не сдвинулось — ход не засчитан

    busy.current = true;
    gameRef.current = result.state;
    playSound('swipe');

    // Фаза 1: все плитки (и те, что сольются) едут в свои клетки.
    setTiles(
      result.slides.map((s) => ({
        id: s.id,
        value: s.value,
        row: s.toRow,
        col: s.toCol,
        kind: s.consumed ? 'consumed' : 'normal',
      })),
    );

    // Фаза 2: слившиеся плитки получают новое число, новая плитка мягко появляется.
    moveTimer.current = setTimeout(() => {
      moveTimer.current = null;
      setTiles(tilesFromGrid(result.state.grid, result.spawned?.tile.id));
      setGame(result.state);
      busy.current = false;
      playMoveEffects(result);
      updateProgress(result);

      if (result.justWon || result.state.gameOver) {
        pending.current = null;
        if (result.justWon) setShowWin(true);
        return;
      }
      const next = pending.current;
      pending.current = null;
      if (next) runMove(next);
    }, SLIDE_MS);
  };

  const onSwipe = (dir: Direction) => {
    if (gameRef.current.gameOver) return;
    if (busy.current) {
      pending.current = dir; // в очереди держим только последний свайп
      return;
    }
    runMove(dir);
  };

  const overlayOpen = showWin || game.gameOver || paused;

  // Управление с клавиатуры (в браузере): стрелки и WASD.
  const onSwipeRef = useRef(onSwipe);
  useEffect(() => {
    onSwipeRef.current = onSwipe;
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || overlayOpen || hammerMode) return;
    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_DIRS[e.key] ?? KEY_DIRS[e.key.toLowerCase()];
      if (!dir) return;
      e.preventDefault();
      onSwipeRef.current(dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overlayOpen, hammerMode]);

  // Свайп срабатывает, как только палец прошёл SWIPE_DISTANCE, не дожидаясь, пока его отпустят.
  // Линтер думает, что ref читается во время отрисовки, но эти функции вызываются только при жестах.
  /* eslint-disable react-hooks/refs */
  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(!overlayOpen && !hammerMode)
    // Жест включается только после сдвига пальца на 10px — обычные нажатия на кнопки он не перехватывает.
    .activeOffsetX([-10, 10])
    .activeOffsetY([-10, 10])
    .onBegin(() => {
      swipeFired.current = false;
    })
    .onUpdate((e) => {
      if (swipeFired.current) return;
      if (Math.hypot(e.translationX, e.translationY) >= SWIPE_DISTANCE) {
        swipeFired.current = true;
        onSwipe(directionOf(e.translationX, e.translationY));
      }
    })
    .onEnd((e) => {
      // Очень короткий, но быстрый «щелчок» тоже засчитываем.
      if (swipeFired.current) return;
      if (Math.hypot(e.velocityX, e.velocityY) > 300) {
        swipeFired.current = true;
        onSwipe(directionOf(e.velocityX, e.velocityY));
      }
    });
  /* eslint-enable react-hooks/refs */

  const newGame = () => {
    setShowWin(false);
    setPaused(false);
    setHammerMode(false);
    setHappy(null);
    setBoardKey((k) => k + 1);
    setCoinsEarned(0);
    ended.current = false;
    setBestAtStart(mode === 'daily' ? challengeBestToday(profileRef.current) : profileRef.current.bestScore);
    commit(makeNewGame());
  };

  /** Применить бустер: звук, вибрация и новое состояние. */
  const applyBooster = (s: GameState | null) => {
    if (!s) return;
    playSound('booster');
    haptic.booster();
    commit(s);
  };

  /** Купить +1 бустер за монеты. */
  const buyBooster = (kind: keyof typeof BOOSTER_PRICES) => {
    const price = BOOSTER_PRICES[kind];
    const paid = spendCoins(profileRef.current, price);
    if (!paid) {
      haptic.lose();
      toast.show({
        title: 'Не хватает монет',
        subtitle: `Нужно ${price}. Монеты даются за очки и награды.`,
        icon: <CoinIcon size={28} />,
      });
      return;
    }
    changeProfile(() => paid);
    playSound('booster');
    haptic.booster();
    const s = addBooster(gameRef.current, kind);
    gameRef.current = s;
    setGame(s);
  };

  const onCellPress = (row: number, col: number) => {
    if (hammerMode) {
      const s = hammer(gameRef.current, row, col);
      if (!s) return;
      setHammerMode(false);
      applyBooster(s);
      return;
    }
    // Обычный тап по плитке — она покачивается, как желе.
    const t = gameRef.current.grid[row][col];
    if (!t) return;
    haptic.tap();
    setWobbles((w) => ({ ...w, [t.id]: (w[t.id] ?? 0) + 1 }));
  };

  const b = game.boosters;
  const canUndo = b.undo > 0 && game.previous !== null;
  const best =
    mode === 'daily'
      ? Math.max(challengeBestToday(profile), game.score)
      : Math.max(profile.bestScore, game.score);

  // Настроение и реплика маскота.
  const free = emptyCells(game.grid).length;
  let mood: MascotMood = 'idle';
  let message =
    game.moves === 0
      ? mode === 'daily'
        ? 'Испытание дня! Плитки у всех одинаковые'
        : 'Привет! Я Глип. Свайпай!'
      : 'Соединяй одинаковые!';
  if (game.gameOver) [mood, message] = ['sad', 'Эх… Ходов нет'];
  else if (showWin) [mood, message] = ['party', 'Ура! Ты собрал 2048!'];
  else if (hammerMode) [mood, message] = ['idle', 'Тапни по плитке, которую убрать'];
  else if (happy) [mood, message] = ['happy', happy];
  else if (free <= 2) [mood, message] = ['scared', 'Ой, тесновато…'];

  return (
    <View style={styles.root}>
      <SpaceBackground />
      <GestureDetector gesture={pan}>
        <SafeAreaView style={styles.screen}>
          <View style={styles.header}>
            <View style={styles.scoreBox}>
              <Text style={styles.label}>СЧЁТ</Text>
              <Text style={styles.score}>{game.score}</Text>
              <View style={styles.scorePop} pointerEvents="none">
                {scorePops.map((p) => (
                  <FloatingText key={p.key} text={p.text} color={p.color} size={18} rise={22} />
                ))}
              </View>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.label}>{mode === 'daily' ? 'ДНЯ' : 'РЕКОРД'}</Text>
              <Text style={styles.score}>{best}</Text>
            </View>
            <View style={styles.coinBox} accessibilityLabel={`Монеты: ${profile.coins}`}>
              <CoinIcon size={20} />
              <Text style={styles.coinText}>{profile.coins}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.pauseButton, pressed && styles.pressed]}
              onPress={() => {
                playSound('tap');
                haptic.tap();
                setHammerMode(false);
                setPaused(true);
              }}
              accessibilityLabel="Пауза"
            >
              <PauseIcon />
            </Pressable>
          </View>

          <Mascot mood={mood} message={message} />

          <View>
            <Animated.View style={shakeStyle}>
              <Board
                key={boardKey}
                tiles={tiles}
                width={boardWidth}
                hammerMode={hammerMode}
                bursts={bursts}
                wobbles={wobbles}
                onCellPress={onCellPress}
              />
            </Animated.View>
            <View style={styles.comboLayer} pointerEvents="none">
              {combos.map((c) => (
                <FloatingText key={c.key} text={c.text} color={c.color} size={38} rise={40} />
              ))}
            </View>
          </View>

          <View style={styles.boosters}>
            <BoosterButton
              icon={<UndoIcon />}
              label="Отмена"
              count={b.undo}
              price={BOOSTER_PRICES.undo}
              disabled={b.undo > 0 ? !canUndo : game.previous === null}
              onPress={() => applyBooster(undo(gameRef.current))}
              onBuy={() => buyBooster('undo')}
            />
            <BoosterButton
              icon={<HammerIcon />}
              label="Молоток"
              count={b.hammer}
              price={BOOSTER_PRICES.hammer}
              active={hammerMode}
              onPress={() => {
                playSound('tap');
                haptic.tap();
                setHammerMode((m) => !m);
              }}
              onBuy={() => buyBooster('hammer')}
            />
            <BoosterButton
              icon={<ShuffleIcon />}
              label="Перемешать"
              count={b.shuffle}
              price={BOOSTER_PRICES.shuffle}
              onPress={() => applyBooster(shuffle(gameRef.current))}
              onBuy={() => buyBooster('shuffle')}
            />
          </View>
        </SafeAreaView>
      </GestureDetector>

      {/* Окна лежат ВНЕ области свайпов, чтобы жесты не мешали нажимать кнопки. */}
      {showWin && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
          <StarIcon size={88} />
          <Text style={styles.overTitle}>2048!</Text>
          <Text style={styles.overText}>Глип в восторге! Можно играть дальше и собрать ещё больше.</Text>
          <JellyButton title="Продолжить" onPress={() => setShowWin(false)} style={styles.overButton} />
          <JellyButton title="В меню" variant="ghost" onPress={onMenu} style={styles.overButton} />
        </Animated.View>
      )}

      {game.gameOver && !showWin && (
        <GameOverPanel
          score={game.score}
          best={best}
          bestLabel={mode === 'daily' ? 'ЛУЧШИЙ ДНЯ' : 'РЕКОРД'}
          isNewBest={game.score > bestAtStart && game.score > 0}
          coinsEarned={coinsEarned}
          undoCount={b.undo}
          canUndo={canUndo}
          onUndo={() => applyBooster(undo(gameRef.current))}
          onRestart={newGame}
          onMenu={onMenu}
        />
      )}

      {paused && <PauseMenu onResume={() => setPaused(false)} onNewGame={newGame} onMenu={onMenu} />}

      {confetti !== null && <Confetti seed={confetti} />}
    </View>
  );
}

type BoosterProps = {
  icon: ReactNode;
  label: string;
  count: number;
  price: number;
  disabled?: boolean;
  active?: boolean;
  onPress: () => void;
  /** Когда бустеры закончились, нажатие покупает ещё один за монеты. */
  onBuy: () => void;
};

function BoosterButton({ icon, label, count, price, disabled, active, onPress, onBuy }: BoosterProps) {
  const empty = count <= 0;
  return (
    <Pressable
      onPress={empty ? onBuy : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.booster,
        active && styles.boosterActive,
        disabled && styles.boosterDisabled,
        pressed && styles.pressed,
      ]}
      accessibilityLabel={empty ? `${label}: купить за ${price} монет` : `${label}, осталось ${count}`}
    >
      {icon}
      <Text style={styles.boosterLabel}>{label}</Text>
      {empty ? (
        <View style={[styles.badge, styles.priceBadge]}>
          <CoinIcon size={14} />
          <Text style={styles.priceText}>{price}</Text>
        </View>
      ) : (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.skyTop },
  screen: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly' },
  header: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  scoreBox: {
    backgroundColor: colors.panel,
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 84,
  },
  scorePop: { position: 'absolute', top: -4, right: 6, left: 6, alignItems: 'center' },
  label: { color: colors.textSoft, fontSize: 12, fontFamily: fonts.text, letterSpacing: 1 },
  score: { color: colors.text, fontSize: 24, fontFamily: fonts.number },
  coinBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 54,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: colors.panel,
    borderColor: colors.panelBorder,
    borderWidth: 1,
  },
  coinText: { color: colors.gold, fontFamily: fonts.number, fontSize: 18 },
  pauseButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.panel,
    borderColor: colors.panelBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.95 }] },
  comboLayer: { position: 'absolute', top: '38%', left: 0, right: 0, alignItems: 'center' },
  boosters: { flexDirection: 'row', gap: 14 },
  booster: {
    width: 98,
    height: 84,
    borderRadius: 22,
    backgroundColor: colors.panel,
    borderColor: colors.panelBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boosterActive: { backgroundColor: colors.accent, borderColor: colors.gold },
  boosterDisabled: { opacity: 0.35 },
  boosterLabel: { color: colors.text, fontSize: 13, fontFamily: fonts.text, marginTop: 4 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 13, fontFamily: fonts.number },
  priceBadge: {
    flexDirection: 'row',
    gap: 3,
    backgroundColor: '#5a2fa8',
    borderColor: colors.gold,
    borderWidth: 1,
  },
  priceText: { color: colors.gold, fontSize: 12, fontFamily: fonts.number },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 28,
  },
  overTitle: { color: colors.text, fontSize: 36, fontFamily: fonts.title, textAlign: 'center' },
  overText: { color: colors.textSoft, fontSize: 17, fontFamily: fonts.text, textAlign: 'center' },
  overButton: { minWidth: 240 },
});
