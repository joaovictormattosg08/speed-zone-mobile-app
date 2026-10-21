import { useLoyalty } from '../hooks/useLoyalty';
import { useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoreIcon } from '../components/StoreHeader';
import { CartShipping } from '../components/CartShipping';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { products } from '../data/products';
import { calculateCart, ShippingChoice } from '../utils/cartPricing';
import { checkoutStyles as s, Amount, CheckoutButton, CheckoutHeader, OrderTotals } from '../components/CheckoutUI';

export default function CheckoutScreen() {
  const params = useLocalSearchParams<{ coupon?: string; cep?: string; service?: string }>();
  const loyalty = useLoyalty();
  const { user, placeOrder } = useAuth();
  const { cart, removeItem } = useStore();
  const [step, setStep] = useState(1);
  const recipient = user?.deliveryAddress?.recipient || `${user?.name || ''} ${user?.surname || ''}`.trim();
  const address = user?.address || '';
  const savedCep = user?.deliveryAddress?.cep;
  const [instructions, setInstructions] = useState('');
  const [payment, setPayment] = useState<'pix' | 'card'>('pix');
  const [deliveryChoice, setDelivery] = useState<ShippingChoice | null>(params.cep && (params.service === 'standard' || params.service === 'express') ? { cep: params.cep, service: params.service } : null);
  const delivery = savedCep ? (deliveryChoice?.cep === savedCep ? deliveryChoice : null) : deliveryChoice;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const pending = useRef<{ signature: string; key: string } | null>(null);
  const scroll = useRef<ScrollView>(null);
  const items = products.filter(p => cart[p.id]).map(p => ({ ...p, quantity: cart[p.id] }));
  const totals = calculateCart(items, params.coupon || null, delivery, loyalty.data?.coupons.find(item => item.code === params.coupon));
  function advance() {
    if (!savedCep || recipient.trim().length < 3 || address.trim().length < 10 || !delivery) { setError('Informe o destinatário, o endereço completo e selecione a entrega.'); return; }
    setError(''); setStep(step + 1); scroll.current?.scrollTo({ y: 0 });
  }
  async function finish() {
    if (lock.current || !delivery || !items.length) return;
    if (params.coupon && totals.validCoupon !== params.coupon) { setError('Cupom indisponível. Volte ao carrinho e confira seus cupons.'); return; }
    lock.current = true; setBusy(true); setError('');
    const checkout = { recipient, address, instructions, payment };
    const lines = items.map(({ id, quantity }) => ({ id, quantity }));
    const signature = JSON.stringify({ lines, checkout, delivery, coupon: totals.validCoupon });
    // Generated only in the confirmation press handler, never during render.
    // eslint-disable-next-line react-hooks/purity
    if (pending.current?.signature !== signature) pending.current = { signature, key: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    try {
      const order = await placeOrder(lines, totals.validCoupon, pending.current.key, delivery, checkout);
      items.forEach(item => removeItem(item.id));
      router.replace({ pathname: '/order-confirmed/[id]', params: { id: order.id } });
    } catch (cause) { setError((cause as Error).message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <SafeAreaView style={s.safe}><CheckoutHeader title="CHECKOUT" onBack={() => { if (busy) return; if (step > 1) { setStep(step - 1); setError(''); } else router.navigate('/(main)/cart'); }} /><KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    <View style={[s.card, s.row]}>{['Carrinho', 'Entrega', 'Pagamento', 'Revisão'].map((label, index) => <View key={label} style={s.step}><View style={[s.stepIcon, index <= step && s.active]}><Text style={s.stepNumber}>{index < step ? '✓' : index + 1}</Text></View><Text style={[s.micro, index === step && s.green]}>{label.toUpperCase()}</Text></View>)}</View>
    {!items.length ? <View style={s.card}><Text style={s.title}>Seu carrinho está vazio</Text><CheckoutButton label="Voltar ao catálogo" onPress={() => router.replace('/(main)/catalog')} /></View> : <>
    {step === 1 && <><Text style={s.title}>⌖ PONTO DE ENTREGA</Text><View style={s.card}><Text style={s.green}>ENDEREÇO DA GARAGEM</Text><Text style={s.title}>{recipient}</Text><Text style={s.body}>{address || 'Cadastre seu endereço de entrega para continuar.'}</Text><CheckoutButton label={savedCep ? 'ALTERAR ENDEREÇO' : 'CADASTRAR ENDEREÇO'} onPress={() => router.push('/address')} /></View>{savedCep && <CartShipping key={savedCep} subtotal={totals.subtotal} selected={delivery} onSelect={setDelivery} lockedCep={savedCep} />}<View style={s.card}><Text style={s.title}>Instruções especiais de peças</Text><Text style={s.body}>Orientações de entrega e cuidados com o pacote (opcional).</Text><TextInput accessibilityLabel="Instruções de entrega" value={instructions} onChangeText={setInstructions} maxLength={1000} multiline placeholder="Ex.: deixar na portaria com o responsável..." placeholderTextColor="#86948a" style={[s.input, s.textarea]} /></View></>}
    {step === 2 && <View style={s.card}><Text style={s.title}>Forma de pagamento</Text><Text style={s.body}>Escolha a opção para a simulação. Não haverá cobrança nem coleta de dados de cartão.</Text>{(['pix', 'card'] as const).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: payment === value }} onPress={() => setPayment(value)} style={[s.option, payment === value && s.selected]}><StoreIcon name={value === 'pix' ? 'qrcode' : 'credit-card-outline'} /><View style={s.flex}><Text style={s.title}>{value === 'pix' ? 'PIX' : 'Cartão de crédito'}</Text><Text style={s.body}>Simulação • sem processamento financeiro</Text></View><StoreIcon name={payment === value ? 'radiobox-marked' : 'radiobox-blank'} /></Pressable>)}</View>}
    {step === 3 && <View style={s.card}><Text style={s.title}>Revise seu pedido</Text><Text style={s.green}>{recipient}</Text><Text style={s.body}>{address}</Text><Text style={s.body}>CEP {delivery?.cep} • {delivery?.service === 'express' ? 'Express' : 'Econômica'}</Text><Text style={s.body}>Pagamento escolhido: {payment === 'pix' ? 'PIX' : 'Cartão de crédito'} (simulado)</Text>{!!instructions && <Text style={s.body}>Instruções: {instructions}</Text>}<Text style={s.note}>Ao confirmar, o pedido será salvo em sua conta. Nenhum pagamento ou envio real será realizado.</Text></View>}
    <View style={s.card}><Text style={s.title}>▣ PACOTE MOTORSPORT</Text>{items.map(item => <View key={item.id} style={s.row}><Text style={[s.body, s.flex]}>{item.name}</Text><Text style={s.body}>{item.quantity}x</Text></View>)}<OrderTotals {...totals} coupon={totals.validCoupon} /><Text style={s.note}>Frete e prazos de demonstração.</Text></View>
    {!!error && <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>}
    <View style={s.card}><Text style={s.label}>TOTAL {delivery ? 'COM ENVIO' : 'SEM FRETE'}</Text><Amount value={totals.total} /><CheckoutButton label={busy ? 'SALVANDO PEDIDO...' : step === 3 ? 'CONFIRMAR PEDIDO DEMO' : 'PROSSEGUIR →'} disabled={busy} onPress={step === 3 ? () => void finish() : advance} /></View></>}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
