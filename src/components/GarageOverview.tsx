import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useLoyalty } from '../hooks/useLoyalty';
import { useThemedStyles } from '../theme/ThemeContext';
import { fonts, ThemeColors } from '../theme/tokens';
import { StoreIcon } from './StoreHeader';

export function GarageOverview() {
  const s = useThemedStyles(createStyles);
  const { user } = useAuth();
  const { vehicle, count } = useStore();
  const loyalty = useLoyalty();
  const [hidden, setHidden] = useState(false);
  return <View style={s.container}>
    <View><Text style={s.greeting}>Olá, {user?.name || 'piloto'}.</Text><Text style={s.subtitle}>Seu próximo upgrade começa aqui.</Text></View>
    <View style={s.balanceCard}>
      <View style={s.between}><Text style={s.subtitle}>Seus SpeedPoints</Text><View style={s.tag}><Text style={s.tagText}>SPEEDZONE CLUB</Text></View></View>
      <View style={s.balanceRow}><Text style={s.balance}>{hidden ? '••••' : loyalty.data ? loyalty.data.balance.toLocaleString('pt-BR') : '—'}<Text style={s.unit}> pts</Text></Text><Pressable accessibilityRole="button" accessibilityLabel={hidden ? 'Mostrar pontos' : 'Ocultar pontos'} onPress={() => setHidden(!hidden)} style={s.eye}><StoreIcon name={hidden ? 'eye-off-outline' : 'eye-outline'} /></Pressable></View>
      {loyalty.error ? <Pressable accessibilityRole="button" onPress={loyalty.refresh}><Text style={s.error}>Não foi possível carregar os pontos. Tentar novamente</Text></Pressable> : <Text style={s.caption}>{loyalty.loading ? 'Consultando seus pontos…' : 'Troque seus pontos por descontos para o projeto.'}</Text>}
      <Pressable accessibilityRole="button" onPress={() => router.push('/loyalty')} style={s.button}><Text style={s.buttonText}>Explorar benefícios</Text><StoreIcon name="arrow-top-right" color={s.buttonText.color} /></Pressable>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Abrir minha garagem" onPress={() => router.navigate('/(main)/account')} style={s.pass}>
      <View pointerEvents="none" style={s.passRing} />
      <View style={s.between}><Text style={s.passBrand}>SZ.</Text><Text style={s.passLabel}>GARAGEM SPEEDZONE</Text><StoreIcon name="chip" color={s.passBrand.color} size={30} /></View>
      <Text style={s.passCaption}>SEU PROJETO</Text><Text numberOfLines={2} style={s.vehicle}>{user?.cars.length ? vehicle : 'A pista é sua.'}</Text>
      <View style={s.between}><Text style={s.passOwner}>{user?.name} {user?.surname}</Text><View style={s.passPill}><Text style={s.passPillText}>Minha garagem ↗</Text></View></View>
    </Pressable>
    <View style={s.shortcuts}>{([
      { icon: 'magnify', label: 'Catálogo', route: '/(main)/catalog' },
      { icon: 'truck-delivery-outline', label: 'Pedidos', route: '/(main)/orders' },
      { icon: 'cart-outline', label: count ? `Carrinho (${count})` : 'Carrinho', route: '/(main)/cart' },
      { icon: 'message-text-outline', label: 'Suporte', route: '/support' },
    ] as const).map(item => <Pressable key={item.route} accessibilityRole="button" onPress={() => router.navigate(item.route)} style={s.shortcut}><View style={s.shortcutIcon}><StoreIcon name={item.icon} size={25} /></View><Text style={s.shortcutLabel}>{item.label}</Text></Pressable>)}</View>
  </View>;
}
const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {borderRadius: 24,  gap: 20, marginBottom: 24 }, greeting: { color: c.text, fontFamily: fonts.bold, fontSize: 28, letterSpacing: -1 }, subtitle: { color: c.muted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21 },
  balanceCard: { padding: 22, gap: 8, backgroundColor: c.panel, borderRadius: 28, boxShadow: '0 8px 28px #00000005' }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  tag: { backgroundColor: c.primarySoft, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 }, tagText: { color: c.primary, fontSize: 9, fontFamily: fonts.bold, letterSpacing: .6 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, balance: { color: c.text, fontFamily: fonts.heavy, fontSize: 40, letterSpacing: -1.5 }, unit: { fontSize: 16, fontFamily: fonts.medium, letterSpacing: 0 }, eye: { padding: 12, minHeight: 44 },
  caption: { color: c.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 }, error: { color: c.error, fontSize: 12, lineHeight: 18, paddingVertical: 10 },
  button: { backgroundColor: c.text, minHeight: 54, padding: 14, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }, buttonText: { color: c.panel, fontFamily: fonts.bold, fontSize: 14 },
  pass: { backgroundColor: c.hero, padding: 22, borderRadius: 28, overflow: 'hidden', gap: 12, minHeight: 205 }, passRing: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 42, borderColor: '#063B2212', right: -70, top: -100 },
  passBrand: { color: c.onHero, fontFamily: fonts.heavy, fontSize: 32, fontStyle: 'italic' }, passLabel: { color: c.onHero, fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1 }, passCaption: { color: c.onHero, fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1, marginTop: 10 },
  vehicle: { color: c.onHero, fontFamily: fonts.bold, fontSize: 21, letterSpacing: -.5 }, passOwner: { color: c.onHero, fontFamily: fonts.medium, fontSize: 12, flexShrink: 1 }, passPill: { padding: 10, borderRadius: 18, backgroundColor: '#FFFFFFCF' }, passPillText: { color: c.onHero, fontFamily: fonts.bold, fontSize: 11 },
  shortcuts: { flexDirection: 'row', gap: 8 }, shortcut: { flex: 1, backgroundColor: c.panel, borderRadius: 20, alignItems: 'center', paddingVertical: 14, gap: 10 }, shortcutIcon: { backgroundColor: c.input, borderRadius: 15, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, shortcutLabel: { color: c.text, fontFamily: fonts.medium, fontSize: 10, textAlign: 'center' },
});
