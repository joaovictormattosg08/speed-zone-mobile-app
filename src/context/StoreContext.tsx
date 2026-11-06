import { useCatalog } from './CatalogContext';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { loadStore, saveStore } from '../utils/storePersistence';
import { StartupStatus } from '../components/StartupStatus';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../theme/tokens';

export const DEMO_STOCK = 5;
type Store = { cart: Record<string, number>; add: (id: string, quantity?: number) => void; remove: (id: string) => void; removeItem: (id: string) => void; count: number; vehicle: string; setVehicle: (value: string) => void; favorites: string[]; toggleFavorite: (id: string) => void };
const StoreContext = createContext<Store | null>(null);
export function StoreProvider({ children }: PropsWithChildren) {
  const { products } = useCatalog();
  const { user } = useAuth();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(!user);
  const [storageError, setStorageError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const userId = user?.id;
  useEffect(() => {
    if (!userId || ready) return;
    let active = true;
    void loadStore(userId).then(saved => {
      if (!active) return;
      setCart(saved.cart); setFavorites(saved.favorites); setStorageError(''); setReady(true);
    }).catch(() => { if (active) setStorageError('Não foi possível recuperar seu carrinho e favoritos neste aparelho.'); });
    return () => { active = false; };
  }, [userId, attempt, ready]);
  useEffect(() => {
    if (!ready || !userId) return;
    let active = true;
    void saveStore(userId, { cart, favorites }).then(() => {
      if (active) setStorageError('');
    }).catch(() => {
      if (active) setStorageError('Não foi possível salvar suas alterações neste aparelho.');
    });
    return () => { active = false; };
  }, [cart, favorites, ready, userId, attempt]);
  const activeCar = user?.cars.find(car => car.id === user.activeCarId);
  const [selection, setSelection] = useState<{ project?: string; name: string } | null>(null);
  const vehicle = selection?.project === activeCar?.id && selection ? selection.name : activeCar?.model || 'Cadastre seu projeto em Conta';
  const setVehicle = (name: string) => setSelection({ project: activeCar?.id, name });
  const add = (id: string, quantity = 1) => {
    if (!products.some(product => product.id === id) || !Number.isInteger(quantity) || quantity < 1) return;
    setCart(previous => ({ ...previous, [id]: Math.min(products.find(p => p.id === id)?.stock ?? DEMO_STOCK, (previous[id] ?? 0) + quantity) }));
  };
  const remove = (id: string) => setCart(previous => { const next = { ...previous }; if (next[id] > 1) next[id]--; else delete next[id]; return next; });
  const removeItem = (id: string) => setCart(previous => { const next = { ...previous }; delete next[id]; return next; });
  const toggleFavorite = (id: string) => setFavorites(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
  if (!ready) return <StartupStatus title={storageError ? 'Não conseguimos recuperar seus itens' : 'Recuperando seus itens…'} message={storageError || 'Carregando carrinho e favoritos.'} onRetry={storageError ? () => { setStorageError(''); setAttempt(value => value + 1); } : undefined} />;
  return <StoreContext.Provider value={{ cart, add, remove, removeItem, count: Object.values(cart).reduce((a, b) => a + b, 0), vehicle, setVehicle, favorites, toggleFavorite }}><View style={{ flex: 1 }}>{!!storageError && <Pressable accessibilityRole="button" onPress={() => setAttempt(value => value + 1)} style={{ padding: 16, backgroundColor: colors.panel }}><Text style={{ color: colors.error }}>{storageError} Toque para tentar novamente.</Text></Pressable>}{children}</View></StoreContext.Provider>;
}
export function useStore() { const store = useContext(StoreContext); if (!store) throw new Error('StoreProvider is required'); return store; }
