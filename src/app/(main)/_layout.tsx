import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import {
  SpeedzoneTabBar,
  TAB_BAR_RESERVED_HEIGHT,
  TAB_ROUTES,
} from '../../components/SpeedzoneTabBar';

function Navigation() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tabs
      initialRouteName="home"
      tabBar={props => <SpeedzoneTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: {
          paddingBottom: TAB_BAR_RESERVED_HEIGHT + insets.bottom,
          backgroundColor: colors.background,
        },
      }}
    >
      {Object.entries(TAB_ROUTES).map(([name, config]) => (
        <Tabs.Screen key={name} name={name} options={{ title: config.label }} />
      ))}
    </Tabs>
  );
}

export default function MainLayout() {
  return <Navigation />;
}
