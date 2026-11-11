import { ComponentProps } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../context/StoreContext';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { fonts, ThemeColors } from '../theme/tokens';

export function StoreIcon({ name, color, size = 22 }: { name: ComponentProps<typeof MaterialCommunityIcons>['name']; color?: string; size?: number }) {
  const { colors } = useTheme();
  return <MaterialCommunityIcons name={name} color={color ?? colors.primary} size={size} />;
}
export function StoreHeader({ title = 'Início' }: { title?: string }) {
  const { count } = useStore();
  const { colors, mode, setPreference } = useTheme();
  const s = useThemedStyles(createStyles);
  return <View style={s.header}><View style={s.inner}>
    <View style={s.mark}><StoreIcon name="lightning-bolt-circle" size={27} color={colors.hero} /></View>
    <View style={s.heading}><Text style={s.eyebrow}>SPEEDZONE</Text><Text numberOfLines={1} style={s.title}>{title}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel={mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} onPress={() => setPreference(mode === 'dark' ? 'light' : 'dark')} style={s.action}><StoreIcon name={mode === 'dark' ? 'white-balance-sunny' : 'moon-waning-crescent'} color={colors.text} size={21} /></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`Carrinho, ${count} itens`} onPress={() => router.navigate('/(main)/cart')} style={s.action}><StoreIcon name="shopping-outline" color={colors.text} />{count > 0 && <View style={s.badge}><Text style={s.badgeText}>{count}</Text></View>}</Pressable>
  </View></View>;
}
const createStyles = (c: ThemeColors) => StyleSheet.create({
  header: { backgroundColor: c.background }, inner: { width: '100%', maxWidth: 600, alignSelf: 'center', minHeight: 80, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#0B0F0D', alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0 }, eyebrow: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 1.6, color: c.primary, marginBottom: 4 }, title: { fontFamily: fonts.bold, fontSize: 16, color: c.text },
  action: { width: 44, height: 46, borderRadius: 16, backgroundColor: c.panel, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: c.primary, minWidth: 16, borderRadius: 8, paddingHorizontal: 4 }, badgeText: { fontFamily: fonts.bold, color: c.onPrimary, fontSize: 10, textAlign: 'center' },
});
