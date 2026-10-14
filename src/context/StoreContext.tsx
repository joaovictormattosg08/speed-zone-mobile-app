import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { products } from '../data/products';
export const DEMO_STOCK = 5;
type Store = { cart: Record<string, number>; add: (id: string, quantity?: number) => void; remove: (id: string) => void; count: number; vehicle: string; setVehicle: (value: string) => void; favorites: string[]; toggleFavorite: (id: string) => void };
const StoreContext = createContext<Store | null>(null);
export function StoreProvider({ children }: PropsWithChildren) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [vehicle, setVehicle] = useState('VW Golf GTI MK7.5 2.0 TSI');
  const add = (id: string, quantity = 1) => {
    if (!products.some(product => product.id === id) || !Number.isInteger(quantity) || quantity < 1) return;
    setCart(previous => ({ ...previous, [id]: Math.min(DEMO_STOCK, (previous[id] ?? 0) + quantity) }));
  };
  const remove = (id: string) => setCart(previous => { const next = { ...previous }; if (next[id] > 1) next[id]--; else delete next[id]; return next; });
  const toggleFavorite = (id: string) => setFavorites(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
  return <StoreContext.Provider value={{ cart, add, remove, count: Object.values(cart).reduce((a, b) => a + b, 0), vehicle, setVehicle, favorites, toggleFavorite }}>{children}</StoreContext.Provider>;
}
export function useStore() { const store = useContext(StoreContext); if (!store) throw new Error('StoreProvider is required'); return store; }
