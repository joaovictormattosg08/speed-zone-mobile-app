import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { statusLabels } from '../data/orderStatus';
import { useAuth } from './AuthContext';
import { useCatalog } from './CatalogContext';
import { useStore } from './StoreContext';

export type Notice = {
  id: string;
  kind: 'order' | 'support' | 'stock';
  target: string;
  title: string;
  detail: string;
  at: string;
};

type SavedNotices = {
  read: Record<string, true>;
  stock: Record<string, boolean>;
  restocks: Notice[];
};

const empty: SavedNotices = { read: {}, stock: {}, restocks: [] };
const Context = createContext<{ notices: Notice[]; read: SavedNotices['read']; markRead: (ids: string[]) => void }>({
  notices: [], read: {}, markRead: () => {},
});

export function NotificationProvider({ children }: PropsWithChildren) {
  const { user, listOrders, listTickets } = useAuth();
  const { favorites } = useStore();
  const { products, loading, error } = useCatalog();
  const [saved, setSaved] = useState<SavedNotices | null>(null);
  const [orders, setOrders] = useState<Notice[]>([]);
  const [support, setSupport] = useState<Notice[]>([]);
  const key = user ? `speedzone.notices.v1.${encodeURIComponent(user.id)}` : null;

  useEffect(() => {
    if (!key) return;
    let active = true;
    void AsyncStorage.getItem(key).then(raw => {
      if (active) setSaved(raw ? JSON.parse(raw) : empty);
    }).catch(() => { if (active) setSaved(empty); });
    return () => { active = false; };
  }, [key]);

  useEffect(() => {
    if (key && saved) void AsyncStorage.setItem(key, JSON.stringify(saved)).catch(() => {});
  }, [key, saved]);

  const storageReady = saved !== null;
  useEffect(() => {
    if (!storageReady || loading || error) return;
    const favoritesSet = new Set(favorites);
    const at = new Date().toISOString();
    // Record the transition from the last stored stock snapshot to the latest API snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(previous => {
      if (!previous) return previous;
      const stock = { ...previous.stock };
      const restocks: Notice[] = [];
      for (const id of Object.keys(stock)) {
        if (!favoritesSet.has(id)) delete stock[id];
      }
      for (const product of products) {
        if (!favoritesSet.has(product.id) || product.stock === undefined) continue;
        const available = product.stock > 0;
        if (stock[product.id] === false && available) {
          restocks.push({
            id: JSON.stringify(['stock', product.id, at]),
            kind: 'stock', target: product.id, title: 'Peça de volta ao estoque', detail: product.name, at,
          });
        }
        stock[product.id] = available;
      }
      if (JSON.stringify(stock) === JSON.stringify(previous.stock)) return previous;
      return { ...previous, stock, restocks: [...restocks, ...previous.restocks].slice(0, 50) };
    });
  }, [storageReady, favorites, products, loading, error]);

  useEffect(() => {
    if (!key) return;
    let active = true;
    let busy = false;
    async function refresh() {
      if (busy) return;
      busy = true;
      await Promise.allSettled([
        listOrders().then(data => {
          if (!active) return;
          setOrders(data.flatMap(order => (order.statusHistory ?? []).map((entry, index) => ({
            id: JSON.stringify(['order', order.id, index, entry.at]),
            kind: 'order', target: order.id, title: `Pedido ${order.id}`,
            detail: statusLabels[entry.to], at: entry.at,
          }))));
        }),
        listTickets().then(data => {
          if (!active) return;
          setSupport(data.flatMap(ticket => ticket.messages.filter(message => message.author === 'team').map(message => ({
            id: JSON.stringify(['support', ticket.id, message.id, message.actorId]),
            kind: 'support', target: ticket.id, title: 'Nova resposta do suporte',
            detail: `Chamado ${ticket.id}`, at: message.createdAt,
          }))));
        }),
      ]);
      busy = false;
    }
    void refresh();
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, 15000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { active = false; clearInterval(timer); subscription.remove(); };
  }, [key, listOrders, listTickets]);

  const notices = [...orders, ...support, ...(saved?.restocks ?? [])]
    .sort((a, b) => b.at.localeCompare(a.at));
  const markRead = (ids: string[]) => setSaved(previous => previous && ({
    ...previous, read: { ...previous.read, ...Object.fromEntries(ids.map(id => [id, true as const])) },
  }));
  return <Context.Provider value={{ notices: saved ? notices : [], read: saved?.read ?? {}, markRead }}>{children}</Context.Provider>;
}

export const useNotices = () => useContext(Context);
