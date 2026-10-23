import { CatalogProvider } from '../context/CatalogContext';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { StoreProvider } from '../context/StoreContext';

export default function RootLayout() {
  const [loaded, error] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, ...MaterialCommunityIcons.font });
  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  return <SafeAreaProvider><AuthProvider><StatusBar style="light" /><SessionRoutes /></AuthProvider></SafeAreaProvider>;
}


function SessionRoutes() {
  const { user, loading, startupError, retry } = useAuth();
  if (loading || startupError) return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>{loading ? <ActivityIndicator color={colors.primary} /> : <><Text style={{ color: colors.text, textAlign: 'center', maxWidth: 420 }}>{startupError}</Text><Pressable accessibilityRole="button" onPress={retry} style={{ padding: 16, backgroundColor: colors.action, borderRadius: 8 }}><Text>Tentar novamente</Text></Pressable></>}</View>;
  return <CatalogProvider><StoreProvider key={user?.id || 'guest'}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}><Stack.Protected guard={!user}><Stack.Screen name="index" /></Stack.Protected><Stack.Protected guard={!!user}><Stack.Screen name="(main)" /><Stack.Screen name="product/[id]" /><Stack.Screen name="order/[id]" /><Stack.Protected guard={!!user?.isAdmin}><Stack.Screen name="admin" /><Stack.Screen name="admin-orders" /><Stack.Screen name="admin-products" /><Stack.Screen name="admin-users" /><Stack.Screen name="admin-coupons" /><Stack.Screen name="admin-product" /></Stack.Protected><Stack.Protected guard={!!user?.canSupport || !!user?.isAdmin}><Stack.Screen name="admin-support" /></Stack.Protected><Stack.Screen name="loyalty" /><Stack.Screen name="address" /><Stack.Screen name="checkout" /><Stack.Screen name="order-confirmed/[id]" /><Stack.Screen name="support" /><Stack.Screen name="support-ticket/[id]" /></Stack.Protected></Stack></StoreProvider></CatalogProvider>;
}
