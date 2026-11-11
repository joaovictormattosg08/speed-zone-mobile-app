import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ThemeColors } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';
const storageKey = 'speedzone.appearance.v1';
const ThemeContext = createContext({
  colors: darkColors as ThemeColors, mode: 'dark' as 'light' | 'dark',
  preference: 'system' as ThemePreference, setPreference: (_value: ThemePreference) => {},
  storageError: '',
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [preference, updatePreference] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then(value => {
      if (active && (value === 'light' || value === 'dark' || value === 'system')) updatePreference(value);
    }).catch(() => { if (active) setStorageError('Não foi possível recuperar a aparência salva.'); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const mode = preference === 'system' ? (system === 'light' ? 'light' : 'dark') : preference;
  const value = useMemo(() => ({
    colors: mode === 'dark' ? darkColors : lightColors, mode, preference, storageError,
    setPreference(next: ThemePreference) {
      updatePreference(next);
      writes.current = writes.current.then(() => AsyncStorage.setItem(storageKey, next))
        .then(() => setStorageError('')).catch(() => setStorageError('Tema aplicado, mas não foi possível salvar neste aparelho.'));
    },
  }), [mode, preference, storageError]);
  if (!ready) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
