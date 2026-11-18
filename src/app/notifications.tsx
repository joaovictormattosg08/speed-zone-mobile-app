import { ScreenHeader } from '../components/ScreenHeader';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Href, router } from 'expo-router';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../theme/ThemeContext';
import { StoreIcon } from '../components/StoreHeader';

export default function NotificationsScreen() {
  const { colors: c } = useTheme();
  const { items, loading, error, refresh, markRead } = useNotifications();
  return <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}><ScreenHeader title="Notificações" leading={<Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.canGoBack() ? router.back() : router.replace('/(main)/catalog')} style={{ padding: 12 }}><StoreIcon name="arrow-left" /></Pressable>} /><ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} />} contentContainerStyle={{ padding: 20, gap: 12, maxWidth: 600, width: '100%', alignSelf: 'center' }}>
    <Text style={{ color: c.muted }}>Pedidos, respostas do suporte e reposição das suas peças favoritas.</Text>
    {!!error && <Pressable accessibilityRole="button" onPress={() => void refresh()} style={{ paddingVertical: 14 }}><Text accessibilityRole="alert" style={{ color: c.error }}>{error} Toque para tentar novamente.</Text></Pressable>}
    {loading && <ActivityIndicator color={c.primary} />}
    {items.some(item => !item.read) && <Pressable accessibilityRole="button" onPress={() => void markRead('all').catch(() => {})} style={{ paddingVertical: 16 }}><Text style={{ color: c.primary }}>Marcar todas como lidas</Text></Pressable>}
    {!loading && !error && !items.length && <Text style={{ color: c.muted, paddingVertical: 40 }}>Nenhum aviso por enquanto. As próximas atualizações aparecerão aqui.</Text>}
    {items.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.read ? 'Lida' : 'Não lida'}: ${item.title}`} onPress={() => { router.push(item.target as Href); void markRead(item.id).catch(() => {}); }} style={{ backgroundColor: c.panel, borderRadius: 20, padding: 18, gap: 10, borderWidth: 1, borderColor: item.read ? c.border : c.primary }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><StoreIcon name={item.target.startsWith('/order/') ? 'truck-delivery-outline' : item.target.startsWith('/product/') ? 'heart-outline' : 'message-reply-text-outline'} /><Text style={{ color: c.text, fontSize: 15, fontWeight: item.read ? '400' : '700', flex: 1 }}>{item.title}</Text>{!item.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary }} />}</View>
      <Text style={{ color: c.muted, fontSize: 12 }}>{new Date(item.createdAt).toLocaleString('pt-BR')}</Text>
    </Pressable>)}
  </ScrollView></SafeAreaView>;
}
