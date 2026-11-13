import { ThemeColors, fonts as f } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { DemoInvoice } from '../components/DemoInvoice';

import { OrderProgress } from '../components/OrderProgress';
import { useCatalog } from '../context/CatalogContext';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Order, demoOrders, statusLabels } from '../data/orders';
import { money } from '../data/products';
import { StoreIcon } from '../components/StoreHeader';

const format = (cents: number) => money(cents / 100);

export default function OrderDetailsScreen({ id, preview }: { id: string; preview: boolean }) {
  const { colors: c } = useTheme();
  const s = useThemedStyles(createS);

  const { products } = useCatalog();
  const { listOrders, user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState('');
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  useFocusEffect(useCallback(() => {
    if (attempt > 0) setNotice('');
    let alive = true; setLoading(true); setError(''); setOrder(null);
    let inFlight = false;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try { const data = preview ? demoOrders : await listOrders(); if (alive) { setOrder(data.find(item => item.id === id) || null); setError(''); } }
      catch (cause) { if (alive) setError((cause as Error).message); }
      finally { inFlight = false; if (alive) setLoading(false); }
    };
    void refresh();
    const timer = preview ? undefined : setInterval(() => void refresh(), 10000);
    return () => { alive = false; if (timer) clearInterval(timer); };
  }, [id, preview, listOrders, attempt]));
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/(main)/orders'); };
  async function copy() { try { setNotice(await Clipboard.setStringAsync(id) ? 'Código do pedido copiado.' : 'Não foi possível copiar.'); } catch { setNotice('Não foi possível copiar neste dispositivo.'); } }
  async function share() { if (!order) return; try { await Share.share({ message: `Pedido #${order.id} • SpeedZone\n${statusLabels[order.status]}\nTotal: ${format(order.total)}\nPedido de demonstração, sem cobrança ou envio real.` }); } catch { setNotice('Não foi possível compartilhar o pedido.'); } }
  const cancelled = order?.status === 'cancelled';

  const exampleDelivery = preview && order?.status === 'transit';
  const openSupport = () => router.push({ pathname: '/support', params: preview ? {} : { orderId: id } });
  const headline = exampleDelivery ? 'Chega hoje até às 18h' : order?.status === 'pending' ? 'Pedido Pendente' : order?.status === 'confirmed' ? 'Pedido Confirmado' : cancelled ? 'Pedido Cancelado' : order?.status === 'transit' ? 'Pedido Enviado • Em Transporte' : order?.status === 'delivered' ? 'Entregue no Destino' : 'Pedido Recebido • Em Preparação';
  const created = order ? new Date(order.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';
  return <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}>
    <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Voltar para pedidos" onPress={back} style={s.icon}><StoreIcon name="arrow-left" color={c.text} /></Pressable><View style={{flex:1}}><Text style={s.title}>Rastreamento</Text><Text style={s.small}>Pedido #{id}</Text></View>
      {order && <><Pressable accessibilityRole="button" accessibilityLabel="Copiar código do pedido" onPress={copy} style={s.icon}><StoreIcon name="content-copy" color={c.muted} size={19} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Compartilhar pedido" onPress={share} style={s.icon}><StoreIcon name="share-variant-outline" color={c.muted} size={20} /></Pressable></>}
    </View>
    <ScrollView contentContainerStyle={s.content}>
      {loading ? <ActivityIndicator color={c.primary} style={{ margin: 40 }} /> : !order ? <View style={s.card}><StoreIcon name="package-variant" size={40} /><Text style={s.title}>{error ? 'Não foi possível carregar' : 'Pedido não encontrado'}</Text><Text style={s.body}>{error || 'Este pedido não está disponível nesta conta.'}</Text><Pressable accessibilityRole="button" onPress={error ? () => setAttempt(value => value + 1) : back} style={s.button}><Text style={s.buttonText}>{error ? 'Tentar novamente' : 'Meus Pedidos'}</Text></Pressable></View> : <>
      {notice !== '' && <Text accessibilityLiveRegion="polite" style={s.green}>{notice}</Text>}
      <View style={s.mapCard}>
        <View style={s.mapHeading}>
          <View style={s.tile}><StoreIcon name="navigation-variant-outline" color={c.primary} /></View>
          <View style={s.flex}><Text style={s.section}>TELEMETRIA SPEEDZONE</Text><Text style={s.small}>Trajeto ilustrativo</Text></View>
          <Text style={s.pill}>{exampleDelivery ? '4,2 km • exemplo' : 'Simulado'}</Text>
        </View>
        <View style={s.map}>
          <Image source={require('../../assets/store/delivery-route.png')} resizeMode="stretch" style={s.mapImage} />
          <View style={s.origin}><StoreIcon name="warehouse" color="#334155" size={16} /><Text style={s.pinText}>CD SpeedZone</Text></View>
          <View style={s.destination}><StoreIcon name="home-map-marker" color="#047857" size={17} /><Text style={s.pinText}>Destino</Text></View>
          {order.status === 'transit' && <View style={s.van}><StoreIcon name="truck-delivery" color="#fff" size={24} /></View>}
        </View>
        <OrderProgress status={order.status} tracking />
      </View>
      <View style={s.card}>
        <View style={s.between}>
          <View style={s.flex}>
            <Text style={s.pill}>{exampleDelivery ? 'SAIU PARA ENTREGA' : statusLabels[order.status].toUpperCase()}</Text>
            <Text style={s.headline}>{headline}</Text>
            <Text style={s.body}>{exampleDelivery ? 'Previsão ilustrativa entre 17h40 e 18h10' : order.delivery && !cancelled && order.status !== 'delivered' ? 'Prazo simulado: ' + order.delivery.days : 'Pedido registrado em ' + created}</Text>
          </View>
          <View style={s.tile}><StoreIcon name="timer-outline" size={26} color={c.primary} /></View>
        </View>
        <View style={s.divider} />
        <View style={s.row}>
          <View style={s.tile}><StoreIcon name="motorbike" color={c.primary} /></View>
          <View style={s.flex}><Text style={s.eventTitle}>{exampleDelivery ? 'Carlos Eduardo' : order.delivery?.label || 'Transporte'}</Text><Text style={s.small}>{exampleDelivery ? 'Entregador ilustrativo • SpeedZone Courier' : 'Entrega de demonstração'}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Falar com o Box sobre a entrega" onPress={openSupport} style={s.tile}><StoreIcon name="message-outline" color={c.primary} /></Pressable>
        </View>
      </View>
      <View style={s.card}><View style={s.between}><Text style={s.title}>Histórico de Rastreamento</Text></View><Text selectable style={s.small}>{order.tracking || 'Código de rastreio ainda não disponível'}</Text>{[{ label: 'Pedido registrado', at: order.createdAt }, ...(order.statusHistory || []).map(event => ({ label: statusLabels[event.to], at: event.at }))].map((event,index,events) => <View key={index} style={s.event}><View style={s.eventRail}><View style={[s.eventDot,{backgroundColor:cancelled && index===events.length-1?c.error:c.primary}]}><StoreIcon name={cancelled && index===events.length-1?'close':'check'} size={17} color={c.onPrimary}/></View>{index<events.length-1&&<View style={[s.eventLine,{backgroundColor:c.primary}]}/>}</View><View style={[s.eventBody,index===events.length-1&&s.currentEvent]}><Text style={s.eventTitle}>{event.label}</Text><Text style={s.body}>{new Date(event.at).toLocaleString('pt-BR')}</Text></View></View>)}<Text style={s.green}>Status atual: {statusLabels[order.status]}</Text>{!preview && <Text style={s.small}>Atualização automática a cada 10 segundos.</Text>}{!!error&&<Text accessibilityLiveRegion="polite" style={{color:c.error}}>Não foi possível atualizar: {error}</Text>}</View>
      <View style={s.card}><View style={s.row}><StoreIcon name="map-marker-outline" size={21} /><Text style={s.title}>Endereço de Entrega</Text></View><Text style={s.eventTitle}>{preview ? 'Piloto de demonstração' : order.recipient || `${user?.name || ''} ${user?.surname || ''}`}</Text><Text style={s.body}>{order.address || 'Endereço não informado nesta simulação.'}</Text>{order.delivery && <><Text style={s.body}>CEP: {order.delivery.cep.slice(0, 5)}-{order.delivery.cep.slice(5)}</Text><Text style={s.green}>{order.delivery.label} • {format(order.shipping)}</Text></>}</View>
      <View style={s.card}><View style={s.row}><StoreIcon name="package-variant-closed" size={21} /><Text style={s.title}>Itens do Pacote ({order.items.length})</Text></View>{order.items.map(item => { const product = products.find(product => product.id === item.id); return <View key={item.id} style={s.item}>{product ? <Image source={product.image} style={s.productImage} /> : <StoreIcon name="package-variant" />}<View style={{ flex: 1, gap: 4 }}><Text style={s.eventTitle}>{item.name}</Text><Text selectable style={s.small}>{item.id}</Text><View style={s.between}><Text style={s.body}>Qtd: {item.quantity} un</Text><Text style={s.itemPrice}>{money(item.price * item.quantity)}</Text></View></View></View>; })}</View>
      <View style={s.card}><View style={s.between}><Text style={s.title}>Resumo Financeiro</Text><Text style={s.mapTag}>SEM COBRANÇA</Text></View>{[['Subtotal das Peças', order.subtotal], [order.coupon ? `Cupom ${order.coupon}` : 'Desconto', -order.discount], [order.delivery?.label || 'Frete', order.shipping]].map(([label, value]) => <View key={label} style={s.between}><Text style={s.body}>{label}</Text><Text style={[s.itemPrice, Number(value) < 0 && s.green]}>{Number(value) === 0 && label === (order.delivery?.label || 'Frete') ? 'GRÁTIS' : format(Number(value))}</Text></View>)}<View style={s.divider} /><View style={s.between}><View style={{ flex: 1 }}><Text style={s.title}>{cancelled ? 'Total Cancelado' : 'Total do Pedido'}</Text><Text style={s.small}>Valores da simulação</Text>{order.discount > 0 && <Text style={s.savings}>Economia de {format(order.discount)}</Text>}</View><Text style={[s.total, cancelled && { color: c.subtle, textDecorationLine: 'line-through' }]}>{format(order.total)}</Text></View></View>
      <Pressable accessibilityRole="button" onPress={openSupport} style={[s.button, { backgroundColor: c.action }]}><StoreIcon name="headset" color={c.onPrimary} /><Text style={[s.buttonText,{color:c.onPrimary}]}>Falar com o Box</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setInvoiceOpen(true)} style={s.button}><StoreIcon name="receipt" color={c.muted} /><Text style={s.buttonText}>Ver nota fiscal demonstrativa</Text></Pressable>
      </>}
    </ScrollView>{invoiceOpen && order && <DemoInvoice order={order} onClose={() => setInvoiceOpen(false)} />}
  </SafeAreaView>;
}
const createS = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  icon: { minWidth: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, borderColor: c.surfaceBorder, backgroundColor: c.panel, borderRadius: 24, padding: 20, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { color: c.text, fontFamily: f.medium, fontSize: 15, flexShrink: 1 },
  body: { color: c.muted, fontFamily: f.regular, fontSize: 12, lineHeight: 17 },
  small: { color: c.subtle, fontFamily: f.regular, fontSize: 10, lineHeight: 15 },
  green: { color: c.primary },
  mapTag: { color: c.primary, fontFamily: f.bold, fontSize: 9 },
  event: { flexDirection: 'row', gap: 10 },
  eventRail: { width: 26, alignItems: 'center' },
  eventDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center' },
  eventLine: { width: 2, flex: 1, backgroundColor: c.elevated, minHeight: 30, marginBottom: -10 },
  eventBody: { flex: 1, gap: 5, paddingBottom: 16, paddingTop: 3 },
  currentEvent: { backgroundColor: c.primarySoft, paddingHorizontal: 7, borderRadius: 3 },
  eventTitle: { color: c.text, fontFamily: f.medium, fontSize: 12, lineHeight: 17, flexShrink: 1 },
  item: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: c.panel, padding: 8, borderRadius: 24 },
  productImage: { width: 55, height: 64, borderRadius: 3 },
  itemPrice: { fontFamily: f.medium, color: c.text, fontSize: 12 },
  divider: { height: 1, backgroundColor: c.elevated, marginVertical: 5 },
  total: { fontFamily: f.heavy, color: c.primary, fontSize: 25, letterSpacing: -1, flexShrink: 1, maxWidth: '55%', textAlign: 'right' },
  savings: { fontFamily: f.medium, color: c.primary, fontSize: 10, marginTop: 5 },
  buttonText: { color: c.text, fontFamily: f.medium, fontSize: 12, flexShrink: 1, textAlign: 'center' },
  header: { minHeight: 64, backgroundColor: c.panel, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  content: { width: '100%', maxWidth: 500, alignSelf: 'center', padding: 16, gap: 16, paddingBottom: 40 },
  mapCard: { overflow: 'hidden', borderRadius: 24, borderColor:c.surfaceBorder, borderWidth:1, backgroundColor:c.panel },
  mapHeading: { flexDirection:'row', alignItems:'center', gap:10, padding:14 },
  map: { width:'100%', aspectRatio:400/220 },
  origin: { position:'absolute', left:'3%', top:'69%', flexDirection:'row', alignItems:'center', gap:4, padding:5, backgroundColor:'#fff', borderRadius:8 },
  destination: { position:'absolute', right:'3%', top:'23%', flexDirection:'row', alignItems:'center', gap:4, padding:5, backgroundColor:'#fff', borderRadius:8 },
  van: { position:'absolute', left:'45%', top:'33%', backgroundColor:'#059669', padding:7, borderRadius:20, borderColor:'#fff', borderWidth:3 },
  section: { fontFamily:f.bold, fontSize:12, color:c.text },
  tile: { width:44, height:44, borderRadius:14, backgroundColor:c.primarySoft, alignItems:'center', justifyContent:'center' },
  pill: { alignSelf:'flex-start', borderRadius:12, backgroundColor:c.primarySoft, color:c.primary, fontFamily:f.bold, fontSize:10, paddingHorizontal:9, paddingVertical:5 },
  headline: { fontFamily:f.heavy, color:c.text, fontSize:24, letterSpacing:-0.7, marginVertical:6 },
  mapImage: { width:'100%', height:'100%' },
  pinText: { color:'#334155', fontFamily:f.bold, fontSize:10 },
  flex: { flex:1, minWidth:0 },
  button: { borderWidth:1, borderColor:c.surfaceBorder, minHeight:50, borderRadius:16, padding:12, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:c.panel },
});
