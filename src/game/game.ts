// Главные действия игры: новая партия, ход свайпом, бустеры.
// Все функции чистые: получают состояние и возвращают НОВОЕ, старое не меняется.

import { FOUR_CHANCE, SIZE, START_BOOSTERS, START_TILES, WIN_VALUE } from './constants';
import { cloneGrid, emptyCells, emptyGrid, hasMoves, tileCount } from './grid';
import { slideLine } from './line';
import { nextRandom } from './rng';
import type { Direction, GameState, Grid, Merge, MoveResult, Slide, Tile } from './types';

/** Кладёт новую плитку (2 — 90%, 4 — 10%) в случайную пустую клетку. Меняет переданное поле. */
export function spawnTile(
  grid: Grid,
  rngState: number,
  id: number,
): { rngState: number; spawned: { tile: Tile; row: number; col: number } | null } {
  const empty = emptyCells(grid);
  if (empty.length === 0) return { rngState, spawned: null };
  const [r1, s1] = nextRandom(rngState);
  const [r2, s2] = nextRandom(s1);
  const cell = empty[Math.floor(r1 * empty.length)];
  const tile: Tile = { id, value: r2 < FOUR_CHANCE ? 4 : 2 };
  grid[cell.row][cell.col] = tile;
  return { rngState: s2, spawned: { tile, ...cell } };
}

/** Новая партия: пустое поле и 2 случайные плитки. seed — любое число (для испытания дня — dailySeed()). */
export function createGame(seed: number = Date.now()): GameState {
  const grid = emptyGrid();
  let rngState = seed >>> 0;
  let nextId = 1;
  for (let i = 0; i < START_TILES; i++) {
    rngState = spawnTile(grid, rngState, nextId++).rngState;
  }
  return {
    grid,
    score: 0,
    rngState,
    nextId,
    moves: 0,
    won: false,
    gameOver: false,
    boosters: { ...START_BOOSTERS },
    previous: null,
  };
}

/** Снимок состояния для «Отмены» (без истории и без бустеров — их отмена не возвращает). */
function snapshot(state: GameState): NonNullable<GameState['previous']> {
  const { previous: _p, boosters: _b, ...rest } = state;
  return rest;
}

/** Координаты i-й клетки k-й линии для каждого направления. Индекс 0 — край, к которому свайп. */
function cellOf(dir: Direction, line: number, i: number): { row: number; col: number } {
  switch (dir) {
    case 'left':
      return { row: line, col: i };
    case 'right':
      return { row: line, col: SIZE - 1 - i };
    case 'up':
      return { row: i, col: line };
    case 'down':
      return { row: SIZE - 1 - i, col: line };
  }
}

/**
 * Ход свайпом. Все плитки едут в сторону dir, одинаковые сливаются.
 * Если ничего не сдвинулось — moved: false и состояние не меняется (новой плитки нет).
 */
export function move(state: GameState, dir: Direction): MoveResult {
  const noMove: MoveResult = {
    state,
    moved: false,
    slides: [],
    merges: [],
    spawned: null,
    points: 0,
    justWon: false,
  };
  if (state.gameOver) return noMove;

  const grid = emptyGrid();
  const slides: Slide[] = [];
  const merges: Merge[] = [];
  let points = 0;
  let moved = false;

  for (let line = 0; line < SIZE; line++) {
    const cells = Array.from({ length: SIZE }, (_, i) => {
      const p = cellOf(dir, line, i);
      return state.grid[p.row][p.col];
    });
    const res = slideLine(cells);
    res.cells.forEach((t, i) => {
      const p = cellOf(dir, line, i);
      grid[p.row][p.col] = t;
    });
    for (const s of res.slides) {
      const from = cellOf(dir, line, s.from);
      const to = cellOf(dir, line, s.to);
      if (s.from !== s.to) moved = true;
      slides.push({
        id: s.id,
        value: s.value,
        fromRow: from.row,
        fromCol: from.col,
        toRow: to.row,
        toCol: to.col,
        consumed: s.consumed,
      });
    }
    for (const m of res.merges) {
      const p = cellOf(dir, line, m.index);
      merges.push({ id: m.id, consumedId: m.consumedId, row: p.row, col: p.col, value: m.value });
    }
    points += res.points;
  }

  if (!moved) return noMove;

  const { rngState, spawned } = spawnTile(grid, state.rngState, state.nextId);
  const justWon = !state.won && merges.some((m) => m.value >= WIN_VALUE);

  return {
    state: {
      ...state,
      grid,
      score: state.score + points,
      rngState,
      nextId: state.nextId + 1,
      moves: state.moves + 1,
      won: state.won || justWon,
      gameOver: !hasMoves(grid),
      previous: snapshot(state),
    },
    moved: true,
    slides,
    merges,
    spawned,
    points,
    justWon,
  };
}

