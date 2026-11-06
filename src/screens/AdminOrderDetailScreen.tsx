import { palette as speedPalette } from '../theme/tokens';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { AdminDetail, ConfirmAction, DetailSection } from '../components/AdminDetailUI';
import { ProductAction, ps as s } from '../components/AdminProductUI';
import { OrderTotals } from '../components/CheckoutUI';
import { useAuth } from '../context/AuthContext';
import { AdminOrder } from '../data/admin';
import { OrderStatus, statusLabels } from '../data/orders';
import { money, products } from '../data/products';

const stages: OrderStatus[] = ['pending', 'confirmed', 'processing', 'transit', 'delivered'];
const next: Record<OrderStatus, OrderStatus[]> = { pending: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'], processing: ['transit', 'cancelled'], transit: ['delivered', 'cancelled'], delivered: [], cancelled: [] };
export default function AdminOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listAdminOrders, changeOrderStatus, listUsers } = useAuth();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [retry, setRetry] = useState(0);
  const lock = useRef(false);
  useEffect(() => { let alive = true; listAdminOrders().then(all => { const found = all.find(o => o.id === id); if (!found) throw new Error('Pedido não encontrado.'); if (alive) { setOrder(found); setError(''); } }).catch(e => { if (alive) setError(e.message); }).finally(() => { if (alive) setLoading(false); }); return () => { alive = false; }; }, [id, listAdminOrders, retry]);
  async function save() {
    if (!order || !target || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { const result = await changeOrderStatus(order.id, target, order.status); setOrder({ ...order, ...result }); setTarget(null); setNotice('Etapa salva. O cliente pode acompanhar a atualização em Pedidos.'); }
    catch (e) { setError((e as Error).message); } finally { lock.current = false; setBusy(false); }
  }
  async function customer() {
    if (!order || lock.current) return; lock.current = true; setBusy(true);
    try { const found = (await listUsers()).find(u => u.email === order.customerEmail); if (!found) throw new Error('Cadastro do cliente não encontrado.'); router.push({ pathname: '/admin-user', params: { id: found.id } }); } catch (e) { setError((e as Error).message); } finally { lock.current = false; setBusy(false); }
  }
  return <AdminDetail title="Detalhes do Pedido" back="/admin-orders" busy={busy}>
    <Text style={s.eyebrow}>VOLTAR P/ PEDIDOS / EXPEDIÇÃO</Text>
    {loading && <ActivityIndicator color={speedPalette.speedGreen} />}
    {!!error && <View style={s.card}><Text accessibilityRole="alert" style={s.error}>{error}</Text><ProductAction label="Recarregar pedido" disabled={busy} onPress={() => { setTarget(null); setLoading(true); setRetry(v => v + 1); }} /></View>}
    {!!notice && <Text accessibilityLiveRegion="polite" style={s.green}>{notice}</Text>}
    {order && !loading && <>
      <View style={s.between}><View style={s.flex}><Text style={s.eyebrow}>PEDIDO #{order.id}</Text><Text style={s.small}>{new Date(order.createdAt).toLocaleString('pt-BR')}</Text></View><Text style={s.eyebrow}>{statusLabels[order.status].toUpperCase()}</Text></View>
      <DetailSection title="Esteira de Expedição"><Text style={s.small}>{order.status === 'cancelled' ? 'PEDIDO CANCELADO' : `ETAPA ${stages.indexOf(order.status) + 1} DE ${stages.length}`}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>{stages.map(stage => <ProductAction key={stage} label={statusLabels[stage]} primary={(target || order.status) === stage} disabled={busy || !next[order.status].includes(stage)} onPress={() => setTarget(stage)} />)}</ScrollView><ProductAction primary label={busy ? 'Salvando…' : 'Salvar etapa do pedido'} disabled={busy || !target || target === 'cancelled'} onPress={() => void save()} /><Text style={s.small}>Atualiza o acompanhamento no app. WhatsApp e e-mail automáticos não estão conectados.</Text></DetailSection>
      <DetailSection title={order.recipient || 'Piloto'}><Text style={s.eyebrow}>CLIENTE SPEEDZONE</Text><View style={[s.card, { backgroundColor: speedPalette.carbonBlack }]}><Text selectable style={s.body}>{order.customerEmail}</Text><Text style={s.body}>{order.address || 'Endereço não informado'}</Text>{!!order.checkout?.instructions && <Text style={s.body}>{order.checkout.instructions}</Text>}</View><ProductAction label="Ver cadastro e garagem" disabled={busy} onPress={() => void customer()} /></DetailSection>
      <DetailSection title={`Componentes do Pedido · ${order.items.length} itens`}>{order.items.map(item => { const image = products.find(p => p.id === item.id)?.image; return <View key={item.id} style={[s.row, { padding: 10, backgroundColor: speedPalette.carbonBlack, borderRadius: 4 }]}>{image && <Image source={image} style={{ width: 64, height: 72, borderRadius: 4 }} />}<View style={s.flex}><Text style={s.small}>{item.id}</Text><Text style={s.section}>{item.name}</Text><View style={s.between}><Text style={s.body}>Qtd: {item.quantity} un</Text><Text style={s.green}>{money(item.price * item.quantity)}</Text></View></View></View>; })}</DetailSection>
      <DetailSection title="Liquidação & Despacho"><OrderTotals {...order} /><Text style={s.small}>{order.checkout?.payment === 'card' ? 'CARTÃO' : 'PIX'} · PAGAMENTO SIMULADO</Text><Text style={s.body}>{order.delivery?.label || 'Frete não informado'} {order.delivery?.days}</Text>{order.tracking ? <><Text selectable style={s.eyebrow}>RASTREIO · {order.tracking}</Text><ProductAction label="Copiar rastreio" onPress={() => { void Clipboard.setStringAsync(order.tracking!).then(() => setNotice('Rastreio copiado.')).catch(() => setError('Não foi possível copiar o rastreio.')); }} /></> : <Text style={s.small}>Rastreio ainda não disponível.</Text>}</DetailSection>
      <DetailSection collapsible title="Histórico operacional"><Text style={s.body}>Criado · {new Date(order.createdAt).toLocaleString('pt-BR')}</Text>{order.statusHistory?.map((entry, i) => <Text key={i} style={s.body}>{statusLabels[entry.to]} · {new Date(entry.at).toLocaleString('pt-BR')}</Text>)}<Text style={s.small}>Pedido demonstrativo, sem cobrança, emissão fiscal ou envio real.</Text></DetailSection>
      {next[order.status].includes('cancelled') && (target === 'cancelled' ? <ConfirmAction title="Cancelar este pedido?" description="O cancelamento é definitivo e devolve o estoque. Os pontos são estornados; o cupom permanece consumido. Não existe reembolso financeiro na simulação." busy={busy} onConfirm={() => void save()} onCancel={() => setTarget(null)} /> : <ProductAction label="⊗ Cancelar Pedido" disabled={busy} onPress={() => setTarget('cancelled')} />)}
    </>}
  </AdminDetail>;
}
