import { TILE_STYLES, contrast, luminance, shade, tileStyle } from '../palette';

describe('палитра плиток', () => {
  it('17 значений: от 2 до 131072', () => {
    expect(TILE_STYLES).toHaveLength(17);
    expect(tileStyle(2)).toBe(TILE_STYLES[0]);
    expect(tileStyle(131072)).toBe(TILE_STYLES[16]);
    expect(tileStyle(262144)).toBe(TILE_STYLES[16]); // дальше — последний стиль
  });

  it('все цвета и все узоры разные', () => {
    expect(new Set(TILE_STYLES.map((s) => s.color)).size).toBe(17);
    expect(new Set(TILE_STYLES.map((s) => s.pattern)).size).toBe(17);
  });

  it('число на плитке читается (контраст ≥ 3:1 для крупного жирного текста)', () => {
    for (const s of TILE_STYLES) expect(contrast(s.color, s.text)).toBeGreaterThanOrEqual(3);
  });

  it('соседние значения заметно отличаются по цвету', () => {
    for (let i = 1; i < TILE_STYLES.length; i++) {
      const a = TILE_STYLES[i - 1].color;
      const b = TILE_STYLES[i].color;
      expect(a).not.toBe(b);
      // либо разная яркость, либо разный оттенок — проверяем хотя бы, что это не почти один цвет
      const dist = [1, 3, 5].reduce(
        (sum, k) => sum + Math.abs(parseInt(a.slice(k, k + 2), 16) - parseInt(b.slice(k, k + 2), 16)),
        0,
      );
      expect(dist).toBeGreaterThan(60);
    }
  });

  it('shade осветляет и затемняет', () => {
    expect(luminance(shade('#808080', 0.5))).toBeGreaterThan(luminance('#808080'));
    expect(luminance(shade('#808080', -0.5))).toBeLessThan(luminance('#808080'));
    expect(shade('#000000', 1)).toBe('#ffffff');
  });
});
