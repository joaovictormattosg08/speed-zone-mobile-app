import { useTheme } from '../theme/ThemeContext';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';


export function StartupStatus({ title, message, onRetry }: { title: string; message?: string; onRetry?: () => void }) {
  const { colors } = useTheme();

  return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
    {!onRetry && <ActivityIndicator color={colors.primary} accessibilityLabel={title} />}
    <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 22, fontWeight: '600', textAlign: 'center' }}>{title}</Text>
    {!!message && <Text accessibilityLiveRegion="polite" style={{ color: colors.muted, textAlign: 'center', maxWidth: 420, fontSize: 16, lineHeight: 24 }}>{message}</Text>}
    {!!onRetry && <Pressable accessibilityRole="button" onPress={onRetry} style={{ padding: 16, minHeight: 48, backgroundColor: colors.action, borderRadius: 8 }}><Text style={{ color: colors.onPrimary, fontWeight: '600' }}>Tentar novamente</Text></Pressable>}
  </View>;
}
