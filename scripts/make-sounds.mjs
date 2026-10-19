// Генератор звуков игры. Все звуки синтезируются математикой — никаких чужих файлов и лицензий.
// Запуск: node scripts/make-sounds.mjs  → файлы появятся в assets/sounds/

import { mkdirSync, writeFileSync } from 'node:fs';

const RATE = 22050; // частота дискретизации: для мягких звуков этого достаточно, а файлы меньше
const OUT = new URL('../assets/sounds/', import.meta.url);
mkdirSync(OUT, { recursive: true });

/** Записывает массив чисел [-1, 1] в моно WAV 16 бит. */
function writeWav(name, samples, peak = 0.8) {
  let max = 0;
  for (const s of samples) max = Math.max(max, Math.abs(s));
  const k = max > 0 ? peak / max : 1;
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s * k)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // моно
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  writeFileSync(new URL(name, OUT), Buffer.concat([h, data]));
}

const buf = (sec) => new Float32Array(Math.round(sec * RATE));

/** «Пузырёк»: синус, высота которого быстро растёт, с мягким затуханием. */
function bubble(out, start, freq, { dur = 0.18, rise = 1.7, amp = 1 } = {}) {
  let phase = 0;
  const n = Math.round(dur * RATE);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const f = freq * (1 + (rise - 1) * (1 - Math.exp(-t * 40)));
    phase += (2 * Math.PI * f) / RATE;
    const env = Math.min(1, t / 0.004) * Math.exp(-t * 22);
    const v = (Math.sin(phase) + 0.25 * Math.sin(2 * phase)) * env * amp;
    const j = start + i;
    if (j < out.length) out[j] += v;
  }
}

// Слияние: 12 ступеней, каждая на тон выше. Чем больше плитка/цепочка — тем выше звук.
for (let step = 0; step < 12; step++) {
  const s = buf(0.22);
  bubble(s, 0, 330 * 2 ** ((step * 2) / 12));
  writeWav(`pop${step}.wav`, s, 0.75);
}

// Свайп: короткий мягкий «шорох» (шум через фильтр).
{
  const s = buf(0.09);
  let lp = 0;
  let seed = 1;
  for (let i = 0; i < s.length; i++) {
    seed = (seed * 16807) % 2147483647;
    const noise = (seed / 2147483647) * 2 - 1;
    const t = i / s.length;
    lp += (noise - lp) * (0.05 + 0.15 * t);
    s[i] = lp * Math.sin(Math.PI * t);
  }
  writeWav('swipe.wav', s, 0.25);
}

// Появление новой плитки: очень тихий «плип».
{
  const s = buf(0.08);
  bubble(s, 0, 900, { dur: 0.08, rise: 1.25 });
  writeWav('spawn.wav', s, 0.18);
}

// Нажатие кнопки.
{
  const s = buf(0.06);
  bubble(s, 0, 620, { dur: 0.06, rise: 1.3 });
  writeWav('tap.wav', s, 0.35);
}

// Бустер: два быстрых пузырька вверх.
{
  const s = buf(0.25);
  bubble(s, 0, 520);
  bubble(s, Math.round(0.07 * RATE), 780);
  writeWav('booster.wav', s, 0.6);
}

// Победа: арпеджио до-ми-соль-до + блёстки.
{
  const s = buf(1.2);
  [523, 659, 784, 1047].forEach((f, i) =>
    bubble(s, Math.round(i * 0.11 * RATE), f, { dur: 0.35, rise: 1.15 }),
  );
  [1568, 2093, 1760, 2349].forEach((f, i) =>
    bubble(s, Math.round((0.5 + i * 0.09) * RATE), f, { dur: 0.25, rise: 1.05, amp: 0.35 }),
  );
  writeWav('win.wav', s, 0.7);
}

// Проигрыш: мягкое нисходящее соль-ми-до.
{
  const s = buf(0.9);
  [392, 330, 262].forEach((f, i) => bubble(s, Math.round(i * 0.18 * RATE), f, { dur: 0.4, rise: 0.92 }));
  writeWav('lose.wav', s, 0.55);
}

// Музыка: спокойный «космический» эмбиент на 24 секунды, зациклен без шва.
{
  const SEC = 24;
  const s = buf(SEC);
  const N = s.length;
  const add = (i, v) => (s[((i % N) + N) % N] += v); // запись по кругу → бесшовная петля
  const chords = [
    [220.0, 261.63, 329.63, 392.0], // Am7
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
    [130.81, 196.0, 246.94, 329.63], // Cmaj7
    [196.0, 246.94, 293.66, 369.99], // Gmaj7-ish
  ];
  const seg = SEC / chords.length;
  chords.forEach((chord, ci) => {
    const start = Math.round(ci * seg * RATE);
    const len = Math.round((seg + 1.5) * RATE); // перекрытие с соседним аккордом
    for (const f of chord) {
      for (const detune of [-0.6, 0.6]) {
        const ff = f + detune;
        for (let i = 0; i < len; i++) {
          const t = i / len;
          const env = Math.sin(Math.PI * t) ** 2; // плавное нарастание и спад
          const lfo = 0.85 + 0.15 * Math.sin((2 * Math.PI * i) / RATE / 5);
          add(start + i, Math.sin((2 * Math.PI * ff * i) / RATE) * env * lfo * 0.06);
        }
      }
    }
  });
  // «Мерцание звёзд»: редкие нежные колокольчики пентатоники.
  const bells = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  let seed = 7;
  for (let t = 0.7; t < SEC; t += 1.5) {
    seed = (seed * 16807) % 2147483647;
    const f = bells[seed % bells.length];
    const st = Math.round(t * RATE);
    const n = Math.round(2.2 * RATE);
    for (let i = 0; i < n; i++) {
      const tt = i / RATE;
      const env = Math.min(1, tt / 0.01) * Math.exp(-tt * 2.2);
      add(
        st + i,
        (Math.sin(2 * Math.PI * f * tt) + 0.3 * Math.sin(2 * Math.PI * f * 2.01 * tt)) * env * 0.05,
      );
    }
  }
  writeWav('music.wav', s, 0.45);
}

console.log('Готово: звуки в assets/sounds/');
