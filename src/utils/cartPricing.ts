export const FREE_SHIPPING_CENTS = 650000;
export const SHIPPING_CENTS = 8500;
export type Coupon = 'PROJETO10' | 'GARAGEPASS';
export function couponError(code: string, subtotal: number): string | null {
  if (!code) return 'Digite um código de cupom.';
  if (code === 'TURBO50') return 'O cupom TURBO50 expirou.';
  if (code !== 'PROJETO10' && code !== 'GARAGEPASS') return 'Cupom não encontrado. Confira o código.';
  if (subtotal === 0) return 'Adicione produtos antes de aplicar um cupom.';
  if (code === 'GARAGEPASS' && subtotal < 700000) return 'GARAGEPASS exige subtotal mínimo de R$ 7.000,00.';
  return null;
}
export function calculateCart(lines: { price: number; oldPrice?: number; quantity: number }[], coupon: string | null) {
  const subtotal = lines.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  const validCoupon = coupon && !couponError(coupon, subtotal) ? coupon as Coupon : null;
  const discount = validCoupon ? Math.round(subtotal * (validCoupon === 'PROJETO10' ? 0.1 : 0.15)) : 0;
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_CENTS ? 0 : SHIPPING_CENTS;
  const savings = lines.reduce((sum, item) => sum + Math.max(0, Math.round((item.oldPrice ?? item.price) * 100) - Math.round(item.price * 100)) * item.quantity, 0) + discount;
  return { subtotal, discount, shipping, savings, total: subtotal - discount + shipping, validCoupon, remaining: Math.max(0, FREE_SHIPPING_CENTS - subtotal), progress: Math.min(100, Math.floor(subtotal / FREE_SHIPPING_CENTS * 100)) };
}

