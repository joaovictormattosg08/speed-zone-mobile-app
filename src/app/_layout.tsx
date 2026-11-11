import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { CatalogProvider } from '../context/CatalogContext';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StartupStatus } from '../components/StartupStatus';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { StoreProvider } from '../context/StoreContext';

export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider><AppContent /></ThemeProvider></SafeAreaProvider>;
}

function AppContent() {
  const { mode } = useTheme();
  const [loaded, error] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, ...MaterialCommunityIcons.font });
  if (!loaded && !error) return <StartupStatus title="Preparando a SpeedZone…" />;
  return <AuthProvider><StatusBar style={mode === 'dark' ? 'light' : 'dark'} /><SessionRoutes /></AuthProvider>;
}


function SessionRoutes() {
  const { colors } = useTheme();

  const { user, loading, startupError, retry } = useAuth();
  if (loading || startupError) return <StartupStatus title={loading ? 'Conectando à SpeedZone…' : 'Não conseguimos conectar'} message={loading ? 'Estamos verificando sua sessão. Isso pode levar alguns segundos.' : startupError} onRetry={loading ? undefined : () => { void retry(); }} />;
  return <CatalogProvider><StoreProvider key={user?.id || 'guest'}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}><Stack.Protected guard={!user}><Stack.Screen name="index" /></Stack.Protected><Stack.Protected guard={!!user}><Stack.Screen name="(main)" /><Stack.Screen name="product/[id]" /><Stack.Screen name="order/[id]" /><Stack.Protected guard={!!user?.isAdmin}><Stack.Screen name="admin" /><Stack.Screen name="admin-orders" /><Stack.Screen name="admin-order" /><Stack.Screen name="admin-user" /><Stack.Screen name="admin-products" /><Stack.Screen name="admin-users" /><Stack.Screen name="admin-coupons" /><Stack.Screen name="admin-coupon" /><Stack.Screen name="admin-product" /></Stack.Protected><Stack.Protected guard={!!user?.canSupport || !!user?.isAdmin}><Stack.Screen name="admin-support" /><Stack.Screen name="admin-ticket" /></Stack.Protected><Stack.Screen name="loyalty" /><Stack.Screen name="address" /><Stack.Screen name="checkout" /><Stack.Screen name="order-confirmed/[id]" /><Stack.Screen name="support" /><Stack.Screen name="support-ticket/[id]" /></Stack.Protected><Stack.Screen name="terms" /><Stack.Screen name="privacy" /><Stack.Screen name="about" /></Stack></StoreProvider></CatalogProvider>;
}
