// Звуки и музыка. Файлы сгенерированы скриптом scripts/make-sounds.mjs.
// Звуки уважают беззвучный режим iPhone и не прерывают музыку из других приложений.

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const POPS = [
  require('../../assets/sounds/pop0.wav'),
  require('../../assets/sounds/pop1.wav'),
  require('../../assets/sounds/pop2.wav'),
  require('../../assets/sounds/pop3.wav'),
  require('../../assets/sounds/pop4.wav'),
  require('../../assets/sounds/pop5.wav'),
  require('../../assets/sounds/pop6.wav'),
  require('../../assets/sounds/pop7.wav'),
  require('../../assets/sounds/pop8.wav'),
  require('../../assets/sounds/pop9.wav'),
  require('../../assets/sounds/pop10.wav'),
  require('../../assets/sounds/pop11.wav'),
];

const EFFECTS = {
  swipe: require('../../assets/sounds/swipe.wav'),
  spawn: require('../../assets/sounds/spawn.wav'),
  tap: require('../../assets/sounds/tap.wav'),
  booster: require('../../assets/sounds/booster.wav'),
  win: require('../../assets/sounds/win.wav'),
  lose: require('../../assets/sounds/lose.wav'),
};

export type SoundName = keyof typeof EFFECTS;

let soundOn = true;
let musicOn = true;
let ready = false;
const effectPlayers: Partial<Record<SoundName, AudioPlayer>> = {};
const popPlayers: AudioPlayer[] = [];
let music: AudioPlayer | null = null;

/** Загружает все звуки. Вызывается один раз при старте приложения. */
export async function initSounds() {
  if (ready) return;
  ready = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
  } catch {
    // На некоторых платформах режим может быть недоступен — звуки всё равно работают.
  }
  for (const name of Object.keys(EFFECTS) as SoundName[]) {
    const p = createAudioPlayer(EFFECTS[name]);
    p.volume = name === 'swipe' || name === 'spawn' ? 0.5 : 0.8;
    effectPlayers[name] = p;
  }
  for (const src of POPS) {
    const p = createAudioPlayer(src);
    p.volume = 0.75;
    popPlayers.push(p);
  }
  music = createAudioPlayer(require('../../assets/sounds/music.wav'));
  music.loop = true;
  music.volume = 0.35;
  if (musicOn) music.play();
}

function restart(p: AudioPlayer | undefined) {
  if (!p) return;
  p.seekTo(0).catch(() => {});
  p.play();
}

export function playSound(name: SoundName) {
  if (soundOn) restart(effectPlayers[name]);
}

/**
 * Звуки слияний за один ход: «пузырьки» идут друг за другом,
 * и каждый следующий звучит выше (высота растёт и с номером в цепочке, и с размером плитки).
 */
export function playMerges(values: number[]) {
  if (!soundOn || values.length === 0) return;
  const sorted = [...values].sort((a, b) => a - b);
  sorted.forEach((v, k) => {
    const step = Math.max(0, Math.min(POPS.length - 1, Math.round(Math.log2(v)) - 2 + k));
    setTimeout(() => restart(popPlayers[step]), k * 70);
  });
}

export function setSoundEnabled(on: boolean) {
  soundOn = on;
}

export function setMusicEnabled(on: boolean) {
  musicOn = on;
  if (!music) return;
  if (on) music.play();
  else music.pause();
}

/** Приложение ушло в фон / вернулось — ставим музыку на паузу и продолжаем. */
export function onAppActive(active: boolean) {
  if (!music) return;
  if (active && musicOn) music.play();
  else music.pause();
}
