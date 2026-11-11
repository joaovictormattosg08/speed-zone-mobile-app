import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Product, money } from '../data/products';
import { useStore } from '../context/StoreContext';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { fonts, ThemeColors } from '../theme/tokens';
import { StoreIcon } from './StoreHeader';

export function ProductCard({ product, list = false }: { product: Product; list?: boolean }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const { cart, add } = useStore();
  const unavailable = (product.stock ?? 0) <= (cart[product.id] || 0);
  const open = () => router.push({ pathname: '/product/[id]', params: { id: product.id } });
  return <View style={[s.card, list && s.list]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Ver foto e detalhes de ${product.name}`} onPress={open} style={[s.media, list && s.listMedia]}>
      <Image source={product.image} style={s.image} resizeMode="contain" />
      <View style={s.stage}><Text style={s.stageText}>{product.stage}</Text></View>
    </Pressable>
    <View style={s.details}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalhes de ${product.name}`} onPress={open}>
        <Text style={s.category}>{product.category.toUpperCase()}</Text>
        <Text numberOfLines={3} style={s.name}>{product.name}</Text>
        <Text numberOfLines={2} style={s.fit}>{product.fit}</Text>
      </Pressable>
      <View style={s.priceRow}><View style={s.priceColumn}>
        {!!product.oldPrice && <Text style={s.oldPrice}>{money(product.oldPrice)}</Text>}
        <Text adjustsFontSizeToFit numberOfLines={1} style={s.price}>{money(product.price)}</Text>
        <Text style={s.caption}>{(product.stock ?? 0) > 0 ? 'À vista' : 'Sem estoque'}</Text>
      </View><Pressable accessibilityRole="button" accessibilityLabel={`Adicionar ${product.name} ao carrinho`} accessibilityState={{ disabled: unavailable }} disabled={unavailable} onPress={() => add(product.id)} style={({ pressed }) => [s.add, (pressed || unavailable) && { opacity: .45 }]}><StoreIcon name={cart[product.id] ? 'cart-check' : 'plus'} color={colors.onPrimary} size={22} /></Pressable></View>
    </View>
  </View>;
}
const createStyles = (c: ThemeColors) => StyleSheet.create({
  card: { width: '48%', padding: 12, backgroundColor: c.panel, borderRadius: 24, gap: 12, borderWidth: 1, borderColor: c.surfaceBorder },
  list: { width: '100%', flexDirection: 'row', padding: 16, gap: 16 },
  media: { width: '100%', aspectRatio: 1, backgroundColor: c.input, borderRadius: 18, overflow: 'hidden', padding: 10 },
  listMedia: { width: '29%', alignSelf: 'center' }, image: { width: '100%', height: '100%' },
  stage: { position: 'absolute', top: 8, left: 8, backgroundColor: c.hero, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 }, stageText: { color: c.onHero, fontFamily: fonts.bold, fontSize: 8 },
  details: { flex: 1, justifyContent: 'space-between', gap: 14 }, category: { color: c.primary, fontFamily: fonts.bold, fontSize: 9, letterSpacing: .8, marginBottom: 6 },
  name: { color: c.text, fontFamily: fonts.bold, fontSize: 13, lineHeight: 19 }, fit: { color: c.muted, fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, marginTop: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, priceColumn: { flex: 1 }, price: { color: c.text, fontFamily: fonts.bold, fontSize: 17, letterSpacing: -.5 },
  oldPrice: { color: c.subtle, fontFamily: fonts.regular, fontSize: 10, textDecorationLine: 'line-through' }, caption: { color: c.subtle, fontFamily: fonts.regular, fontSize: 10, marginTop: 3 },
  add: { minWidth: 44, minHeight: 44, backgroundColor: c.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
