import { useTheme , useThemedStyles } from '../theme/ThemeContext';
import { DemoInvoice } from '../components/DemoInvoice';
import { useCatalog } from '../context/CatalogContext';
import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AccessibilityInfo, ActivityIndicator, Animated, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { StoreIcon } from '../components/StoreHeader';
import { createCheckoutStyles, CheckoutButton, OrderTotals } from '../components/CheckoutUI';
import { useAuth } from '../context/AuthContext';
import { Order } from '../data/orders';
import { money } from '../data/products';

function ConfirmationSeal() {
  const { colors } = useTheme();
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let active = true;
    const animation = Animated.timing(pulse, {
      toValue: 1,
      duration: 700,
      useNativeDriver: Platform.OS !== 'web',
    });
    const stop = () => {
      active = false;
      animation.stop();
      pulse.setValue(0);
    };
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', reduced => {
      if (reduced) stop();
    });
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (active && !reduced) animation.start();
    }).catch(() => {});
    return () => {
      subscription.remove();
      stop();
    };
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 1.14, 1] });
  const ripple = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const opacity = pulse.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] });
  return (
    <View style={sealStyles.frame}>
      <Animated.View style={[sealStyles.ring, { borderColor: colors.primary, opacity, transform: [{ scale: ripple }] }]} />
      <Animated.View style={[sealStyles.disc, { backgroundColor: colors.primarySoft, transform: [{ scale }] }]}>
        <StoreIcon name="check" size={42} color={colors.primary} />
      </Animated.View>
    </View>
  );
}

const sealStyles = StyleSheet.create({
  frame: { width: 76, height: 76 },
  ring: { ...StyleSheet.absoluteFill, borderWidth: 2, borderRadius: 38 },
  disc: { flex: 1, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
});

export default function OrderConfirmedScreen() {
  const { colors: c } = useTheme();

  const s = useThemedStyles(createCheckoutStyles);

  const { products } = useCatalog();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listOrders } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  useFocusEffect(useCallback(() => { void attempt; let alive = true; setLoading(true); setError(''); listOrders().then(orders => { if (!alive) return; const found = orders.find(item => item.id === id); setOrder(found || null); if (!found) setError('Pedido não encontrado nesta conta.'); }).catch(cause => { if (alive) setError(cause.message); }).finally(() => { if (alive) setLoading(false); }); return () => { alive = false; }; }, [id, listOrders, attempt]));
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>{loading ? <ActivityIndicator color={c.primary} /> : error ? <View style={s.card}><Text style={s.error}>{error}</Text><CheckoutButton label="Tentar novamente" onPress={() => setAttempt(attempt + 1)} /><CheckoutButton label="Meus pedidos" onPress={() => router.replace('/(main)/orders')} /></View> : order && <>
    <View style={[s.hero,{backgroundColor:c.background}]}>
      <ConfirmationSeal />
      <Pressable accessibilityRole="button" accessibilityLabel="Copiar código do pedido" style={s.row} onPress={async () => { try { setCopied(await Clipboard.setStringAsync(order.id)); } catch { setCopied(false); } }}>
        <Text style={s.green}>Pedido #{order.id}</Text><StoreIcon name="content-copy" size={16} color={c.primary} />
      </Pressable>
      {copied && <Text accessibilityLiveRegion="polite" style={s.note}>Código copiado</Text>}
      <Text style={s.headline}>Pedido confirmado!</Text>
      <Text style={s.body}>Simulação salva, sem cobrança ou envio real.</Text>
    </View>
    <View style={[s.card,{backgroundColor:c.primarySoft}]}>
      <View style={s.row}><StoreIcon name="lightning-bolt" color={c.primary} /><Text style={s.title}>Status do pagamento</Text></View>
      <Text style={s.body}>{order.checkout?.payment === 'card' ? 'Cartão de crédito' : 'PIX'} • simulado</Text>
      <Text style={s.label}>Total do pedido</Text><Text style={s.amount}>{money(order.total / 100)}</Text>
      {order.pointsEarned !== undefined && <Text style={s.green}>+{order.pointsEarned.toLocaleString('pt-BR')} SpeedPoints na garagem</Text>}
    </View>
    <View style={s.card}><View style={s.row}><StoreIcon name="truck-outline" color={c.primary} /><View style={s.flex}><Text style={s.label}>TRANSPORTE SELECIONADO</Text><Text style={s.title}>{order.delivery?.label || 'Entrega'}</Text></View></View><Text style={s.green}>{order.delivery?.days || 'Prazo não informado'} • prazo ilustrativo</Text><View style={s.divider} /><Text style={s.label}>DESTINO DA GARAGEM</Text><Text style={s.title}>{order.recipient}</Text><Text style={s.body}>{order.address}</Text><Text style={s.body}>CEP {order.delivery?.cep}</Text>{!!order.deliveryAddress?.reference && <Text style={s.body}>Referência: {order.deliveryAddress.reference}</Text>}{!!order.deliveryAddress?.phone && <Text style={s.body}>Contato: {order.deliveryAddress.phone}</Text>}{!!order.checkout?.instructions && <Text style={s.body}>Instruções: {order.checkout.instructions}</Text>}</View>
    <View style={s.card}><Text style={s.title}>Componentes do pedido · {order.items.length}</Text>{order.items.map(item => <View key={item.id} style={s.row}><Image source={products.find(p => p.id === item.id)?.image} style={s.image} /><View style={s.flex}><Text numberOfLines={2} style={s.body}>{item.name}</Text><Text style={s.note}>Qtd: {item.quantity} un</Text><Text style={s.green}>{money(item.price * item.quantity)}</Text></View></View>)}</View>
    <View style={s.card}><Text style={s.title}>Resumo financeiro</Text><OrderTotals {...order} /></View>
    <View style={s.card}><Text style={s.title}>Suporte Técnico & Fitment</Text><Text style={s.body}>Dúvidas sobre as peças ou montagem? Abra um chamado vinculado a este pedido.</Text><CheckoutButton label="Abrir suporte deste pedido" onPress={() => router.push({ pathname: '/support', params: { orderId: order.id } })} /></View>
    <CheckoutButton label="Acompanhar rastreamento" onPress={() => router.replace({ pathname: '/order/[id]', params: { id: order.id } })} /><Pressable accessibilityRole="button" style={s.link} onPress={() => router.replace('/(main)/home')}><Text style={s.title}>Ir para minha garagem</Text></Pressable>
    <Pressable accessibilityRole="button" style={s.link} onPress={() => setInvoiceOpen(true)}><Text style={s.green}>Ver comprovante demonstrativo</Text></Pressable>
  </>}</ScrollView>{invoiceOpen && order && <DemoInvoice order={order} onClose={() => setInvoiceOpen(false)} />}</SafeAreaView>;
}
