import { ComponentProps } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useNotices } from '../context/NotificationContext';
import { useStore } from '../context/StoreContext';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { fonts, ThemeColors } from '../theme/tokens';

export function StoreIcon({ name, color, size = 22 }: { name: ComponentProps<typeof MaterialCommunityIcons>['name']; color?: string; size?: number }) {
  const { colors } = useTheme();
  return <MaterialCommunityIcons name={name} color={color ?? colors.primary} size={size} />;
}
export function HeaderAction({ icon, label, onPress, count = 0 }: {
  icon: ComponentProps<typeof StoreIcon>['name'];
  label: string;
  onPress: () => void;
  count?: number;
}) {
  const s = useThemedStyles(createStyles);
  return <Pressable accessibilityRole="button" accessibilityLabel={count > 0 ? `${label}, ${count}` : label}
    onPress={onPress} style={({ pressed }) => [s.action, s.referenceAction, pressed && s.pressed]}>
    <StoreIcon name={icon} color="#FFFFFF" size={22} />
    {count > 0 && <View style={s.noticeBadge}>
      <Text style={s.noticeCount}>{count > 99 ? '99+' : count}</Text>
    </View>}
  </Pressable>;
}
export function StoreHeader({ title = 'Início' }: { title?: string }) {
  const { count } = useStore();
  const { user } = useAuth();
  const { notices, read } = useNotices();
  const unread = notices.filter(notice => !read[notice.id]).length;
  const { colors, mode, setPreference } = useTheme();
  const s = useThemedStyles(createStyles);
  return <View style={s.header}><View style={s.inner}>
    <View style={s.mark}><StoreIcon name="lightning-bolt-circle" size={27} color={colors.hero} /></View>
    <View style={s.heading}><Text style={s.eyebrow}>SPEEDZONE</Text><Text numberOfLines={1} style={s.title}>{title}</Text></View>
    <HeaderAction
      icon={mode === 'dark' ? 'white-balance-sunny' : 'moon-waning-crescent'}
      label={mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      onPress={() => setPreference(mode === 'dark' ? 'light' : 'dark')}
    />
    {user && <HeaderAction icon="bell-outline" label="Notificações não lidas" count={unread}
      onPress={() => router.navigate('/notifications')} />}
    <Pressable accessibilityRole="button" accessibilityLabel={`Carrinho, ${count} itens`} onPress={() => router.navigate('/(main)/cart')} style={s.action}><StoreIcon name="shopping-outline" color={colors.text} />{count > 0 && <View style={s.badge}><Text style={s.badgeText}>{count}</Text></View>}</Pressable>
  </View></View>;
}
const createStyles = (c: ThemeColors) => StyleSheet.create({
  header: { backgroundColor: c.background }, inner: { width: '100%', maxWidth: 600, alignSelf: 'center', minHeight: 80, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#0B0F0D', alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0 }, eyebrow: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 1.6, color: c.primary, marginBottom: 4 }, title: { fontFamily: fonts.bold, fontSize: 16, color: c.text },
  action: { width: 44, height: 46, borderRadius: 16, backgroundColor: c.panel, alignItems: 'center', justifyContent: 'center' },
  referenceAction: { borderRadius: 18, backgroundColor: '#171C19' },
  pressed: { backgroundColor: '#28332C' },
  noticeBadge: {
    position: 'absolute', top: 0, right: 0, minWidth: 16, minHeight: 14,
    paddingHorizontal: 3, borderRadius: 8, backgroundColor: '#35C759',
    borderWidth: 1, borderColor: '#171C19', alignItems: 'center', justifyContent: 'center',
  },
  noticeCount: { fontFamily: fonts.bold, color: '#0B0F0D', fontSize: 9, lineHeight: 11 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: c.primary, minWidth: 16, borderRadius: 8, paddingHorizontal: 4 }, badgeText: { fontFamily: fonts.bold, color: c.onPrimary, fontSize: 10, textAlign: 'center' },
});
