// Работа с полем: создание, копирование, пустые клетки, проверка наличия ходов.

import { SIZE } from './constants';
import type { Grid } from './types';

export function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => null));
}

/** Копия поля (плитки неизменяемые, поэтому копируем только массивы). */
export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice());
}

export function emptyCells(grid: Grid): { row: number; col: number }[] {
  const out: { row: number; col: number }[] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!grid[r][c]) out.push({ row: r, col: c });
  return out;
}

export function tileCount(grid: Grid): number {
  return SIZE * SIZE - emptyCells(grid).length;
}

export function maxValue(grid: Grid): number {
  let m = 0;
  for (const row of grid) for (const t of row) if (t && t.value > m) m = t.value;
  return m;
}

/** Есть ли хоть один ход: пустая клетка или две одинаковые плитки рядом. */
export function hasMoves(grid: Grid): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const t = grid[r][c];
      if (!t) return true;
      if (c + 1 < SIZE && grid[r][c + 1]?.value === t.value) return true;
      if (r + 1 < SIZE && grid[r + 1][c]?.value === t.value) return true;
    }
  }
  return false;
}
