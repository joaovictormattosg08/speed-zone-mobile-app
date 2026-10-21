import { useCallback, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { StoreIcon } from '../components/StoreHeader';
import { checkoutStyles as s, CheckoutButton, OrderTotals } from '../components/CheckoutUI';
import { useAuth } from '../context/AuthContext';
import { Order } from '../data/orders';
import { money, products } from '../data/products';

export default function OrderConfirmedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listOrders } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);
  useFocusEffect(useCallback(() => { void attempt; let alive = true; setLoading(true); setError(''); listOrders().then(orders => { if (!alive) return; const found = orders.find(item => item.id === id); setOrder(found || null); if (!found) setError('Pedido não encontrado nesta conta.'); }).catch(cause => { if (alive) setError(cause.message); }).finally(() => { if (alive) setLoading(false); }); return () => { alive = false; }; }, [id, listOrders, attempt]));
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>{loading ? <ActivityIndicator color="#4edea3" /> : error ? <View style={s.card}><Text style={s.error}>{error}</Text><CheckoutButton label="Tentar novamente" onPress={() => setAttempt(attempt + 1)} /><CheckoutButton label="Meus pedidos" onPress={() => router.replace('/(main)/orders')} /></View> : order && <>
    <View style={s.hero}><View style={s.success}><StoreIcon name="check" size={42} color="#003824" /></View><Text style={s.green}>PEDIDO REGISTRADO</Text><Text style={s.headline}>Pedido realizado com sucesso!</Text><Text style={[s.body, { textAlign: 'center', paddingHorizontal: 16 }]}>Seu projeto está um passo mais perto da pista.</Text><Text style={[s.note, { textAlign: 'center', paddingHorizontal: 16 }]}>Simulação salva. Nenhum pagamento foi cobrado e nenhum envio foi iniciado.</Text></View>
    <View style={[s.card, { borderTopWidth: 3, borderTopColor: '#4edea3' }]}><Text style={s.label}>IDENTIFICADOR DO BOX</Text><View style={s.row}><Text selectable style={[s.title, s.flex]}>#{order.id}</Text><Pressable accessibilityRole="button" accessibilityLabel="Copiar código do pedido" style={s.back} onPress={async () => { try { await Clipboard.setStringAsync(order.id); setCopied(true); } catch { setCopied(false); } }}><StoreIcon name="content-copy" /></Pressable></View>{copied && <Text accessibilityLiveRegion="polite" style={s.green}>Código copiado</Text>}<Text style={s.body}>{new Date(order.createdAt).toLocaleString('pt-BR')}</Text><Text style={s.green}>SALVO NA SUA CONTA</Text>{order.pointsEarned !== undefined && <Text style={s.green}>+{order.pointsEarned.toLocaleString('pt-BR')} SpeedPoints demonstrativos</Text>}<Text style={s.body}>{order.checkout?.payment === 'card' ? 'Cartão de crédito' : 'PIX'} • simulado, sem cobrança</Text></View>
    <View style={s.card}><View style={s.row}><StoreIcon name="truck-outline" color="#7bd0ff" /><View style={s.flex}><Text style={s.label}>TRANSPORTE SELECIONADO</Text><Text style={s.title}>{order.delivery?.label || 'Entrega'}</Text></View></View><Text style={s.green}>{order.delivery?.days || 'Prazo não informado'} • prazo ilustrativo</Text><View style={s.divider} /><Text style={s.label}>DESTINO DA GARAGEM</Text><Text style={s.title}>{order.recipient}</Text><Text style={s.body}>{order.address}</Text><Text style={s.body}>CEP {order.delivery?.cep}</Text>{!!order.deliveryAddress?.reference && <Text style={s.body}>Referência: {order.deliveryAddress.reference}</Text>}{!!order.deliveryAddress?.phone && <Text style={s.body}>Contato: {order.deliveryAddress.phone}</Text>}{!!order.checkout?.instructions && <Text style={s.body}>Instruções: {order.checkout.instructions}</Text>}</View>
    <View style={s.card}><Text style={s.title}>Componentes do pedido · {order.items.length}</Text>{order.items.map(item => <View key={item.id} style={s.row}><Image source={products.find(p => p.id === item.id)?.image} style={s.image} /><View style={s.flex}><Text numberOfLines={2} style={s.body}>{item.name}</Text><Text style={s.note}>Qtd: {item.quantity} un</Text><Text style={s.green}>{money(item.price * item.quantity)}</Text></View></View>)}<OrderTotals {...order} /></View>
    <View style={s.card}><Text style={s.title}>Suporte Técnico & Fitment</Text><Text style={s.body}>Dúvidas sobre as peças ou montagem? Abra um chamado vinculado a este pedido.</Text><CheckoutButton label="Abrir suporte deste pedido" onPress={() => router.push({ pathname: '/support', params: { orderId: order.id } })} /></View>
    <CheckoutButton label="ACOMPANHAR MEU PEDIDO →" onPress={() => router.replace({ pathname: '/order/[id]', params: { id: order.id } })} /><Text style={[s.note, { textAlign: 'center' }]}>Nota fiscal e rastreamento real estarão disponíveis após integração dos serviços.</Text><Pressable accessibilityRole="button" style={s.link} onPress={() => router.replace('/(main)/catalog')}><Text style={s.body}>← Voltar para o Catálogo e Garagem</Text></Pressable>
  </>}</ScrollView></SafeAreaView>;
}
