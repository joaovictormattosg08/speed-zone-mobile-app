import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { useStore } from './StoreContext';

export type CustomerNotification = { id: string; title: string; target: string; createdAt: string; read: boolean };
type Notifications = { items: CustomerNotification[]; loading: boolean; error: string; refresh: () => Promise<void>; markRead: (id: string) => Promise<void> };
const Context = createContext<Notifications | null>(null);
export function NotificationProvider({ children }: PropsWithChildren) {
  const { user, syncNotifications, readNotification } = useAuth();
  const { favorites } = useStore();
  const [items, setItems] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const current = ++generation.current;
    try {
      const next = await syncNotifications(favorites);
      if (generation.current === current) { setItems(next); setError(''); }
    } catch (cause) { if (generation.current === current) setError((cause as Error).message); }
    finally { if (generation.current === current) setLoading(false); }
  }, [user, favorites, syncNotifications]);
  useEffect(() => {
    const version = generation;
    // The request updates state after the API response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, 15000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { version.current++; clearInterval(timer); listener.remove(); };
  }, [refresh]);
  const markRead = async (id: string) => {
    try {
      await readNotification(id);
      generation.current++;
      setItems(previous => previous.map(item => id === 'all' || item.id === id ? { ...item, read: true } : item));
      setError('');
    } catch (cause) { setError((cause as Error).message); throw cause; }
  };
  return <Context.Provider value={{ items, loading, error, refresh, markRead }}>{children}</Context.Provider>;
}
export function useNotifications() {
  const value = useContext(Context);
  if (!value) throw new Error('NotificationProvider is required');
  return value;
}
