import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../context/StoreContext';
import { colors, fonts } from '../../theme/tokens';
function Navigation() {
  const { count } = useStore();
  const insets = useSafeAreaInsets();
  return <Tabs initialRouteName="home" screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarHideOnKeyboard: true, tabBarStyle: { backgroundColor: colors.deepest, borderTopColor: colors.panel, height: 64 + insets.bottom, paddingTop: 7, paddingBottom: Math.max(insets.bottom, 6) }, tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 0.5 }, tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.onPrimary, fontSize: 10 } }}>
    {([{ name: 'home', title: 'INÍCIO', icon: 'home-outline' }, { name: 'catalog', title: 'CATÁLOGO', icon: 'tools' }, { name: 'cart', title: 'CARRINHO', icon: 'cart-outline' }, { name: 'orders', title: 'PEDIDOS', icon: 'receipt-text-outline' }, { name: 'account', title: 'CONTA', icon: 'garage-variant' }] as const).map(tab => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title, tabBarBadge: tab.name === 'cart' && count ? count : undefined, tabBarIcon: ({ color }) => <MaterialCommunityIcons name={tab.icon} size={23} color={color} /> }} />)}
  </Tabs>;
}
export default function MainLayout() { return <Navigation />; }
