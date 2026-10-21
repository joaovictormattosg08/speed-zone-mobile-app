import { DeliveryAddress } from '../utils/address';
import { ShippingOption } from '../utils/cartPricing';
import { products } from './products';
export type OrderStatus = 'processing' | 'transit' | 'delivered' | 'cancelled';
export type CheckoutDetails = { recipient: string; address: string; instructions: string; payment: 'pix' | 'card' };
export type Order = { pointsEarned?: number; deliveryAddress?: DeliveryAddress; checkout?: CheckoutDetails; recipient?: string; delivery?: ShippingOption; id: string; createdAt: string; status: OrderStatus; demo: boolean; items: { id: string; name: string; price: number; quantity: number }[]; subtotal: number; discount: number; shipping: number; total: number; coupon: string | null; address: string; tracking: string | null };
export const statusLabels: Record<OrderStatus, string> = { processing: 'Em preparação', transit: 'Em rota', delivered: 'Entregue', cancelled: 'Cancelado' };
const line = (id: string, quantity = 1) => { const product = products.find(p => p.id === id)!; return { id, name: product.name, price: product.price, quantity }; };
const example = (id: string, status: OrderStatus, date: string, items: Order['items'], discount = 0, shipping = 0): Order => {
  const subtotal = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  return { id, status, createdAt: `${date}T12:00:00Z`, items, subtotal, discount, shipping, total: subtotal - discount + shipping, coupon: discount ? 'PROJETO10' : null, demo: true, address: 'Endereço ilustrativo • São Paulo, SP', tracking: status === 'transit' ? 'DEMO-BR839201948' : null };
};
export const demoOrders: Order[] = [
  example('SZ-98421', 'transit', '2024-10-18', [line('SZ-TUR-042'), line('SZ-ELT-220'), line('SZ-ACC-015', 2)], 59390, 8500),
  example('SZ-87310', 'delivered', '2024-09-02', [line('SZ-INT-108')]),
  example('SZ-75219', 'delivered', '2024-06-14', [line('SZ-ELT-220', 2)]),
  example('SZ-61044', 'cancelled', '2024-01-11', [line('SZ-BRK-512')]),
];
