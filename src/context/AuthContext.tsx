import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type PilotCar = { id: string; model: string; engine: string; year: string; color: string; power: string; tune: string; exhaust: string; ignition: string };
export type Pilot = { id: string; name: string; surname: string; email: string; phone: string; photo: string | null; cars: PilotCar[]; activeCarId: string | null; address: string };
type Credentials = { email: string; password: string; remember: boolean; name?: string; surname?: string };
type Auth = { user: Pilot | null; loading: boolean; startupError: string; retry: () => Promise<void>; authenticate: (mode: 'login' | 'register', values: Credentials) => Promise<void>; update: (values: Partial<Omit<Pilot, 'id'>>) => Promise<void>; logout: () => Promise<void> };
const Context = createContext<Auth | null>(null);
const key = 'speedzone.session';
const api = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' && typeof window !== 'undefined' ? `http://${window.location.hostname}:3001` : 'http://127.0.0.1:3001');
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<Pilot | null>(null);
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState('');
  const token = useRef<string | null>(null);
  const request = useCallback(async (path: string, method = 'GET', body?: unknown) => {
    let response: Response;
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 15000);
    try { response = await fetch(`${api}${path}`, { method, credentials: 'include', signal: controller.signal, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token.current ? { Authorization: `Bearer ${token.current}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
    catch { throw new Error('Não foi possível conectar à API local. Inicie npm run api no computador e tente novamente.'); }
    finally { clearTimeout(timer); }
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && !path.startsWith('/auth/')) { setUser(null); token.current = null; if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(key); }
      throw Object.assign(new Error(data.error || 'Não foi possível concluir.'), { status: response.status });
    }
    return data;
  }, []);
  const restore = useCallback(async () => {
    try { if (Platform.OS !== 'web') token.current = await SecureStore.getItemAsync(key); const data = await request('/me'); setUser(data.user); }
    catch (error) { if ((error as { status?: number }).status !== 401) setStartupError((error as Error).message); }
    finally { setLoading(false); }
  }, [request]);
  // State is updated only after the asynchronous session request resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void restore(); }, [restore]);
  const retry = async () => { setLoading(true); setStartupError(''); await restore(); };
  const authenticate: Auth['authenticate'] = async (mode, values) => {
    const data = await request(`/auth/${mode}`, 'POST', values);
    if (Platform.OS !== 'web') { token.current = data.token; if (values.remember) await SecureStore.setItemAsync(key, data.token); else await SecureStore.deleteItemAsync(key); }
    setUser(data.user);
  };
  const update: Auth['update'] = async values => { const data = await request('/me', 'PATCH', values); setUser(data.user); };
  const logout = async () => { await request('/auth/logout', 'POST', {}); if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(key); token.current = null; setUser(null); };
  return <Context.Provider value={{ user, loading, startupError, retry, authenticate, update, logout }}>{children}</Context.Provider>;
}
export function useAuth() { const context = useContext(Context); if (!context) throw new Error('AuthProvider is required'); return context; }
