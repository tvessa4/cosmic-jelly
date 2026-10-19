// Типы данных игровой логики. Здесь нет ничего, связанного с UI.

/** Одна плитка. id нужен анимациям: по нему видно, какая плитка куда уехала. */
export type Tile = { id: number; value: number };

/** Клетка поля: плитка или пусто. */
export type Cell = Tile | null;

/** Поле: grid[ряд][столбец], ряд 0 — верхний, столбец 0 — левый. */
export type Grid = Cell[][];

export type Direction = 'up' | 'down' | 'left' | 'right';

export type Boosters = { undo: number; hammer: number; shuffle: number };

/** Полное состояние партии. Его можно целиком сохранить в AsyncStorage (это обычный JSON). */
export type GameState = {
  grid: Grid;
  score: number;
  /** Состояние генератора случайных чисел — для повторяемости (ежедневное испытание). */
  rngState: number;
  nextId: number;
  moves: number;
  /** Уже собрана плитка 2048 (празднование показывается один раз). */
  won: boolean;
  gameOver: boolean;
  boosters: Boosters;
  /** Снимок до последнего действия — для «Отмены хода». Сам снимок своей истории не хранит. */
  previous: Omit<GameState, 'previous' | 'boosters'> | null;
};

/** Куда уехала плитка за ход. consumed = плитка исчезнет, слившись с другой. */
export type Slide = {
  id: number;
  value: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  consumed: boolean;
};

/** Слияние: плитка id стала значением value в клетке (row, col). */
export type Merge = { id: number; consumedId: number; row: number; col: number; value: number };

/** Результат хода — всё, что нужно UI для анимации. */
export type MoveResult = {
  state: GameState;
  /** false — ничего не сдвинулось, ход не засчитан, состояние то же самое. */
  moved: boolean;
  slides: Slide[];
  merges: Merge[];
  spawned: { tile: Tile; row: number; col: number } | null;
  points: number;
  /** true только в тот ход, когда впервые собрали 2048. */
  justWon: boolean;
};
