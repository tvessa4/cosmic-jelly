// Достижения. Каждое открывается один раз и даёт монеты.

import type { Profile } from './profile';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  reward: number;
  /** Для «плиточных» достижений — значение плитки (для иконки). */
  tile?: number;
};

const TILE_TITLES: [number, string, number][] = [
  [256, 'Хорошее начало', 10],
  [512, 'Полтысячи', 20],
  [1024, 'Килобайт желе', 40],
  [2048, 'Легенда 2048', 100],
  [4096, 'Двойная звезда', 150],
  [8192, 'Туманность', 200],
  [16384, 'Галактика', 300],
  [32768, 'Сверхновая', 400],
  [65536, 'Чёрная дыра', 500],
  [131072, 'Бесконечность', 1000],
];

export const ACHIEVEMENTS: Achievement[] = [
  ...TILE_TITLES.map(([tile, title, reward]) => ({
    id: `tile_${tile}`,
    title,
    description: `Собрать плитку ${tile}`,
    reward,
    tile,
  })),
  { id: 'combo_3', title: 'Awesome!', description: '3 слияния за один ход', reward: 20 },
  { id: 'combo_4', title: 'Cosmic!', description: '4 слияния за один ход', reward: 50 },
  { id: 'score_10000', title: 'Звёздный счёт', description: 'Набрать 10 000 очков за партию', reward: 50 },
  { id: 'daily_first', title: 'Испытание принято', description: 'Сыграть в испытание дня', reward: 10 },
  { id: 'streak_7', title: 'Неделя с Глипом', description: 'Забирать награду 7 дней подряд', reward: 100 },
];

/** Что произошло в игре — по этому проверяются достижения. */
export type ProgressEvent = {
  maxTile?: number;
  mergesInMove?: number;
  score?: number;
  playedDaily?: boolean;
  dailyStreak?: number;
};

function satisfied(a: Achievement, e: ProgressEvent): boolean {
  if (a.tile) return (e.maxTile ?? 0) >= a.tile;
  switch (a.id) {
    case 'combo_3':
      return (e.mergesInMove ?? 0) >= 3;
    case 'combo_4':
      return (e.mergesInMove ?? 0) >= 4;
    case 'score_10000':
      return (e.score ?? 0) >= 10000;
    case 'daily_first':
      return e.playedDaily === true;
    case 'streak_7':
      return (e.dailyStreak ?? 0) >= 7;
    default:
      return false;
  }
}

/**
 * Проверяет событие и открывает новые достижения.
 * Возвращает обновлённый профиль (с монетами за награды) и список только что открытых.
 */
export function unlockAchievements(
  profile: Profile,
  e: ProgressEvent,
): { profile: Profile; unlocked: Achievement[] } {
  const have = new Set(profile.achievements);
  const unlocked = ACHIEVEMENTS.filter((a) => !have.has(a.id) && satisfied(a, e));
  if (unlocked.length === 0) return { profile, unlocked };
  return {
    profile: {
      ...profile,
      achievements: [...profile.achievements, ...unlocked.map((a) => a.id)],
      coins: profile.coins + unlocked.reduce((s, a) => s + a.reward, 0),
    },
    unlocked,
  };
}
