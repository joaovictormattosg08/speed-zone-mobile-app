import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../theme/ThemeContext';
export function NotificationBell() {
  const { items, error } = useNotifications();
  const { colors } = useTheme();
  const count = items.filter(item => !item.read).length;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Notificações, ${count} não lidas${error ? ', falha ao atualizar' : ''}`} onPress={() => router.push('/notifications')} style={{ width: 44, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel }}>
    <MaterialCommunityIcons name="bell-outline" color={colors.text} size={23} />
    {(count > 0 || !!error) && <View style={{ position: 'absolute', right: 0, top: 0, borderRadius: 10, minWidth: 17, paddingHorizontal: 4, backgroundColor: colors.primary }}><Text style={{ color: colors.onPrimary, fontSize: 10, textAlign: 'center' }}>{error ? '!' : count > 99 ? '99+' : count}</Text></View>}
  </Pressable>;
}
