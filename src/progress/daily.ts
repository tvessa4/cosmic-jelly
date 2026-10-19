// Ежедневная награда (7-дневная серия) и испытание дня.

import type { Profile } from './profile';

/** Награды за 1…7 день подряд. После 7-го дня серия продолжается с наградой 7-го дня. */
export const DAILY_REWARDS = [20, 30, 40, 50, 60, 80, 150];

/** Ключ дня по местному времени: 'ГГГГ-ММ-ДД'. */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Сколько календарных дней между двумя ключами дня (b − a). */
export function daysBetween(a: string, b: string): number {
  const toUtc = (k: string) => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

/** Какой день серии будет, если забрать награду сегодня (1…7+), или null — сегодня уже забрали. */
export function nextDailyDay(profile: Profile, today: string = dayKey()): number | null {
  const last = profile.daily.lastClaim;
  if (last === today) return null;
  if (last && daysBetween(last, today) === 1) return profile.daily.streak + 1;
  return 1; // первый раз или серия прервалась
}

export function rewardForDay(day: number): number {
  return DAILY_REWARDS[Math.min(day, DAILY_REWARDS.length) - 1];
}

/** Забрать ежедневную награду. null — если сегодня уже забрали. */
export function claimDaily(
  profile: Profile,
  today: string = dayKey(),
): { profile: Profile; reward: number; day: number } | null {
  const day = nextDailyDay(profile, today);
  if (day === null) return null;
  const reward = rewardForDay(day);
  return {
    profile: { ...profile, coins: profile.coins + reward, daily: { lastClaim: today, streak: day } },
    reward,
    day,
  };
}

/** Лучший счёт в испытании сегодня (0, если сегодня ещё не играли). */
export function challengeBestToday(profile: Profile, today: string = dayKey()): number {
  return profile.challenge.date === today ? profile.challenge.best : 0;
}

/** Обновляет лучший счёт испытания дня. */
export function recordChallenge(profile: Profile, score: number, today: string = dayKey()): Profile {
  const best = Math.max(challengeBestToday(profile, today), score);
  return { ...profile, challenge: { date: today, best } };
}
