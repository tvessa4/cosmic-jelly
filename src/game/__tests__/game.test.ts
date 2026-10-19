import {
  START_BOOSTERS,
  createGame,
  dailySeed,
  hammer,
  hasMoves,
  isGameOver,
  move,
  nextRandom,
  shuffle,
  spawnTile,
  undo,
  emptyGrid,
} from '..';
import { countTiles, gridFrom, stateWith, values } from './helpers';

describe('новая партия', () => {
  it('на поле 2 плитки, бустеры выданы', () => {
    const g = createGame(42);
    expect(countTiles(g.grid)).toBe(2);
    for (const t of g.grid.flat()) if (t) expect([2, 4]).toContain(t.value);
    expect(g.boosters).toEqual(START_BOOSTERS);
    expect(g.score).toBe(0);
  });

  it('один и тот же сид даёт одинаковую партию', () => {
    let a = createGame(777);
    let b = createGame(777);
    const dirs = ['left', 'up', 'right', 'down'] as const;
    for (let i = 0; i < 50; i++) {
      a = move(a, dirs[i % 4]).state;
      b = move(b, dirs[i % 4]).state;
    }
    expect(values(a.grid)).toEqual(values(b.grid));
    expect(a.score).toBe(b.score);
  });
});

describe('ход свайпом', () => {
  it('влево: [2,2,2,2] → [4,4,_,_] и +8 очков', () => {
    const r = move(stateWith([[2, 2, 2, 2]]), 'left');
    expect(values(r.state.grid)[0].slice(0, 2)).toEqual([4, 4]);
    expect(r.points).toBe(8);
    expect(r.state.score).toBe(8);
  });

  it('вправо: слияние идёт с правого края', () => {
    const r = move(stateWith([[2, 2, 2, 0]]), 'right');
    expect(values(r.state.grid)[0].slice(2)).toEqual([2, 4]);
  });

  it('вверх и вниз работают по столбцам', () => {
    const rows = [[2], [2], [4], [0]];
    const up = move(stateWith(rows), 'up');
    expect(
      values(up.state.grid)
        .map((r) => r[0])
        .slice(0, 2),
    ).toEqual([4, 4]);
    const down = move(stateWith(rows), 'down');
    expect(
      values(down.state.grid)
        .map((r) => r[0])
        .slice(2),
    ).toEqual([4, 4]);
  });

  it('после хода появляется ровно одна новая плитка (2 или 4)', () => {
    const r = move(
      stateWith([
        [2, 2, 4, 0],
        [0, 0, 0, 8],
      ]),
      'left',
    );
    // было 4 плитки, одно слияние (−1), одна новая (+1)
    expect(countTiles(r.state.grid)).toBe(4);
    expect(r.spawned).not.toBeNull();
    expect([2, 4]).toContain(r.spawned!.tile.value);
    expect(r.state.grid[r.spawned!.row][r.spawned!.col]).toEqual(r.spawned!.tile);
    expect(r.state.moves).toBe(1);
  });

  it('ход без изменений не засчитывается и плитка не появляется', () => {
    const s = stateWith([
      [2, 4, 8, 16],
      [4, 0, 0, 0],
    ]);
    const r = move(s, 'left');
    expect(r.moved).toBe(false);
    expect(r.spawned).toBeNull();
    expect(r.state).toBe(s);
    expect(r.state.moves).toBe(0);
  });

  it('не меняет исходное состояние', () => {
    const s = stateWith([[2, 2]]);
    const before = values(s.grid);
    move(s, 'left');
    expect(values(s.grid)).toEqual(before);
  });

  it('описывает, куда уехала каждая плитка (для анимации)', () => {
    const s = stateWith([[0, 2, 0, 2]]);
    const r = move(s, 'left');
    const [a, b] = [s.grid[0][1]!.id, s.grid[0][3]!.id];
    expect(r.slides).toEqual(
      expect.arrayContaining([
        { id: a, value: 2, fromRow: 0, fromCol: 1, toRow: 0, toCol: 0, consumed: false },
        { id: b, value: 2, fromRow: 0, fromCol: 3, toRow: 0, toCol: 0, consumed: true },
      ]),
    );
    expect(r.merges).toEqual([{ id: a, consumedId: b, row: 0, col: 0, value: 4 }]);
  });
});

