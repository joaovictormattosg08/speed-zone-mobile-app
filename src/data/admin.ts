import { Order } from './orders';
export type AdminOrder = Order & { customerEmail: string };
export type AdminOverview = { salesTotal: number; processing: number; openTickets: number; dailySales: { date: string; total: number }[]; updatedAt: string; customers: number; ordersCount: number; tickets: number; coupons: number; orders: { id: string; date: string; recipient: string; status: string; total: number }[] };
