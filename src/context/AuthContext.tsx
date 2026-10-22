import { InventoryProduct } from '../data/inventory';
import { AdminOrder, AdminOverview } from '../data/admin';
import { Loyalty, LoyaltyCoupon } from '../data/loyalty';
import { DeliveryAddress } from '../utils/address';
import { SupportTicket, TicketDraft } from '../data/support';
import { ShippingChoice } from '../utils/cartPricing';
import { CheckoutDetails, Order, OrderStatus } from '../data/orders';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type PilotCar = { id: string; model: string; engine: string; year: string; color: string; power: string; tune: string; exhaust: string; ignition: string };
export type Pilot = { isAdmin?: boolean; deliveryAddress?: DeliveryAddress; id: string; name: string; surname: string; email: string; phone: string; photo: string | null; cars: PilotCar[]; activeCarId: string | null; address: string };
type Credentials = { email: string; password: string; remember: boolean; name?: string; surname?: string };
type Auth = { productRequest: (path: string, method?: string, body?: unknown) => Promise<{ products: InventoryProduct[]; product: InventoryProduct }>; listAdminOrders: () => Promise<AdminOrder[]>; changeOrderStatus: (id: string, status: OrderStatus, expectedStatus: OrderStatus) => Promise<Order>; getAdminOverview: () => Promise<AdminOverview>; getLoyalty: () => Promise<Loyalty>; redeemReward: (rewardId: string, requestKey: string) => Promise<LoyaltyCoupon>; listTickets: () => Promise<SupportTicket[]>; getTicket: (id: string) => Promise<SupportTicket>; createTicket: (draft: TicketDraft, requestKey: string) => Promise<SupportTicket>; updateTicket: (id: string, values: { text?: string; requestKey?: string; status?: 'open' | 'closed' }) => Promise<SupportTicket>; listOrders: () => Promise<Order[]>; placeOrder: (items: { id: string; quantity: number }[], coupon: string | null, requestKey: string, delivery: ShippingChoice, checkout?: CheckoutDetails) => Promise<Order>; user: Pilot | null; loading: boolean; startupError: string; retry: () => Promise<void>; authenticate: (mode: 'login' | 'register', values: Credentials) => Promise<void>; update: (values: Partial<Omit<Pilot, 'id'>>) => Promise<void>; logout: () => Promise<void> };
const Context = createContext<Auth | null>(null);
const key = 'speedzone.session';
const api = (Platform.OS === 'android' ? process.env.EXPO_PUBLIC_ANDROID_API_URL : undefined)
  || process.env.EXPO_PUBLIC_API_URL
  || (Platform.OS === 'web' && typeof window !== 'undefined' ? `http://${window.location.hostname}:3001` : 'http://127.0.0.1:3001');
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<Pilot | null>(null);
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState('');
  const token = useRef<string | null>(null);
  const request = useCallback(async (path: string, method = 'GET', body?: unknown) => {
    let response: Response;
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 15000);
    try { response = await fetch(`${api}${path}`, { method, credentials: 'include', signal: controller.signal, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token.current ? { Authorization: `Bearer ${token.current}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
    catch { throw new Error(`Não foi possível conectar à API em ${api}. Confira se a API está rodando e se este endereço é acessível no dispositivo.`); }
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
  const update: Auth['update'] = async values => {
    const data = await request('/me', 'PATCH', values);
    if (values.deliveryAddress) {
      const saved = data.user?.deliveryAddress;
      const confirmed = saved && Object.entries(values.deliveryAddress).every(([key, value]) => saved[key] === value.trim());
      if (!confirmed) throw new Error('O servidor não confirmou o endereço. Reinicie a API com Ctrl+C e npm run api, depois toque em Salvar novamente. Seus campos continuam preenchidos.');
    }
    setUser(data.user);
  };
  const getLoyalty = useCallback(async (): Promise<Loyalty> => request('/loyalty'), [request]);
  const redeemReward = async (rewardId: string, requestKey: string): Promise<LoyaltyCoupon> => (await request('/loyalty/redeem', 'POST', { rewardId, requestKey })).coupon;
  const listAdminOrders = useCallback(async (): Promise<AdminOrder[]> => (await request('/admin/orders')).orders, [request]);
  const changeOrderStatus = async (id: string, status: OrderStatus, expectedStatus: OrderStatus): Promise<Order> => (await request('/admin/orders/' + encodeURIComponent(id), 'PATCH', { status, expectedStatus })).order;
  const getAdminOverview = useCallback(async (): Promise<AdminOverview> => request('/admin/overview'), [request]);
  const listOrders = useCallback(async (): Promise<Order[]> => (await request('/orders')).orders, [request]);
  const placeOrder = async (items: { id: string; quantity: number }[], coupon: string | null, requestKey: string, delivery: ShippingChoice, checkout?: CheckoutDetails): Promise<Order> => (await request('/orders', 'POST', { items, coupon, requestKey, delivery, checkout })).order;
  const listTickets = useCallback(async (): Promise<SupportTicket[]> => (await request('/support/tickets')).tickets, [request]);
  const getTicket = useCallback(async (id: string): Promise<SupportTicket> => (await request('/support/tickets/' + encodeURIComponent(id))).ticket, [request]);
  const createTicket = async (draft: TicketDraft, requestKey: string): Promise<SupportTicket> => (await request('/support/tickets', 'POST', { ...draft, requestKey })).ticket;
  const updateTicket = async (id: string, values: { text?: string; requestKey?: string; status?: 'open' | 'closed' }): Promise<SupportTicket> => (await request('/support/tickets/' + encodeURIComponent(id), 'PATCH', values)).ticket;
  const logout = async () => { await request('/auth/logout', 'POST', {}); if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(key); token.current = null; setUser(null); };
  return <Context.Provider value={{ productRequest: request, listAdminOrders, changeOrderStatus, getAdminOverview, getLoyalty, redeemReward, listTickets, getTicket, createTicket, updateTicket, listOrders, placeOrder, user, loading, startupError, retry, authenticate, update, logout }}>{children}</Context.Provider>;
}
export function useAuth() { const context = useContext(Context); if (!context) throw new Error('AuthProvider is required'); return context; }
