// Генератор случайных чисел с «сидом» (mulberry32).
// Одинаковый сид → одинаковая последовательность плиток. Это нужно для ежедневного испытания:
// у всех игроков в один день выпадают одни и те же плитки.
// Функции чистые: состояние генератора хранится в GameState и передаётся явно.

/** Возвращает случайное число [0, 1) и новое состояние генератора. */
export function nextRandom(state: number): [number, number] {
  const s = (state + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}

/** Превращает строку (например, дату «2026-10-19») в число-сид (хэш FNV-1a). */
export function seedFromString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Сид ежедневного испытания по местной дате. */
export function dailySeed(date: Date = new Date()): number {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return seedFromString(`cosmic-jelly-${y}-${m}-${d}`);
}
