// Сохранение данных на устройстве (AsyncStorage; в браузере — localStorage).
// Все ошибки чтения/записи гасятся: игра должна работать, даже если хранилище недоступно.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isValidState, type GameState } from '../game';
import { dayKey } from '../progress/daily';
import { normalizeProfile, type Profile } from '../progress/profile';
import type { Settings } from '../settings/SettingsContext';

const KEYS = {
  profile: 'cj.profile.v1',
  settings: 'cj.settings.v1',
  classic: 'cj.game.classic.v1',
  daily: 'cj.game.daily.v1',
};

export type GameMode = 'classic' | 'daily';

async function readJson(key: string): Promise<unknown> {
  try {
    const s = await AsyncStorage.getItem(key);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Нет места или хранилище недоступно — просто не сохраняем.
  }
}

export async function loadProfile(): Promise<Profile> {
  return normalizeProfile(await readJson(KEYS.profile));
}

export function saveProfile(p: Profile) {
  return writeJson(KEYS.profile, p);
}

export async function loadSettings(): Promise<Partial<Settings>> {
  const raw = await readJson(KEYS.settings);
  if (!raw || typeof raw !== 'object') return {};
  const s = raw as Record<string, unknown>;
  const out: Partial<Settings> = {};
  for (const k of ['sound', 'music', 'haptics'] as const)
    if (typeof s[k] === 'boolean') out[k] = s[k] as boolean;
  return out;
}

export function saveSettings(s: Settings) {
  return writeJson(KEYS.settings, s);
}

/** Сохранённая партия. Для испытания дня — только если она сегодняшняя. */
export async function loadGame(mode: GameMode): Promise<GameState | null> {
  const raw = (await readJson(KEYS[mode])) as { date?: string; state?: unknown } | null;
  if (!raw || !isValidState(raw.state)) return null;
  if (mode === 'daily' && raw.date !== dayKey()) return null;
  return raw.state;
}

export function saveGame(mode: GameMode, state: GameState) {
  return writeJson(KEYS[mode], { date: dayKey(), state });
}

export async function clearGame(mode: GameMode) {
  try {
    await AsyncStorage.removeItem(KEYS[mode]);
  } catch {
    // игнорируем
  }
}

/** Полный сброс прогресса (из настроек). */
export async function resetAll() {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch {
    // игнорируем
  }
}
