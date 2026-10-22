import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { Product, products as seeds } from '../data/products';
const Context = createContext<{ products: Product[]; refresh: () => Promise<void> }>({ products: [], refresh: async () => {} });
export function CatalogProvider({ children }: PropsWithChildren) {
  const { productRequest } = useAuth();
  const [products, setProducts] = useState<Product[]>(seeds);
  const refresh = useCallback(async () => {
    const data = await productRequest('/products');
    setProducts(data.products.map(p => ({ ...seeds.find(seed => seed.id === p.id), ...p, image: p.images[0] ? { uri: p.images[0] } : seeds.find(seed => seed.id === p.id)?.image || {}, badge: p.stock ? 'EM ESTOQUE' : 'ESGOTADO', tone: '#164535', fit: p.platforms.join(' • ') || 'Consulte a aplicação' })));
  }, [productRequest]);
  useEffect(() => {
    // refresh updates state only after the API request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh().catch(() => {});
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refresh().catch(() => {}); }, 15000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh().catch(() => {}); });
    return () => { clearInterval(timer); listener.remove(); };
  }, [refresh]);
  return <Context.Provider value={{ products, refresh }}>{children}</Context.Provider>;
}
export const useCatalog = () => useContext(Context);
