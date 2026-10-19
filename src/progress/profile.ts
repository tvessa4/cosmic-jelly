// Прогресс игрока между партиями: монеты, рекорды, достижения, ежедневные награды.
// Чистые функции без UI и без хранилища — их легко тестировать.

export type Profile = {
  version: 1;
  coins: number;
  bestScore: number;
  /** Самая большая плитка за всё время. */
  bestTile: number;
  gamesPlayed: number;
  /** id открытых достижений. */
  achievements: string[];
  daily: {
    /** День последнего получения награды, 'ГГГГ-ММ-ДД'. */
    lastClaim: string | null;
    /** Сколько дней подряд забирали награду (1…). */
    streak: number;
  };
  challenge: {
    /** День испытания и лучший счёт в нём. */
    date: string | null;
    best: number;
  };
};

export function defaultProfile(): Profile {
  return {
    version: 1,
    coins: 50, // немного монет на старте, чтобы попробовать покупку бустеров
    bestScore: 0,
    bestTile: 0,
    gamesPlayed: 0,
    achievements: [],
    daily: { lastClaim: null, streak: 0 },
    challenge: { date: null, best: 0 },
  };
}

/** Безопасно «чинит» сохранённый профиль (например, после обновления игры). */
export function normalizeProfile(raw: unknown): Profile {
  const d = defaultProfile();
  if (!raw || typeof raw !== 'object') return d;
  const p = raw as Partial<Profile>;
  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback;
  return {
    version: 1,
    coins: num(p.coins, d.coins),
    bestScore: num(p.bestScore, 0),
    bestTile: num(p.bestTile, 0),
    gamesPlayed: num(p.gamesPlayed, 0),
    achievements: Array.isArray(p.achievements) ? p.achievements.filter((a) => typeof a === 'string') : [],
    daily: {
      lastClaim: typeof p.daily?.lastClaim === 'string' ? p.daily.lastClaim : null,
      streak: num(p.daily?.streak, 0),
    },
    challenge: {
      date: typeof p.challenge?.date === 'string' ? p.challenge.date : null,
      best: num(p.challenge?.best, 0),
    },
  };
}

/** Цены бустеров в монетах (покупка +1 штуки во время партии). */
export const BOOSTER_PRICES = { undo: 30, hammer: 50, shuffle: 50 } as const;

/** Монеты за очки: 1 монета за каждые 100 очков. Возвращает, сколько монет добавить при росте счёта. */
export function coinsForScore(oldScore: number, newScore: number): number {
  return Math.max(0, Math.floor(newScore / 100) - Math.floor(oldScore / 100));
}

/** Тратит монеты. null — если не хватает. */
export function spendCoins(profile: Profile, amount: number): Profile | null {
  if (profile.coins < amount) return null;
  return { ...profile, coins: profile.coins - amount };
}
