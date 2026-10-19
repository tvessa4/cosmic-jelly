// Собственные иконки игры (векторные, рисуются через react-native-svg).
// Все в сетке 24×24, линии со скруглёнными концами — в «мягком» стиле игры.

import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: 2.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
});

/** Отмена хода: изогнутая стрелка назад. */
export function UndoIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 4 L4 9 L9 14" {...stroke(color)} />
      <Path d="M4 9 H14.5 A5.5 5.5 0 0 1 14.5 20 H10" {...stroke(color)} />
    </Svg>
  );
}

/** Молоток: наклонённый боёк и рукоять. */
export function HammerIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G rotation={-45} origin="12, 12">
        <Rect x={5} y={2.5} width={14} height={6.5} rx={2} fill={color} />
        <Rect x={10.6} y={9} width={2.8} height={13} rx={1.4} fill={color} />
        <Rect x={7.5} y={4.4} width={9} height={1.6} rx={0.8} fill="#1a0b33" opacity={0.25} />
      </G>
    </Svg>
  );
}

/** Перемешать: две перекрещённые стрелки. */
export function ShuffleIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 7 H6.5 C11 7 13 17 17.5 17 H21" {...stroke(color)} />
      <Path d="M3 17 H6.5 C11 17 13 7 17.5 7 H21" {...stroke(color)} />
      <Path d="M18 4 L21 7 L18 10" {...stroke(color)} />
      <Path d="M18 14 L21 17 L18 20" {...stroke(color)} />
    </Svg>
  );
}

/** Новая игра: круговая стрелка. */
export function RestartIcon({ size = 26, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M20 12 A8 8 0 1 1 17.66 6.34" {...stroke(color)} />
      <Path d="M20 3.5 V8.5 H15" {...stroke(color)} />
    </Svg>
  );
}

/** Праздничная звезда для окна победы (вместо эмодзи). */
export function StarIcon({ size = 72, color = '#ffe08a' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.8 L14.7 8.6 L21 9.3 L16.3 13.6 L17.6 19.9 L12 16.7 L6.4 19.9 L7.7 13.6 L3 9.3 L9.3 8.6 Z"
        fill={color}
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Пауза: две скруглённые полоски. */
export function PauseIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={6} y={4.5} width={4.2} height={15} rx={2.1} fill={color} />
      <Rect x={13.8} y={4.5} width={4.2} height={15} rx={2.1} fill={color} />
    </Svg>
  );
}

/** Нота — музыка. */
export function MusicIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 18 V6 L19 4 V16" {...stroke(color)} />
      <Circle cx={6.5} cy={18} r={2.8} fill={color} />
      <Circle cx={16.5} cy={16} r={2.8} fill={color} />
    </Svg>
  );
}

/** Динамик — звуки. */
export function SoundIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 9.5 H7.5 L12 5.5 V18.5 L7.5 14.5 H4 Z"
        fill={color}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M15.5 9 Q17.5 12 15.5 15" {...stroke(color)} />
      <Path d="M18 6.5 Q22 12 18 17.5" {...stroke(color)} />
    </Svg>
  );
}

/** Телефон с волнами — вибрация. */
export function VibrateIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={8} y={4} width={8} height={16} rx={2.2} {...stroke(color)} />
      <Path d="M4.5 9 V15 M19.5 9 V15" {...stroke(color)} />
      <Path d="M2 10.5 V13.5 M22 10.5 V13.5" {...stroke(color)} />
    </Svg>
  );
}

/** Монета: золотой кружок со звёздочкой. */
export function CoinIcon({ size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10.5} fill="#ffb02e" />
      <Circle cx={12} cy={12} r={8} fill="#ffd76a" />
      <Path
        d="M12 6.5 L13.6 10.1 L17.4 10.4 L14.5 12.9 L15.4 16.6 L12 14.6 L8.6 16.6 L9.5 12.9 L6.6 10.4 L10.4 10.1 Z"
        fill="#ffb02e"
      />
      <Circle cx={8.5} cy={7.5} r={1.4} fill="#fff" opacity={0.7} />
    </Svg>
  );
}

/** Стрелка «назад». */
export function BackIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5 L8 12 L15 19" {...stroke(color)} strokeWidth={2.8} />
    </Svg>
  );
}

/** Кубок — достижения. */
export function TrophyIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 4 H17 V9 A5 5 0 0 1 7 9 Z" fill={color} />
      <Path d="M7 6 H4 Q4 11 8 11 M17 6 H20 Q20 11 16 11" {...stroke(color)} strokeWidth={2} />
      <Path d="M12 14 V18 M8 20 H16" {...stroke(color)} strokeWidth={2.6} />
    </Svg>
  );
}

/** Шестерёнка — настройки. */
export function GearIcon({ size = 24, color = '#fff' }: IconProps) {
  const teeth = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const x1 = 12 + Math.cos(a) * 7.5;
    const y1 = 12 + Math.sin(a) * 7.5;
    const x2 = 12 + Math.cos(a) * 10;
    const y2 = 12 + Math.sin(a) * 10;
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }).join(' ');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={teeth} stroke={color} strokeWidth={3.4} strokeLinecap="round" />
      <Circle cx={12} cy={12} r={7} fill={color} />
      <Circle cx={12} cy={12} r={2.8} fill="#2d1a52" />
    </Svg>
  );
}

/** Календарь — испытание дня. */
export function CalendarIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3.5} y={5} width={17} height={15} rx={3} {...stroke(color)} />
      <Path d="M3.5 10 H20.5 M8 3 V7 M16 3 V7" {...stroke(color)} />
      <Circle cx={12} cy={15} r={2.2} fill={color} />
    </Svg>
  );
}

/** Треугольник «играть». */
export function PlayIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 5 L19 12 L8 19 Z" fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

/** Замок — закрытое достижение. */
export function LockIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={5} y={10.5} width={14} height={10} rx={2.5} fill={color} />
      <Path d="M8 10.5 V8 A4 4 0 0 1 16 8 V10.5" {...stroke(color)} />
    </Svg>
  );
}
