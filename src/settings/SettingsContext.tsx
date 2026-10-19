// Настройки игрока: звук, музыка, вибрация. Сохраняются на устройстве.

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { setHapticsEnabled } from '../feedback/haptics';
import { setMusicEnabled, setSoundEnabled } from '../feedback/sounds';
import { loadSettings, saveSettings } from '../storage/storage';

export type Settings = { sound: boolean; music: boolean; haptics: boolean };

type Ctx = Settings & { toggle: (key: keyof Settings) => void };

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({ sound: true, music: true, haptics: true });
  const loaded = useRef(false);

  // Загружаем сохранённые настройки при запуске.
  useEffect(() => {
    loadSettings().then((saved) => {
      loaded.current = true;
      setSettings((s) => ({ ...s, ...saved }));
    });
  }, []);

  // Передаём настройки модулям звука и вибрации и сохраняем их.
  useEffect(() => setSoundEnabled(settings.sound), [settings.sound]);
  useEffect(() => setMusicEnabled(settings.music), [settings.music]);
  useEffect(() => setHapticsEnabled(settings.haptics), [settings.haptics]);
  useEffect(() => {
    if (loaded.current) saveSettings(settings);
  }, [settings]);

  const value = useMemo<Ctx>(
    () => ({ ...settings, toggle: (key) => setSettings((s) => ({ ...s, [key]: !s[key] })) }),
    [settings],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings нужно вызывать внутри SettingsProvider');
  return ctx;
}