/** Можно ли сделать хоть один ход (для проверки проигрыша снаружи). */
export function isGameOver(grid: Grid): boolean {
  return !hasMoves(grid);
}

/** «Отмена хода»: возвращает поле и счёт к состоянию до последнего действия. */
export function undo(state: GameState): GameState | null {
  if (!state.previous || state.boosters.undo <= 0) return null;
  return {
    ...state.previous,
    boosters: { ...state.boosters, undo: state.boosters.undo - 1 },
    previous: null,
  };
}

/** «Молоток»: убирает одну плитку. Последнюю плитку на поле убрать нельзя. */
export function hammer(state: GameState, row: number, col: number): GameState | null {
  if (state.boosters.hammer <= 0 || !state.grid[row]?.[col] || tileCount(state.grid) <= 1) return null;
  const grid = cloneGrid(state.grid);
  grid[row][col] = null;
  return {
    ...state,
    grid,
    gameOver: false, // появилась пустая клетка — ход точно есть
    boosters: { ...state.boosters, hammer: state.boosters.hammer - 1 },
    previous: snapshot(state),
  };
}

/** «Перемешать»: случайно переставляет плитки по всем 16 клеткам. Значения не меняются. */
export function shuffle(state: GameState): GameState | null {
  if (state.boosters.shuffle <= 0 || tileCount(state.grid) < 2) return null;
  const cells = state.grid.flat();
  let rngState = state.rngState;
  // Перемешивание Фишера — Йетса.
  for (let i = cells.length - 1; i > 0; i--) {
    const [r, s] = nextRandom(rngState);
    rngState = s;
    const j = Math.floor(r * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const grid: Grid = Array.from({ length: SIZE }, (_, r) => cells.slice(r * SIZE, r * SIZE + SIZE));
  return {
    ...state,
    grid,
    rngState,
    gameOver: !hasMoves(grid),
    boosters: { ...state.boosters, shuffle: state.boosters.shuffle - 1 },
    previous: snapshot(state),
  };
}

/** Добавляет бустер в текущую партию (например, купленный за монеты). */
export function addBooster(state: GameState, kind: keyof GameState['boosters'], amount = 1): GameState {
  return { ...state, boosters: { ...state.boosters, [kind]: state.boosters[kind] + amount } };
}

/** Проверяет сохранённую партию перед загрузкой: если файл повреждён — начнём новую. */
export function isValidState(raw: unknown): raw is GameState {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as GameState;
  const okGrid =
    Array.isArray(s.grid) &&
    s.grid.length === SIZE &&
    s.grid.every(
      (row) =>
        Array.isArray(row) &&
        row.length === SIZE &&
        row.every(
          (t) => t === null || (typeof t.id === 'number' && typeof t.value === 'number' && t.value >= 2),
        ),
    );
  return (
    okGrid &&
    typeof s.score === 'number' &&
    typeof s.rngState === 'number' &&
    typeof s.nextId === 'number' &&
    typeof s.boosters === 'object' &&
    s.boosters !== null
  );
}
