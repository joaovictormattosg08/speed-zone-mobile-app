import { router } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoreIcon } from '../components/StoreHeader';
import { Notice, useNotices } from '../context/NotificationContext';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/tokens';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { notices, read, markRead } = useNotices();
  const unreadIds = notices.filter(notice => !read[notice.id]).map(notice => notice.id);

  function open(notice: Notice) {
    markRead([notice.id]);
    const params = { id: notice.target };
    if (notice.kind === 'order') router.push({ pathname: '/order/[id]', params });
    else if (notice.kind === 'support') router.push({ pathname: '/support-ticket/[id]', params });
    else router.push({ pathname: '/product/[id]', params });
  }

  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <FlatList
      data={notices}
      keyExtractor={notice => notice.id}
      contentContainerStyle={{ padding: 20, gap: 12, width: '100%', maxWidth: 600, alignSelf: 'center' }}
      ListHeaderComponent={<View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" style={{ padding: 12 }}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(main)/home')}>
            <StoreIcon name="arrow-left" />
          </Pressable>
          <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 24 }}>Notificações</Text>
        </View>
        {unreadIds.length > 0 && <Pressable accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}
          onPress={() => markRead(unreadIds)}>
          <Text style={{ color: colors.primary }}>Marcar todas como lidas</Text>
        </Pressable>}
      </View>}
      ListEmptyComponent={<Text style={{ color: colors.muted }}>Nenhuma notificação por enquanto.</Text>}
      renderItem={({ item }) => <Pressable accessibilityRole="button"
        accessibilityLabel={`${read[item.id] ? '' : 'Não lida. '}${item.title}. ${item.detail}`}
        onPress={() => open(item)}
        style={{ backgroundColor: colors.panel, borderRadius: 16, padding: 16, gap: 6 }}>
        <Text style={{ color: read[item.id] ? colors.text : colors.primary, fontFamily: fonts.bold }}>{item.title}</Text>
        <Text style={{ color: colors.text }}>{item.detail}</Text>
        <Text style={{ color: colors.muted }}>{new Date(item.at).toLocaleString('pt-BR')}</Text>
      </Pressable>}
    />
  </SafeAreaView>;
}
