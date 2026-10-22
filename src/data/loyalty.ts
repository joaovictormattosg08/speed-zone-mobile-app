export const rewards = [
  { id: 'off5', label: '5% OFF', cost: 5000, percent: 5, freeShipping: false },
  { id: 'off10', label: '10% OFF', cost: 10000, percent: 10, freeShipping: false },
  { id: 'off15', label: '15% OFF', cost: 15000, percent: 15, freeShipping: false },
  { id: 'off20', label: '20% OFF', cost: 20000, percent: 20, freeShipping: false },
  { id: 'shipping', label: 'Frete grátis', cost: 5000, percent: 0, freeShipping: true },
];
export type LoyaltyCoupon = { code: string; rewardId: string; label: string; cost: number; percent: number; freeShipping: boolean; createdAt: string; usedOrder: string | null };
export type Loyalty = { balance: number; reversed: number; earned: number; spent: number; coupons: LoyaltyCoupon[]; history: { id: string; points: number; label: string; createdAt: string }[] };
