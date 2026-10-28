import type { CouponBenefit } from '../data/coupons';
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
export function couponError(code: string, subtotal: number, reward?: CouponBenefit | null, lines?: {category?:string}[]): string | null {
  if (!code) return 'Digite um código de cupom.';
  if (!reward || reward.code !== code) return 'Cupom não encontrado ou indisponível para esta conta.';
  if (reward.usedOrder) return 'Este cupom já foi utilizado nesta conta.';
  if (reward.unavailableReason) return reward.unavailableReason;
  if (reward.categories?.length && lines && !lines.some(item=>reward.categories!.includes(item.category||''))) return 'Este cupom não se aplica às categorias do carrinho.';
  if (subtotal === 0) return 'Adicione produtos antes de aplicar um cupom.';
  if (subtotal < (reward.minimum || 0)) return `Pedido mínimo: ${((reward.minimum || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`;
  return null;
}
export function calculateCart(lines: { category?:string; price: number; oldPrice?: number; quantity: number }[], coupon: string | null, delivery?: ShippingChoice | null, reward?: CouponBenefit | null) {
  const subtotal = lines.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  const validCoupon = coupon && !couponError(coupon, subtotal, reward, lines) ? coupon : null;
  const eligible = lines.filter(item=>!reward?.categories?.length||reward.categories.includes(item.category||'')).reduce((sum,item)=>sum+Math.round(item.price*100)*item.quantity,0);
  const discount = validCoupon && reward ? Math.min(eligible, reward.maximum || Infinity, reward.fixedCents || Math.round(eligible * reward.percent / 100)) : 0;
  const selectedShipping = delivery ? shippingOptions(delivery.cep, subtotal).find(option => option.service === delivery.service) : undefined;
  const baseShipping = delivery === undefined ? (subtotal === 0 || subtotal >= FREE_SHIPPING_CENTS ? 0 : SHIPPING_CENTS) : selectedShipping?.price ?? 0;
  const shipping = validCoupon && reward ? reward.freeShipping ? 0 : Math.max(0, baseShipping - Math.min(reward.maximum || Infinity, Math.round(baseShipping * (reward.shippingPercent || 0) / 100))) : baseShipping;
  const savings = lines.reduce((sum, item) => sum + Math.max(0, Math.round((item.oldPrice ?? item.price) * 100) - Math.round(item.price * 100)) * item.quantity, 0) + discount;
  return { subtotal, discount, shipping, savings, total: subtotal - discount + shipping, validCoupon, remaining: Math.max(0, FREE_SHIPPING_CENTS - subtotal), progress: Math.min(100, Math.floor(subtotal / FREE_SHIPPING_CENTS * 100)) };
}

