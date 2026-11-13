import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../context/StoreContext';
import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type TabsProps = ComponentProps<typeof Tabs>;
type BottomTabBarProps = Parameters<NonNullable<TabsProps['tabBar']>>[0];

export const TAB_ROUTES = {
  home: { label: 'Início', icon: 'home-outline' },
  catalog: { label: 'Catálogo', icon: 'tools' },
  cart: { label: 'Carrinho', icon: 'cart-outline' },
  orders: { label: 'Pedidos', icon: 'receipt-text-outline' },
  account: { label: 'Conta', icon: 'garage-variant' },
} as const satisfies Record<string, { label: string; icon: IconName }>;

export const TAB_BAR_CONFIG = {
  horizontalMargin: 16,
  bottomMargin: 16,
  outerPadding: 7,
  height: 78,
  borderRadius: 25,
  iconSize: 22,
  indicatorWidth: 26,
  indicatorHeight: 2,
} as const;

export const TAB_BAR_RESERVED_HEIGHT = TAB_BAR_CONFIG.height + TAB_BAR_CONFIG.bottomMargin;

export function SpeedzoneTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { count } = useStore();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.floatingArea,
        {
          left: TAB_BAR_CONFIG.horizontalMargin,
          right: TAB_BAR_CONFIG.horizontalMargin,
          bottom: TAB_BAR_CONFIG.bottomMargin + insets.bottom,
        },
      ]}
    >
      <View
        style={[
          styles.bar,
          {
            height: TAB_BAR_CONFIG.height,
            padding: TAB_BAR_CONFIG.outerPadding,
            borderRadius: TAB_BAR_CONFIG.borderRadius,
            backgroundColor: colors.panel,
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const config = TAB_ROUTES[route.name as keyof typeof TAB_ROUTES];
          if (!config) return null;

          const isFocused = state.index === index;
          const options = descriptors[route.key].options;
          const badge = route.name === 'cart' ? count : 0;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={options.tabBarAccessibilityLabel || config.label}
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View
                style={[
                  styles.indicator,
                  {
                    width: TAB_BAR_CONFIG.indicatorWidth,
                    height: TAB_BAR_CONFIG.indicatorHeight,
                    backgroundColor: isFocused ? colors.primary : 'transparent',
                  },
                ]}
              />

              <View style={styles.iconArea}>
                <MaterialCommunityIcons
                  name={config.icon}
                  size={TAB_BAR_CONFIG.iconSize}
                  color={isFocused ? colors.primary : colors.muted}
                />
                {badge > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}> 
                    <Text style={[styles.badgeText, { color: colors.onPrimary }]}> 
                      {badge > 99 ? '99+' : badge}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  { color: isFocused ? colors.primary : colors.muted },
                  isFocused && styles.activeLabel,
                ]}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingArea: {
    position: 'absolute',
    zIndex: 30,
    elevation: 18,
  },
  bar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.34,
    shadowRadius: 16,
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 18,
  },
  pressed: {
    opacity: 0.65,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    borderRadius: 999,
  },
  iconArea: {
    width: 32,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    maxWidth: '100%',
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 13,
  },
  activeLabel: {
    fontFamily: fonts.bold,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -9,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    lineHeight: 10,
  },
});
