import { PilotAvatar } from '../components/PilotAvatar';
import { ComponentProps, PropsWithChildren, useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { StoreIcon } from '../components/StoreHeader';
import { DEMO_STOCK, useStore } from '../context/StoreContext';
import { getProductDetails } from '../data/productDetails';
import { money, products } from '../data/products';
import { colors as c, fonts as f } from '../theme/tokens';

const blue = '#7bd0ff';
function Accordion({ title, icon, color = blue, initiallyOpen = false, children }: PropsWithChildren<{ title: string; icon: ComponentProps<typeof StoreIcon>['name']; color?: string; initiallyOpen?: boolean }>) {
  const [open, setOpen] = useState(initiallyOpen);
  return <View style={s.accordion}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={({ pressed }) => [s.accordionHeader, pressed && s.pressed]}>
      <StoreIcon name={icon} color={color} size={21} /><Text style={s.accordionTitle}>{title}</Text><StoreIcon name={open ? 'chevron-up' : 'chevron-down'} size={20} color={c.muted} />
    </Pressable>
    {open && <View style={s.accordionBody}>{children}</View>}
  </View>;
}

export default function ProductScreen({ id }: { id: string }) {
  const product = products.find(item => item.id === id);
  const { cart, add, favorites, toggleFavorite } = useStore();
  const [slide, setSlide] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [available, setAvailable] = useState(true);
  const [cep, setCep] = useState('');
  const [shipping, setShipping] = useState(false);
  const [cepError, setCepError] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; cart?: boolean } | null>(null);
  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 4500);
    return () => clearTimeout(timeout);
  }, [feedback]);
  function back() { if (router.canGoBack()) router.back(); else router.replace('/(main)/catalog'); }
  if (!product) return <SafeAreaView style={s.safe}><View style={s.notFound}><StoreIcon name="package-variant" size={48} /><Text style={s.title}>Peça não encontrada</Text><Text style={s.body}>Este produto não está disponível no catálogo.</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/(main)/catalog')} style={s.buy}><Text style={s.buyText}>Voltar ao Catálogo</Text></Pressable></View></SafeAreaView>;

  const details = getProductDetails(product);
  const remaining = Math.max(0, DEMO_STOCK - (cart[id] ?? 0));
  const selectedQuantity = Math.min(quantity, Math.max(1, remaining));
  const canAdd = available && remaining > 0;
  const favorite = favorites.includes(id);
  const cardPrice = product.id === 'SZ-TUR-660-TS' ? product.price / 0.95 : product.price;
  async function copySku() {
    try {
      const copied = await Clipboard.setStringAsync(id);
      setFeedback({ text: copied ? `SKU ${id} copiado!` : 'Não foi possível copiar o SKU. Tente novamente.' });
    } catch { setFeedback({ text: 'Não foi possível acessar a área de transferência.' }); }
  }
  async function shareProduct() {
    const message = `${product!.name}\nSKU: ${id}\n${money(product!.price)} à vista · SpeedZone`;
    try {
      if (Platform.OS === 'web') {
        const copied = await Clipboard.setStringAsync(message);
        setFeedback({ text: copied ? 'Dados da peça copiados para compartilhar.' : 'Não foi possível copiar os dados da peça.' });
      } else await Share.share({ title: product!.name, message });
    } catch { setFeedback({ text: 'Não foi possível compartilhar a peça. Tente novamente.' }); }
  }
  function addToCart() {
    if (!canAdd) return;
    add(id, selectedQuantity);
    setFeedback({ text: `${selectedQuantity} ${selectedQuantity === 1 ? 'unidade adicionada' : 'unidades adicionadas'} ao carrinho.`, cart: true });
    setQuantity(1);
  }
  function calculateShipping() {
    if (cep.replace(/\D/g, '').length !== 8) { setCepError('Informe um CEP com 8 dígitos.'); setShipping(false); return; }
    setCepError(''); setShipping(true);
  }
  return <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}>
    <View style={s.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={back} style={s.iconButton}><StoreIcon name="arrow-left" color={c.text} /></Pressable>
      <View style={s.brand}><StoreIcon name="speedometer" size={20} /><View><Text style={s.brandName}>SPEED<Text style={{ color: c.primary }}>ZONE</Text></Text><Text style={s.brandCaption}>A U T O P A R T S</Text></View></View>
      <Text numberOfLines={1} style={s.headerTitle}>DETALHES DA PEÇA</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Minha conta" onPress={() => router.navigate('/(main)/account')} style={s.iconButton}><PilotAvatar /></Pressable>
    </View>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.toolbar}><Pressable accessibilityRole="button" onPress={() => router.navigate('/(main)/catalog')} style={s.backCatalog}><StoreIcon name="chevron-left" color={blue} size={21} /><Text style={s.catalogText}>Voltar ao Catálogo</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Compartilhar produto" onPress={shareProduct} style={s.toolButton}><StoreIcon name="share-variant-outline" color={c.text} size={20} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={favorite ? 'Remover dos favoritos' : 'Favoritar produto'} accessibilityState={{ selected: favorite }} onPress={() => toggleFavorite(id)} style={s.toolButton}><StoreIcon name={favorite ? 'heart' : 'heart-outline'} color={favorite ? c.error : c.text} size={21} /></Pressable></View>
        <View style={s.content}>
          <View style={s.gallery}>
            <Image source={details.gallery[slide].image} accessibilityLabel={details.gallery[slide].label} style={s.mainImage} resizeMode="cover" />
            <View pointerEvents="none" style={s.imageBadges}><View style={s.original}><StoreIcon name="check-decagram-outline" color={c.onPrimary} size={12} /><Text style={s.originalText}>{details.seal}</Text></View><View style={s.stage}><Text style={s.stageText}>{details.stage}</Text></View></View>
            <View style={s.counter}><Text style={s.counterText}><Text style={{ color: c.primary }}>{slide + 1}</Text> / {details.gallery.length}</Text></View>
          </View>
          {details.gallery.length > 1 && <View style={s.thumbnails}>{details.gallery.map((photo, index) => <Pressable key={photo.label} accessibilityRole="button" accessibilityLabel={`Ver foto ${index + 1}: ${photo.label}`} accessibilityState={{ selected: slide === index }} onPress={() => setSlide(index)} style={[s.thumbnail, slide === index && s.thumbnailActive]}><Image source={photo.image} style={s.thumbnailImage} resizeMode="cover" /></Pressable>)}</View>}
          <View style={s.identification}><Text style={s.category}>{product.category.toUpperCase()} / PERFORMANCE RACING</Text><Pressable accessibilityRole="button" accessibilityLabel={`Copiar SKU ${id}`} onPress={copySku} style={s.sku}><Text style={s.skuLabel}>SKU:</Text><Text style={s.skuCode}>{id}</Text><StoreIcon name="content-copy" size={13} color={c.muted} /></Pressable></View>
          <Text style={s.title}>{product.name}</Text>
          <View style={s.stock}><View style={[s.dot, !available && { backgroundColor: c.error }]} /><Text style={[s.stockLabel, !available && { color: c.error }]}>{available ? 'Em Estoque' : 'Indisponível'}</Text><Text style={s.stockText}>{available ? `• ${DEMO_STOCK} unidades no CD São Paulo` : '• Aguarde a reposição desta peça'}</Text></View>
          <View style={s.pricePanel}><View style={s.priceHeading}><Text style={s.price}>{money(product.price)}</Text>{product.id === 'SZ-TUR-660-TS' && <View style={s.discount}><Text style={s.discountText}>-5% OFF</Text></View>}</View><Text style={s.paymentLabel}>À VISTA NO PIX COM DESPACHO IMEDIATO</Text><View style={s.installments}><StoreIcon name="credit-card-outline" color={blue} size={21} /><Text style={s.installmentText}>ou até <Text style={{ fontFamily: f.medium }}>12x de {money(cardPrice / 12)}</Text> sem juros</Text><Text style={s.cardLabel}>CARTÃO</Text></View></View>
          <View style={s.quantityPanel}><Text style={s.quantityLabel}>Quantidade:</Text><View style={s.stepper}><Pressable accessibilityRole="button" accessibilityLabel="Diminuir quantidade" accessibilityState={{ disabled: !canAdd || selectedQuantity <= 1 }} disabled={!canAdd || selectedQuantity <= 1} onPress={() => setQuantity(selectedQuantity - 1)} style={[s.stepButton, (!canAdd || selectedQuantity <= 1) && s.disabled]}><StoreIcon name="minus" color={c.text} size={20} /></Pressable><Text accessibilityLiveRegion="polite" style={s.quantity}>{selectedQuantity}</Text><Pressable accessibilityRole="button" accessibilityLabel="Aumentar quantidade" accessibilityState={{ disabled: !canAdd || selectedQuantity >= remaining }} disabled={!canAdd || selectedQuantity >= remaining} onPress={() => setQuantity(selectedQuantity + 1)} style={[s.stepButton, (!canAdd || selectedQuantity >= remaining) && s.disabled]}><StoreIcon name="plus" color={c.text} size={20} /></Pressable></View></View>
          {(cart[id] ?? 0) > 0 && <Text style={s.cartHint}>{cart[id]} no carrinho · {remaining} {remaining === 1 ? 'unidade disponível' : 'unidades disponíveis'} para adicionar</Text>}
          <View style={s.simulation}><View style={s.simulationLabel}><StoreIcon name="tune" size={14} color={c.subtle} /><Text style={s.micro}>Simular disponibilidade:</Text></View><Pressable accessibilityRole="button" onPress={() => setAvailable(!available)} style={s.simulationButton}><Text style={s.simulationText}>{available ? 'Alternar p/ Indisponível' : 'Reativar Estoque'}</Text></Pressable></View>
          <View style={s.accordions}>
            <Accordion title="Descrição & Aplicação Mecânica" icon="information-outline" initiallyOpen><Text style={s.body}>{details.description}</Text><View style={s.applications}><Text style={s.applicationsTitle}>APLICAÇÕES DE REFERÊNCIA:</Text>{details.applications.map(application => <View style={s.application} key={application}><StoreIcon name="check" size={15} /><Text style={s.applicationText}>{application}</Text></View>)}</View></Accordion>
            <Accordion title="Ficha Técnica & Telemetria" icon="tune" color={c.primary} initiallyOpen><View style={s.metrics}>{details.metrics.map((metric, index) => <View key={metric.label} style={s.metric}><Text style={s.micro}>{metric.label}</Text><Text style={[s.metricValue, index === 0 && { color: c.primary }]}>{metric.value}</Text></View>)}</View><View>{details.specs.map(([label, value], index) => <View key={label} style={[s.specRow, index % 2 === 0 && { backgroundColor: c.panel }]}><Text style={s.specLabel}>{label}:</Text><Text style={[s.specValue, index === details.specs.length - 1 && { color: blue }]}>{value}</Text></View>)}</View></Accordion>
            <Accordion title="Calcular Frete & Prazo de Entrega" icon="truck-delivery-outline" color="#ffb95f"><View style={s.shippingForm}><TextInput accessibilityLabel="CEP de entrega" placeholder="00000-000" placeholderTextColor={c.subtle} keyboardType="number-pad" maxLength={9} value={cep} onChangeText={value => { setCep(value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')); setShipping(false); setCepError(''); }} onSubmitEditing={calculateShipping} style={s.cep} /><Pressable accessibilityRole="button" onPress={calculateShipping} style={s.calculate}><Text style={s.calculateText}>Calcular</Text></Pressable></View>{cepError !== '' && <Text accessibilityRole="alert" style={s.error}>{cepError}</Text>}{shipping && <View accessibilityLiveRegion="polite" style={s.shippingResults}><Text style={s.shippingNotice}>Simulação para {cep}. Valores e prazos ilustrativos.</Text>{[{ name: 'SpeedZone Express', days: '1 a 2 dias úteis', price: 48.9, icon: 'lightning-bolt-outline' }, { name: 'Entrega Econômica', days: '3 a 5 dias úteis', price: 32.5, icon: 'package-variant-closed' }].map(option => <View key={option.name} style={s.shippingOption}><StoreIcon name={option.icon as ComponentProps<typeof StoreIcon>['name']} size={20} /><View style={s.flex}><Text style={s.applicationText}>{option.name}</Text><Text style={s.body}>{option.days}</Text></View><Text style={s.shippingPrice}>{money(option.price)}</Text></View>)}</View>}</Accordion>
          </View>
          <Text style={s.demo}>MODO DEMONSTRAÇÃO · DADOS DO CATÁLOGO ILUSTRATIVOS</Text>
        </View>
      </ScrollView>
      <SafeAreaView edges={['bottom']} style={s.bottom}><View style={s.bottomInner}><View style={s.total}><Text style={s.totalLabel}>Total à vista:</Text><Text numberOfLines={1} adjustsFontSizeToFit style={s.totalPrice}>{money(product.price * selectedQuantity)}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={canAdd ? 'Adicionar ao Carrinho' : 'Produto indisponível para adicionar'} accessibilityState={{ disabled: !canAdd }} disabled={!canAdd} onPress={addToCart} style={({ pressed }) => [s.buy, !canAdd && s.buyDisabled, pressed && s.pressed]}><StoreIcon name={canAdd ? 'cart-outline' : 'cart-off'} size={23} color={canAdd ? c.onPrimary : c.subtle} /><Text style={[s.buyText, !canAdd && { color: c.subtle }]}>{!available ? 'Produto Indisponível' : remaining === 0 ? 'Limite no Carrinho' : 'Adicionar ao Carrinho'}</Text></Pressable></View></SafeAreaView>
    </KeyboardAvoidingView>
    {feedback && <View accessibilityLiveRegion="polite" style={s.feedback}><StoreIcon name="check-circle-outline" size={22} /><View style={s.flex}><Text style={s.feedbackText}>{feedback.text}</Text>{feedback.cart && <Pressable accessibilityRole="button" onPress={() => { setFeedback(null); router.navigate('/(main)/cart'); }} style={s.feedbackLink}><Text style={s.calculateText}>Ver carrinho →</Text></Pressable>}</View><Pressable accessibilityRole="button" accessibilityLabel="Fechar mensagem" onPress={() => setFeedback(null)} style={s.iconButton}><StoreIcon name="close" size={18} /></Pressable></View>}
  </SafeAreaView>;
}

const s = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: c.background }, scroll: { flexGrow: 1 },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, backgroundColor: c.deepest }, iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, brand: { flexDirection: 'row', gap: 3, alignItems: 'center' }, brandName: { fontFamily: f.heavy, fontSize: 10, fontStyle: 'italic', color: c.text }, brandCaption: { color: c.muted, fontSize: 5, letterSpacing: 0.4 }, headerTitle: { flex: 1, fontFamily: f.bold, fontSize: 15, color: c.text, letterSpacing: -0.5 }, avatar: { height: 30, width: 30, borderRadius: 9 },
  toolbar: { minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.deepest }, backCatalog: { flex: 1, flexDirection: 'row', gap: 4, alignItems: 'center', minHeight: 44 }, catalogText: { color: blue, fontFamily: f.medium, fontSize: 12 }, toolButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: c.panel, borderRadius: 12 },
  content: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 16, paddingTop: 8, paddingBottom: 28 }, gallery: { aspectRatio: 1, backgroundColor: c.deepest, borderRadius: 8, overflow: 'hidden' }, mainImage: { width: '100%', height: '100%' }, imageBadges: { position: 'absolute', top: 12, left: 12, gap: 5 }, original: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: c.primary, borderRadius: 2 }, originalText: { fontFamily: f.medium, fontSize: 9, color: c.onPrimary, letterSpacing: 0.6 }, stage: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#272a2dec', borderRadius: 2 }, stageText: { color: blue, fontFamily: f.medium, fontSize: 10, letterSpacing: 0.5 }, counter: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#0b0e11cc', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 3 }, counterText: { color: c.muted, fontFamily: f.bold, fontSize: 14 }, thumbnails: { flexDirection: 'row', gap: 8, marginTop: 8 }, thumbnail: { flex: 1, aspectRatio: 1, borderWidth: 2, borderColor: 'transparent', borderRadius: 4, overflow: 'hidden', opacity: 0.65 }, thumbnailActive: { borderColor: c.primary, opacity: 1 }, thumbnailImage: { width: '100%', height: '100%' },
  identification: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5, flexWrap: 'wrap' }, category: { color: blue, fontFamily: f.bold, fontSize: 9, letterSpacing: 0.8 }, sku: { minHeight: 40, paddingHorizontal: 8, gap: 5, flexDirection: 'row', alignItems: 'center', borderRadius: 3, backgroundColor: c.elevated }, skuLabel: { fontFamily: f.regular, color: c.subtle, fontSize: 9 }, skuCode: { color: c.primary, fontFamily: f.medium, fontSize: 11 }, title: { color: c.text, fontFamily: f.bold, fontSize: 21, lineHeight: 25, letterSpacing: -0.7, marginTop: 5 }, stock: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' }, dot: { height: 9, width: 9, borderRadius: 5, backgroundColor: c.primary }, stockLabel: { color: c.primary, fontSize: 12, fontFamily: f.medium }, stockText: { color: c.muted, fontSize: 11, fontFamily: f.regular },
  pricePanel: { padding: 16, backgroundColor: c.input, borderRadius: 8, marginTop: 18, gap: 4 }, priceHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }, price: { fontFamily: f.heavy, fontSize: 29, color: c.primary, letterSpacing: -1 }, discount: { backgroundColor: '#10b98120', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 4 }, discountText: { color: c.primary, fontFamily: f.bold, fontSize: 10 }, paymentLabel: { fontFamily: f.medium, color: c.muted, fontSize: 9, letterSpacing: 0.5 }, installments: { marginTop: 8, backgroundColor: c.panel, borderRadius: 4, padding: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }, installmentText: { flex: 1, fontFamily: f.regular, fontSize: 11, color: c.text }, cardLabel: { fontFamily: f.bold, fontSize: 9, color: blue },
  quantityPanel: { marginTop: 16, padding: 8, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.panel, borderRadius: 8 }, quantityLabel: { color: c.text, fontFamily: f.medium, fontSize: 14 }, stepper: { padding: 4, backgroundColor: c.deepest, borderRadius: 4, flexDirection: 'row', alignItems: 'center' }, stepButton: { height: 44, width: 44, backgroundColor: c.panel, borderRadius: 2, alignItems: 'center', justifyContent: 'center' }, quantity: { width: 44, textAlign: 'center', fontFamily: f.bold, color: c.text, fontSize: 18 }, disabled: { opacity: 0.4 }, cartHint: { fontFamily: f.regular, color: c.primary, fontSize: 11, marginTop: 8 }, simulation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, marginTop: 4 }, simulationLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 }, micro: { color: c.subtle, fontFamily: f.medium, fontSize: 9, letterSpacing: 0.4 }, simulationButton: { paddingHorizontal: 8, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, simulationText: { color: c.muted, fontFamily: f.medium, fontSize: 9, backgroundColor: c.elevated, padding: 6, borderRadius: 3 },
  accordions: { marginTop: 20, gap: 8 }, accordion: { backgroundColor: c.input, borderRadius: 8, overflow: 'hidden' }, accordionHeader: { minHeight: 56, padding: 16, backgroundColor: c.panel, flexDirection: 'row', gap: 9, alignItems: 'center' }, accordionTitle: { flex: 1, fontFamily: f.medium, color: c.text, fontSize: 15, letterSpacing: -0.4 }, accordionBody: { padding: 16, gap: 12 }, body: { fontFamily: f.regular, color: c.muted, fontSize: 12, lineHeight: 17 }, applications: { backgroundColor: c.deepest, borderRadius: 4, padding: 9, gap: 6 }, applicationsTitle: { fontFamily: f.bold, color: c.primary, fontSize: 11, letterSpacing: 0.5 }, application: { flexDirection: 'row', gap: 7, alignItems: 'flex-start' }, applicationText: { fontFamily: f.medium, fontSize: 12, lineHeight: 16, color: c.text, flexShrink: 1 }, metrics: { flexDirection: 'row', gap: 6 }, metric: { flex: 1, backgroundColor: c.deepest, padding: 9, gap: 4 }, metricValue: { color: c.text, fontFamily: f.bold, fontSize: 18 }, specRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, paddingHorizontal: 7 }, specLabel: { flex: 1.1, fontFamily: f.regular, fontSize: 12, lineHeight: 16, color: c.muted }, specValue: { flex: 1, fontFamily: f.medium, fontSize: 12, lineHeight: 16, color: c.text },
  shippingForm: { flexDirection: 'row', gap: 8 }, cep: { flex: 1, minWidth: 0, backgroundColor: c.deepest, borderRadius: 4, minHeight: 48, paddingHorizontal: 14, fontFamily: f.medium, fontSize: 14, color: c.text }, calculate: { minHeight: 48, paddingHorizontal: 18, justifyContent: 'center', backgroundColor: c.elevated, borderRadius: 4 }, calculateText: { fontFamily: f.medium, color: c.primary, fontSize: 12 }, error: { color: c.error, fontFamily: f.regular, fontSize: 12 }, shippingResults: { gap: 8 }, shippingNotice: { fontFamily: f.regular, fontSize: 11, lineHeight: 16, color: c.subtle }, shippingOption: { padding: 10, backgroundColor: c.deepest, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 4 }, shippingPrice: { fontFamily: f.bold, fontSize: 12, color: c.primary },
  demo: { fontFamily: f.regular, fontSize: 8, letterSpacing: 0.7, color: c.subtle, textAlign: 'center', marginTop: 20 }, bottom: { backgroundColor: c.deepest, boxShadow: '0 -5px 24px #0004' }, bottomInner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, maxWidth: 600, width: '100%', alignSelf: 'center' }, total: { width: 112 }, totalLabel: { fontFamily: f.medium, color: c.muted, fontSize: 10, letterSpacing: 0.5 }, totalPrice: { color: c.primary, fontFamily: f.bold, fontSize: 16 }, buy: { flex: 1, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 10, backgroundColor: c.primary, borderRadius: 8, boxShadow: '0 0 18px #4edea325' }, buyText: { flexShrink: 1, textAlign: 'center', fontFamily: f.bold, fontSize: 15, color: c.onPrimary }, buyDisabled: { backgroundColor: c.elevated, boxShadow: 'none' }, pressed: { opacity: 0.75 }, feedback: { position: 'absolute', top: 112, left: 16, right: 16, alignSelf: 'center', backgroundColor: c.elevated, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: c.primary, flexDirection: 'row', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px #0008' }, feedbackText: { fontFamily: f.medium, fontSize: 12, color: c.text, lineHeight: 17 }, feedbackLink: { minHeight: 44, justifyContent: 'center' }, notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32 },
});