describe('новая плитка', () => {
  it('2 выпадает примерно в 90% случаев, 4 — в 10%', () => {
    let rng = 99;
    let fours = 0;
    const N = 5000;
    for (let i = 0; i < N; i++) {
      const g = emptyGrid();
      const r = spawnTile(g, rng, 1);
      rng = r.rngState;
      if (r.spawned!.tile.value === 4) fours++;
    }
    expect(fours / N).toBeGreaterThan(0.07);
    expect(fours / N).toBeLessThan(0.13);
  });

  it('на полном поле плитка не появляется', () => {
    const g = gridFrom([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(spawnTile(g, 1, 1).spawned).toBeNull();
  });
});

describe('победа 2048', () => {
  it('сообщает о первой 2048, игра продолжается', () => {
    const r = move(stateWith([[1024, 1024]]), 'left');
    expect(r.justWon).toBe(true);
    expect(r.state.won).toBe(true);
    expect(r.state.gameOver).toBe(false);
  });

  it('второй раз не празднует', () => {
    const r = move(stateWith([[1024, 1024]], { won: true }), 'left');
    expect(r.justWon).toBe(false);
  });
});

describe('проигрыш', () => {
  const STUCK = [
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
  ];

  it('полное поле без соседних одинаковых — ходов нет', () => {
    expect(hasMoves(gridFrom(STUCK))).toBe(false);
    expect(isGameOver(gridFrom(STUCK))).toBe(true);
    const s = stateWith(STUCK);
    for (const d of ['up', 'down', 'left', 'right'] as const) expect(move(s, d).moved).toBe(false);
  });

  it('полное поле с парой одинаковых — ход есть', () => {
    const rows = STUCK.map((r) => r.slice());
    rows[3][3] = 4; // рядом с 4 слева
    expect(hasMoves(gridFrom(rows))).toBe(true);
    expect(isGameOver(gridFrom(rows))).toBe(false);
  });

  it('ход, заполнивший поле без пар, ставит gameOver', () => {
    const s = stateWith([
      [0, 8, 16, 32],
      [64, 128, 256, 512],
      [8, 16, 32, 64],
      [128, 256, 512, 1024],
    ]);
    const r = move(s, 'left');
    expect(r.moved).toBe(true);
    // новая плитка (2 или 4) встаёт в (0,3), её соседи 32 и 512 — пар нет
    expect(r.spawned).toMatchObject({ row: 0, col: 3 });
    expect(r.state.gameOver).toBe(true);
    expect(move(r.state, 'right').moved).toBe(false);
  });
});

describe('бустеры', () => {
  it('отмена возвращает поле и счёт, тратит 1 из 3', () => {
    const s = stateWith([[2, 2]]);
    const after = move(s, 'left').state;
    const back = undo(after)!;
    expect(values(back.grid)).toEqual(values(s.grid));
    expect(back.score).toBe(0);
    expect(back.boosters.undo).toBe(START_BOOSTERS.undo - 1);
    expect(undo(back)).toBeNull(); // отменить можно только последнее действие
  });

  it('отмена недоступна, если бесплатные закончились', () => {
    const after = move(stateWith([[2, 2]]), 'left').state;
    expect(undo({ ...after, boosters: { ...after.boosters, undo: 0 } })).toBeNull();
  });

  it('отмена после проигрыша продолжает игру', () => {
    const s = stateWith([
      [0, 8, 16, 32],
      [64, 128, 256, 512],
      [8, 16, 32, 64],
      [128, 256, 512, 1024],
    ]);
    const over = move(s, 'left').state;
    expect(over.gameOver).toBe(true);
    expect(undo(over)!.gameOver).toBe(false);
  });

  it('молоток убирает плитку', () => {
    const s = stateWith([[2, 4]]);
    const r = hammer(s, 0, 1)!;
    expect(values(r.grid)[0]).toEqual([2, 0, 0, 0]);
    expect(r.boosters.hammer).toBe(START_BOOSTERS.hammer - 1);
    expect(undo(r)!.grid[0][1]?.value).toBe(4);
  });

  it('молоток не бьёт по пустой клетке и по последней плитке', () => {
    expect(hammer(stateWith([[2, 4]]), 2, 2)).toBeNull();
    expect(hammer(stateWith([[2]]), 0, 0)).toBeNull();
  });

  it('перемешивание сохраняет те же плитки', () => {
    const s = stateWith([
      [2, 4, 8],
      [16, 32],
    ]);
    const r = shuffle(s)!;
    const ids = (g: typeof s.grid) =>
      g
        .flat()
        .filter(Boolean)
        .map((t) => `${t!.id}:${t!.value}`)
        .sort();
    expect(ids(r.grid)).toEqual(ids(s.grid));
    expect(r.boosters.shuffle).toBe(START_BOOSTERS.shuffle - 1);
    expect(shuffle(r)).toBeNull(); // бесплатное перемешивание одно
  });
});

describe('генератор случайных чисел', () => {
  it('детерминирован и выдаёт числа в [0, 1)', () => {
    const [a] = nextRandom(42);
    expect(nextRandom(42)[0]).toBe(a);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
  });

  it('сид дня одинаков в течение дня и разный в разные дни', () => {
    expect(dailySeed(new Date(2026, 9, 19, 8))).toBe(dailySeed(new Date(2026, 9, 19, 23)));
    expect(dailySeed(new Date(2026, 9, 19))).not.toBe(dailySeed(new Date(2026, 9, 20)));
  });
});
