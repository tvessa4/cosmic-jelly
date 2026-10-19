// Маленький значок в углу плитки. У каждого значения свой — так плитки различимы
// даже без цвета (для людей с дальтонизмом).

import { memo } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { PatternName } from '../design/palette';

type Props = { name: PatternName; size: number; color: string };

function Shape({ name, color }: { name: PatternName; color: string }) {
  const line = {
    stroke: color,
    strokeWidth: 2.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  switch (name) {
    case 'dot':
      return <Circle cx={12} cy={12} r={4.5} fill={color} />;
    case 'twoDots':
      return (
        <>
          <Circle cx={7.5} cy={12} r={3.6} fill={color} />
          <Circle cx={16.5} cy={12} r={3.6} fill={color} />
        </>
      );
    case 'triangle':
      return (
        <Path d="M12 4.5 L20 19 H4 Z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth={1.5} />
      );
    case 'square':
      return <Rect x={5.5} y={5.5} width={13} height={13} rx={2.5} fill={color} />;
    case 'diamond':
      return <Path d="M12 3.5 L20.5 12 L12 20.5 L3.5 12 Z" fill={color} />;
    case 'ring':
      return <Circle cx={12} cy={12} r={6.5} {...line} strokeWidth={3} />;
    case 'plus':
      return <Path d="M12 5 V19 M5 12 H19" {...line} strokeWidth={3.4} />;
    case 'star':
      return (
        <Path
          d="M12 3 L14.6 9 L21 9.6 L16.2 13.8 L17.6 20.2 L12 16.9 L6.4 20.2 L7.8 13.8 L3 9.6 L9.4 9 Z"
          fill={color}
        />
      );
    case 'heart':
      return (
        <Path
          d="M12 20 C5 15 3 11.5 3 8.6 C3 6 5 4 7.5 4 C9.4 4 11 5.2 12 7 C13 5.2 14.6 4 16.5 4 C19 4 21 6 21 8.6 C21 11.5 19 15 12 20 Z"
          fill={color}
        />
      );
    case 'moon':
      return <Path d="M15.5 3.5 A8.5 8.5 0 1 0 20.5 15.5 A7 7 0 0 1 15.5 3.5 Z" fill={color} />;
    case 'crown':
      return (
        <Path
          d="M4 17.5 L3 7 L8.5 11 L12 4.5 L15.5 11 L21 7 L20 17.5 Z M4 19.5 H20"
          fill={color}
          stroke={color}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      );
    case 'bolt':
      return <Path d="M13.5 2.5 L5 13.5 H11 L10 21.5 L19 10 H13 Z" fill={color} />;
    case 'planet':
      return (
        <>
          <Circle cx={12} cy={12} r={5.5} fill={color} />
          <Path d="M2.5 15.5 C6 9.5 18 8 21.5 8.5" {...line} strokeWidth={2} />
        </>
      );
    case 'hexagon':
      return <Path d="M12 3 L19.8 7.5 V16.5 L12 21 L4.2 16.5 V7.5 Z" fill={color} />;
    case 'spiral':
      return (
        <Path
          d="M12 12 C12 10.5 14 10.5 14 12.2 C14 14.5 10 14.8 9.6 12 C9.2 8.6 14.4 7.8 16.3 10.6 C18.6 14 15.6 18.4 11.6 18 C6.6 17.6 5 12 7.2 8.2"
          {...line}
          strokeWidth={2.2}
        />
      );
    case 'sparkle':
      return (
        <Path
          d="M12 2.5 C12.8 8.5 15.5 11.2 21.5 12 C15.5 12.8 12.8 15.5 12 21.5 C11.2 15.5 8.5 12.8 2.5 12 C8.5 11.2 11.2 8.5 12 2.5 Z"
          fill={color}
        />
      );
    case 'infinity':
      return (
        <Path
          d="M12 12 C9.5 8 4 8 4 12 C4 16 9.5 16 12 12 C14.5 8 20 8 20 12 C20 16 14.5 16 12 12 Z"
          {...line}
          strokeWidth={2.4}
        />
      );
  }
}

export const TilePattern = memo(function TilePattern({ name, size, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Shape name={name} color={color} />
    </Svg>
  );
});
