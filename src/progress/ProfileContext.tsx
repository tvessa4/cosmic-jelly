// Профиль игрока в React: загрузка при запуске, автосохранение при каждом изменении.

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadProfile, resetAll, saveProfile } from '../storage/storage';
import { defaultProfile, type Profile } from './profile';

type Ctx = {
  profile: Profile;
  /** Профиль загружен из хранилища. */
  ready: boolean;
  /** Изменить профиль чистой функцией: update(p => ({ ...p, coins: p.coins + 10 })). */
  update: (fn: (p: Profile) => Profile) => void;
  resetProgress: () => Promise<void>;
};

const ProfileContext = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    loadProfile().then((p) => {
      loaded.current = true;
      setProfile(p);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (loaded.current) saveProfile(profile);
  }, [profile]);

  const value = useMemo<Ctx>(
    () => ({
      profile,
      ready,
      update: (fn) => setProfile(fn),
      resetProgress: async () => {
        await resetAll();
        setProfile(defaultProfile());
      },
    }),
    [profile, ready],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): Ctx {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile нужно вызывать внутри ProfileProvider');
  return ctx;
}
