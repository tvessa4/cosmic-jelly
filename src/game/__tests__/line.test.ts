import { slideLine } from '..';
import { lineFrom, lineValues } from './helpers';

// Все примеры — для свайпа ВЛЕВО (край — индекс 0).
describe('сдвиг одной линии', () => {
  it.each([
    // примеры из задания
    [[2, 2, 2, 2], [4, 4, 0, 0], 8],
    [[2, 2, 4, 0], [4, 4, 0, 0], 4],
    [[4, 0, 4, 4], [8, 4, 0, 0], 8],
    // дополнительные случаи
    [[0, 0, 0, 2], [2, 0, 0, 0], 0],
    [[2, 2, 2, 0], [4, 2, 0, 0], 4],
    [[4, 4, 8, 8], [8, 16, 0, 0], 24],
    [[8, 4, 4, 0], [8, 8, 0, 0], 8], // новая 8 не сливается со старой 8 в этот же ход
    [[2, 0, 0, 2], [4, 0, 0, 0], 4],
    [[2, 4, 8, 16], [2, 4, 8, 16], 0],
    [[0, 0, 0, 0], [0, 0, 0, 0], 0],
  ])('%j → %j (+%i очков)', (input, expected, points) => {
    const res = slideLine(lineFrom(input));
    expect(lineValues(res.cells)).toEqual(expected);
    expect(res.points).toBe(points);
  });

  it('выживает плитка ближе к краю, вторая «въезжает» в неё и исчезает', () => {
    const line = lineFrom([0, 2, 0, 2]);
    const res = slideLine(line);
    expect(res.cells[0]?.id).toBe(line[1]!.id);
    expect(res.slides).toEqual([
      { id: line[1]!.id, value: 2, from: 1, to: 0, consumed: false },
      { id: line[3]!.id, value: 2, from: 3, to: 0, consumed: true },
    ]);
    expect(res.merges).toEqual([{ id: line[1]!.id, consumedId: line[3]!.id, index: 0, value: 4 }]);
  });
});
