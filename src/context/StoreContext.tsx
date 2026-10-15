import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { products } from '../data/products';
export const DEMO_STOCK = 5;
type Store = { cart: Record<string, number>; add: (id: string, quantity?: number) => void; remove: (id: string) => void; removeItem: (id: string) => void; count: number; vehicle: string; setVehicle: (value: string) => void; favorites: string[]; toggleFavorite: (id: string) => void };
const StoreContext = createContext<Store | null>(null);
export function StoreProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const activeCar = user?.cars.find(car => car.id === user.activeCarId);
  const [selection, setSelection] = useState<{ project?: string; name: string } | null>(null);
  const vehicle = selection?.project === activeCar?.id && selection ? selection.name : activeCar?.model || 'Cadastre seu projeto em Conta';
  const setVehicle = (name: string) => setSelection({ project: activeCar?.id, name });
  const add = (id: string, quantity = 1) => {
    if (!products.some(product => product.id === id) || !Number.isInteger(quantity) || quantity < 1) return;
    setCart(previous => ({ ...previous, [id]: Math.min(DEMO_STOCK, (previous[id] ?? 0) + quantity) }));
  };
  const remove = (id: string) => setCart(previous => { const next = { ...previous }; if (next[id] > 1) next[id]--; else delete next[id]; return next; });
  const removeItem = (id: string) => setCart(previous => { const next = { ...previous }; delete next[id]; return next; });
  const toggleFavorite = (id: string) => setFavorites(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
  return <StoreContext.Provider value={{ cart, add, remove, removeItem, count: Object.values(cart).reduce((a, b) => a + b, 0), vehicle, setVehicle, favorites, toggleFavorite }}>{children}</StoreContext.Provider>;
}
export function useStore() { const store = useContext(StoreContext); if (!store) throw new Error('StoreProvider is required'); return store; }
