import { ThemeColors , fonts as f } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AdminNavigation } from './AdminNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PilotAvatar } from './PilotAvatar';
export function AdminProductShell({ children, footer, title = 'Produtos' }: PropsWithChildren<{ title?: string; footer?: React.ReactNode }>) {

  const ps = useThemedStyles(createPs);

  return <SafeAreaView style={ps.safe}><View style={ps.header}><Text style={ps.logo}>ϟ SPEED<Text style={ps.green}>ZONE</Text></Text><View style={ps.flex}><Text style={ps.eyebrow}>SPEEDZONE OPS</Text><Text style={ps.title}>{title}</Text></View><PilotAvatar /></View>{children}{footer}<AdminNavigation current="/admin-products" onReselect={title === 'Produtos' ? () => router.navigate('/admin-products') : undefined} /></SafeAreaView>;
}
export function ProductAction({ label, onPress, primary = false, danger = false, disabled = false }: { label: string; onPress: () => void; primary?: boolean; danger?: boolean; disabled?: boolean }) {
  const { colors: c } = useTheme();
  const ps = useThemedStyles(createPs);

  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [ps.button, primary && ps.primary, danger && { backgroundColor: '#381a1e', borderColor: c.error }, pressed && { opacity: .75 }, disabled && { opacity: .45 }]}><Text style={[ps.buttonText, primary && { color: c.onPrimary }, danger && { color: c.error }]}>{label}</Text></Pressable>;
}
export const createPs = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background }, flex: { flex: 1, minWidth: 0 }, header: { flexDirection: 'row', alignItems: 'center', gap: 20, padding: 18, backgroundColor: c.deepest }, logo: { fontFamily: f.heavy, color: c.text, fontSize: 12, fontStyle: 'italic' }, eyebrow: { fontFamily: f.bold, color: c.primary, fontSize: 10, letterSpacing: .6 }, title: { fontFamily: f.bold, color: c.text, fontSize: 20, lineHeight: 27 }, section: { fontFamily: f.medium, color: c.text, fontSize: 15, lineHeight: 22 }, body: { fontFamily: f.regular, color: c.muted, fontSize: 13, lineHeight: 19 }, small: { fontFamily: f.medium, color: c.subtle, fontSize: 11, lineHeight: 16 }, green: { color: c.primary }, price: { fontFamily: f.bold, color: c.primary, fontSize: 24 }, card: { borderWidth: 1, borderColor: c.surfaceBorder, backgroundColor: c.panel, borderRadius: 10, padding: 18, gap: 16 }, content: { padding: 16, gap: 20, paddingBottom: 28, width: '100%', maxWidth: 760, alignSelf: 'center' }, row: { flexDirection: 'row', gap: 12, alignItems: 'center' }, between: { flexDirection: 'row', gap: 12, justifyContent: 'space-between', alignItems: 'center' }, button: { borderWidth: 1, borderColor: c.border, minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: c.secondaryAction, borderRadius: 6 }, primary: { backgroundColor: c.primary, borderColor: c.primary }, buttonText: { fontFamily: f.medium, color: c.text, fontSize: 14, textAlign: 'center' }, input: { borderWidth: 1, borderColor: c.border, backgroundColor: c.input, color: c.text, fontFamily: f.regular, fontSize: 14, padding: 14, minHeight: 48, borderRadius: 5 }, chip: { borderWidth: 1, borderColor: c.border, padding: 12, backgroundColor: c.elevated, borderRadius: 8, minHeight: 44, justifyContent: 'center' }, active: { backgroundColor: c.primarySoft, borderColor: c.primary, borderWidth: 1 }, error: { color: c.error, fontFamily: f.regular, fontSize: 13, lineHeight: 19 }, footer: { padding: 14, backgroundColor: c.deepest, gap: 10 }, nav: { flexDirection: 'row', padding: 12, backgroundColor: c.deepest }, navItem: { flex: 1, alignItems: 'center', gap: 5, minHeight: 44 }, overlay: { flex: 1, backgroundColor: '#000b', justifyContent: 'center', padding: 24 }, image: { width: 96, height: 110, borderRadius: 6, backgroundColor: c.input }, label: { fontFamily: f.medium, color: c.muted, fontSize: 12, marginBottom: 7 },
});
