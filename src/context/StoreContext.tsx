import { createContext, PropsWithChildren, useContext, useState } from 'react';
type Store = { cart: Record<string, number>; add: (id: string) => void; remove: (id: string) => void; count: number; vehicle: string; setVehicle: (value: string) => void };
const StoreContext = createContext<Store | null>(null);
export function StoreProvider({ children }: PropsWithChildren) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [vehicle, setVehicle] = useState('VW Golf GTI MK7.5 2.0 TSI');
  const add = (id: string) => setCart(previous => ({ ...previous, [id]: (previous[id] ?? 0) + 1 }));
  const remove = (id: string) => setCart(previous => { const next = { ...previous }; if (next[id] > 1) next[id]--; else delete next[id]; return next; });
  return <StoreContext.Provider value={{ cart, add, remove, count: Object.values(cart).reduce((a, b) => a + b, 0), vehicle, setVehicle }}>{children}</StoreContext.Provider>;
}
export function useStore() { const store = useContext(StoreContext); if (!store) throw new Error('StoreProvider is required'); return store; }
