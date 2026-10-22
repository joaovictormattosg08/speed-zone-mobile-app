export const orderStages = ['pending', 'confirmed', 'processing', 'transit', 'delivered'] as const;
export type OrderStatus = typeof orderStages[number] | 'cancelled';
export const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pendente', confirmed: 'Confirmado', processing: 'Preparação',
  transit: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado',
};
export function orderProgress(status: OrderStatus) {
  const index = orderStages.findIndex(stage => stage === status);
  return { index, completed: index + 1, percent: (index + 1) * 20, cancelled: status === 'cancelled' };
}
