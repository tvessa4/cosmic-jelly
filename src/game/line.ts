// Сдвиг одной линии (ряда или столбца) — сердце игры 2048.

import type { Cell, Tile } from './types';

export type LineResult = {
  cells: Cell[];
  /** Для каждой исходной плитки: на какой индекс она уехала и исчезает ли. */
  slides: { id: number; value: number; from: number; to: number; consumed: boolean }[];
  merges: { id: number; consumedId: number; index: number; value: number }[];
  points: number;
};

/**
 * Сдвигает линию к индексу 0 (для свайпа влево индекс 0 — левый край).
 * Для других направлений вызывающий код сам разворачивает линию.
 *
 * Правила:
 * - плитки едут до упора;
 * - две одинаковые сливаются в одну с суммой;
 * - каждая плитка сливается за ход только ОДИН раз;
 * - слияние идёт со стороны края, к которому свайп: [2,2,2,_] → [4,2,_,_].
 *
 * Выжившей остаётся плитка, что ближе к краю (её id сохраняется), вторая «въезжает» в неё и исчезает.
 */
export function slideLine(line: Cell[]): LineResult {
  const out: Cell[] = [];
  const slides: LineResult['slides'] = [];
  const merges: LineResult['merges'] = [];
  let points = 0;
  let lastMerged = false; // слилась ли уже плитка, стоящая последней в out

  line.forEach((tile, from) => {
    if (!tile) return;
    const last = out[out.length - 1];
    if (last && !lastMerged && last.value === tile.value) {
      const index = out.length - 1;
      const merged: Tile = { id: last.id, value: last.value * 2 };
      out[index] = merged;
      slides.push({ id: tile.id, value: tile.value, from, to: index, consumed: true });
      merges.push({ id: last.id, consumedId: tile.id, index, value: merged.value });
      points += merged.value;
      lastMerged = true;
    } else {
      out.push(tile);
      slides.push({ id: tile.id, value: tile.value, from, to: out.length - 1, consumed: false });
      lastMerged = false;
    }
  });

  while (out.length < line.length) out.push(null);
  return { cells: out, slides, merges, points };
}
