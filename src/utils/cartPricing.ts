export const FREE_SHIPPING_CENTS = 650000;
export const SHIPPING_CENTS = 8500;
export type Coupon = 'PROJETO10' | 'GARAGEPASS';
export type ShippingChoice = { cep: string; service: 'standard' | 'express' };
export type ShippingOption = ShippingChoice & { label: string; price: number; days: string };
export function shippingOptions(cep: string, subtotal: number): ShippingOption[] {
  if (!/^\d{8}$/.test(cep) || /^(\d)\1{7}$/.test(cep)) return [];
  // Illustrative zones only: this does not validate postal coverage or quote a carrier.
  const zone = Number(cep[0]) <= 1 ? 0 : Number(cep[0]) <= 5 ? 1 : 2;
  const free = subtotal >= FREE_SHIPPING_CENTS;
  return [
    { cep, service: 'standard', label: 'Entrega Econômica', price: free ? 0 : 3990 + zone * 1500, days: `${5 + zone * 2}–${8 + zone * 2} dias úteis` },
    { cep, service: 'express', label: 'Entrega Express', price: free ? 0 : SHIPPING_CENTS + zone * 2000, days: `${2 + zone}–${3 + zone} dias úteis` },
  ];
}
export function couponError(code: string, subtotal: number): string | null {
  if (!code) return 'Digite um código de cupom.';
  if (code === 'TURBO50') return 'O cupom TURBO50 expirou.';
  if (code !== 'PROJETO10' && code !== 'GARAGEPASS') return 'Cupom não encontrado. Confira o código.';
  if (subtotal === 0) return 'Adicione produtos antes de aplicar um cupom.';
  if (code === 'GARAGEPASS' && subtotal < 700000) return 'GARAGEPASS exige subtotal mínimo de R$ 7.000,00.';
  return null;
}
export function calculateCart(lines: { price: number; oldPrice?: number; quantity: number }[], coupon: string | null, delivery?: ShippingChoice | null) {
  const subtotal = lines.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  const validCoupon = coupon && !couponError(coupon, subtotal) ? coupon as Coupon : null;
  const discount = validCoupon ? Math.round(subtotal * (validCoupon === 'PROJETO10' ? 0.1 : 0.15)) : 0;
  const selectedShipping = delivery ? shippingOptions(delivery.cep, subtotal).find(option => option.service === delivery.service) : undefined;
  const shipping = delivery === undefined ? (subtotal === 0 || subtotal >= FREE_SHIPPING_CENTS ? 0 : SHIPPING_CENTS) : selectedShipping?.price ?? 0;
  const savings = lines.reduce((sum, item) => sum + Math.max(0, Math.round((item.oldPrice ?? item.price) * 100) - Math.round(item.price * 100)) * item.quantity, 0) + discount;
  return { subtotal, discount, shipping, savings, total: subtotal - discount + shipping, validCoupon, remaining: Math.max(0, FREE_SHIPPING_CENTS - subtotal), progress: Math.min(100, Math.floor(subtotal / FREE_SHIPPING_CENTS * 100)) };
}

