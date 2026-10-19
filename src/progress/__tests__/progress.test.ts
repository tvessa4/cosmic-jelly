import { ACHIEVEMENTS, unlockAchievements } from '../achievements';
import {
  challengeBestToday,
  claimDaily,
  dayKey,
  daysBetween,
  DAILY_REWARDS,
  nextDailyDay,
  recordChallenge,
} from '../daily';
import { coinsForScore, defaultProfile, normalizeProfile, spendCoins } from '../profile';
import { addBooster, createGame, isValidState, move } from '../../game';

describe('монеты', () => {
  it('1 монета за каждые 100 очков', () => {
    expect(coinsForScore(0, 99)).toBe(0);
    expect(coinsForScore(0, 100)).toBe(1);
    expect(coinsForScore(180, 420)).toBe(3); // 1 → 4
    expect(coinsForScore(500, 300)).toBe(0); // счёт уменьшился (отмена) — монеты не отнимаем
  });

  it('потратить можно только то, что есть', () => {
    const p = { ...defaultProfile(), coins: 40 };
    expect(spendCoins(p, 30)!.coins).toBe(10);
    expect(spendCoins(p, 50)).toBeNull();
  });

  it('повреждённый профиль превращается в нормальный', () => {
    expect(normalizeProfile(null)).toEqual(defaultProfile());
    const p = normalizeProfile({ coins: -5, bestScore: 'x', achievements: ['tile_512', 3] });
    expect(p.coins).toBe(defaultProfile().coins);
    expect(p.bestScore).toBe(0);
    expect(p.achievements).toEqual(['tile_512']);
  });
});

describe('ежедневная награда', () => {
  it('ключ дня и разница дней', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
  });

  it('серия растёт день за днём и даёт всё больше монет', () => {
    let p = defaultProfile();
    const coins0 = p.coins;
    const days = ['2026-10-01', '2026-10-02', '2026-10-03'];
    days.forEach((d, i) => {
      const r = claimDaily(p, d)!;
      expect(r.day).toBe(i + 1);
      expect(r.reward).toBe(DAILY_REWARDS[i]);
      p = r.profile;
    });
    expect(p.coins).toBe(coins0 + 20 + 30 + 40);
  });

  it('второй раз за день забрать нельзя', () => {
    const p = claimDaily(defaultProfile(), '2026-10-01')!.profile;
    expect(claimDaily(p, '2026-10-01')).toBeNull();
    expect(nextDailyDay(p, '2026-10-01')).toBeNull();
  });

  it('пропуск дня сбрасывает серию', () => {
    let p = claimDaily(defaultProfile(), '2026-10-01')!.profile;
    p = claimDaily(p, '2026-10-02')!.profile;
    expect(claimDaily(p, '2026-10-04')!.day).toBe(1);
  });

  it('после 7-го дня награда остаётся максимальной', () => {
    const p = { ...defaultProfile(), daily: { lastClaim: '2026-10-09', streak: 9 } };
    const r = claimDaily(p, '2026-10-10')!;
    expect(r.day).toBe(10);
    expect(r.reward).toBe(150);
  });
});

describe('испытание дня', () => {
  it('хранит лучший счёт только за сегодня', () => {
    let p = recordChallenge(defaultProfile(), 500, '2026-10-01');
    p = recordChallenge(p, 300, '2026-10-01');
    expect(challengeBestToday(p, '2026-10-01')).toBe(500);
    expect(challengeBestToday(p, '2026-10-02')).toBe(0);
  });
});

describe('достижения', () => {
  it('все id разные', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it('плитка 1024 открывает 256, 512 и 1024 сразу и даёт монеты', () => {
    const p = defaultProfile();
    const r = unlockAchievements(p, { maxTile: 1024 });
    expect(r.unlocked.map((a) => a.id)).toEqual(['tile_256', 'tile_512', 'tile_1024']);
    expect(r.profile.coins).toBe(p.coins + 10 + 20 + 40);
  });

  it('уже открытое достижение не открывается повторно', () => {
    const once = unlockAchievements(defaultProfile(), { mergesInMove: 3 }).profile;
    const twice = unlockAchievements(once, { mergesInMove: 3 });
    expect(twice.unlocked).toHaveLength(0);
    expect(twice.profile).toBe(once);
  });

  it('комбо, счёт, испытание и серия', () => {
    const r = unlockAchievements(defaultProfile(), {
      mergesInMove: 4,
      score: 12000,
      playedDaily: true,
      dailyStreak: 7,
    });
    expect(r.unlocked.map((a) => a.id).sort()).toEqual(
      ['combo_3', 'combo_4', 'daily_first', 'score_10000', 'streak_7'].sort(),
    );
  });
});

describe('сохранение партии', () => {
  it('настоящая партия проходит проверку, мусор — нет', () => {
    const g = move(createGame(5), 'left').state;
    expect(isValidState(JSON.parse(JSON.stringify(g)))).toBe(true);
    expect(isValidState(null)).toBe(false);
    expect(isValidState({ grid: [[1]] })).toBe(false);
  });

  it('купленный бустер добавляется к партии', () => {
    const g = addBooster(createGame(1), 'hammer');
    expect(g.boosters.hammer).toBe(createGame(1).boosters.hammer + 1);
  });
});
