// Поле 4×4: стеклянная панель с «лунками», плитки поверх и слой частиц.
// Поверх всего лежат прозрачные кнопки клеток: тап по плитке — покачивание,
// а в режиме «Молотка» — удаление плитки.

import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { tileStyle } from '../design/palette';
import { SIZE } from '../game';
import { colors } from '../theme';
import { ParticleBurst } from './Effects';
import { TileView, type DisplayTile } from './TileView';

export type Burst = { key: number; row: number; col: number; value: number };

type Props = {
  tiles: DisplayTile[];
  /** Ширина всего поля в пикселях. */
  width: number;
  hammerMode: boolean;
  bursts: Burst[];
  /** id плитки → счётчик касаний (каждое увеличение — новое покачивание). */
  wobbles: Record<number, number>;
  onCellPress: (row: number, col: number) => void;
};

/** Геометрия поля: отступ, размер клетки и шаг между клетками. */
export function boardGeometry(width: number) {
  const pad = Math.round(width * 0.03);
  const gap = Math.round(width * 0.028);
  const cell = (width - pad * 2 - gap * (SIZE - 1)) / SIZE;
  return { pad, gap, cell, step: cell + gap };
}

export const Board = memo(function Board({ tiles, width, hammerMode, bursts, wobbles, onCellPress }: Props) {
  const { pad, cell, step } = boardGeometry(width);
  const cells = Array.from({ length: SIZE * SIZE }, (_, i) => ({ row: Math.floor(i / SIZE), col: i % SIZE }));
  const slotRadius = Math.round(cell * 0.24);

  return (
    <View style={[styles.board, { width, height: width, padding: pad }, hammerMode && styles.hammer]}>
      <View style={styles.inner}>
        {cells.map(({ row, col }) => (
          <View
            key={`bg${row}-${col}`}
            style={[
              styles.slot,
              { width: cell, height: cell, left: col * step, top: row * step, borderRadius: slotRadius },
            ]}
          />
        ))}
        {tiles.map((t) => (
          <TileView key={t.id} tile={t} size={cell} step={step} wobble={wobbles[t.id] ?? 0} />
        ))}
        {bursts.map((b) => (
          <ParticleBurst
            key={b.key}
            x={b.col * step + cell / 2}
            y={b.row * step + cell / 2}
            color={tileStyle(b.value).color}
            radius={cell * 0.7}
          />
        ))}
        {cells.map(({ row, col }) => (
          <Pressable
            key={`hit${row}-${col}`}
            onPress={() => onCellPress(row, col)}
            style={[styles.hit, { width: cell, height: cell, left: col * step, top: row * step }]}
            accessibilityLabel={hammerMode ? `Убрать плитку: ряд ${row + 1}, столбец ${col + 1}` : undefined}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  board: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: colors.panelBorder,
  },
  hammer: { borderColor: colors.gold, borderWidth: 2.5 },
  inner: { flex: 1 },
  slot: {
    position: 'absolute',
    backgroundColor: colors.slot,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  hit: { position: 'absolute', zIndex: 10 },
});
