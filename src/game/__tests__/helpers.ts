// Помощники для тестов: поле удобно задавать массивом чисел (0 = пусто).
import { SIZE, createGame } from '..';
import type { Cell, GameState, Grid } from '..';

let idCounter = 1000;

/** Линия из чисел → линия плиток. */
export function lineFrom(values: number[]): Cell[] {
  return values.map((v) => (v ? { id: idCounter++, value: v } : null));
}

/** Строит поле 4×4 из массива рядов. Недостающее считается пустым. */
export function gridFrom(rows: number[][]): Grid {
  return Array.from({ length: SIZE }, (_, r) =>
    lineFrom(Array.from({ length: SIZE }, (_, c) => rows[r]?.[c] ?? 0)),
  );
}

/** Поле или линия → числа (0 = пусто). */
export function values(grid: Grid): number[][] {
  return grid.map((row) => row.map((t) => t?.value ?? 0));
}

export function lineValues(line: Cell[]): number[] {
  return line.map((t) => t?.value ?? 0);
}

/** Состояние партии с заданным полем. */
export function stateWith(rows: number[][], extra: Partial<GameState> = {}): GameState {
  return { ...createGame(1), grid: gridFrom(rows), ...extra };
}

export function countTiles(grid: Grid): number {
  return grid.flat().filter(Boolean).length;
}
