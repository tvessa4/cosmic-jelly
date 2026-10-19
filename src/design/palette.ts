// Палитра плиток: у каждого из 17 значений (2 … 131072) свой цвет И свой значок-узор.
// Цвета подобраны так, чтобы соседние значения отличались и по оттенку, и по яркости,
// а значок помогает различать плитки людям с дальтонизмом.

export type PatternName =
  | 'dot'
  | 'twoDots'
  | 'triangle'
  | 'square'
  | 'diamond'
  | 'ring'
  | 'plus'
  | 'star'
  | 'heart'
  | 'moon'
  | 'crown'
  | 'bolt'
  | 'planet'
  | 'hexagon'
  | 'spiral'
  | 'sparkle'
  | 'infinity';

export type TileStyle = { color: string; text: string; pattern: PatternName };

const DARK = '#2a1546';
const LIGHT = '#ffffff';

/** Индекс = степень двойки − 1 (2 → 0, 4 → 1, … 131072 → 16). */
export const TILE_STYLES: TileStyle[] = [
  { color: '#ffd3ea', text: DARK, pattern: 'dot' }, // 2 — бледно-розовый
  { color: '#ffb59e', text: DARK, pattern: 'twoDots' }, // 4 — персиковый
  { color: '#ffe066', text: DARK, pattern: 'triangle' }, // 8 — сливочно-жёлтый
  { color: '#a8ef6b', text: DARK, pattern: 'square' }, // 16 — лайм
  { color: '#5ef0bd', text: DARK, pattern: 'diamond' }, // 32 — мята
  { color: '#5fd5ff', text: DARK, pattern: 'ring' }, // 64 — небесный
  { color: '#93a6ff', text: DARK, pattern: 'plus' }, // 128 — барвинок
  { color: '#c79bff', text: DARK, pattern: 'star' }, // 256 — лаванда
  { color: '#ff86e0', text: DARK, pattern: 'heart' }, // 512 — орхидея
  { color: '#ff5f8a', text: DARK, pattern: 'moon' }, // 1024 — малиновый
  { color: '#ffb02e', text: DARK, pattern: 'crown' }, // 2048 — золото
  { color: '#22c96e', text: DARK, pattern: 'bolt' }, // 4096 — неоновый зелёный
  { color: '#0fa3c4', text: DARK, pattern: 'planet' }, // 8192 — бирюза
  { color: '#3d63e8', text: LIGHT, pattern: 'hexagon' }, // 16384 — синий
  { color: '#7b3fe0', text: LIGHT, pattern: 'spiral' }, // 32768 — фиолетовый
  { color: '#c42fb8', text: LIGHT, pattern: 'sparkle' }, // 65536 — пурпур
  { color: '#f2f0ff', text: DARK, pattern: 'infinity' }, // 131072 — «звёздно-белый»
];

export function tileStyle(value: number): TileStyle {
  const i = Math.max(0, Math.round(Math.log2(value)) - 1);
  return TILE_STYLES[Math.min(i, TILE_STYLES.length - 1)];
}

// --- Цветовые помощники (чистые функции, покрыты тестами) ---

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return (
    '#' +
    [r, g, b]
      .map((v) =>
        Math.round(Math.max(0, Math.min(255, v)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

/** Смешивает цвет с белым (amount > 0) или чёрным (amount < 0). */
export function shade(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  const target = amount >= 0 ? 255 : 0;
  const k = Math.abs(amount);
  return toHex(rgb.map((v) => v + (target - v) * k) as [number, number, number]);
}

/** Цвет с прозрачностью в формате rgba(). */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Относительная яркость по WCAG. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Контраст двух цветов по WCAG (1…21). Для крупного жирного текста нужно не меньше 3. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
