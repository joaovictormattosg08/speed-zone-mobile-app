import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { fonts, type ThemeColors } from '../theme/tokens';
import { StoreIcon } from './StoreHeader';
import { useAuth } from '../context/AuthContext';

export const ADMIN_NAV_ROUTES = [
  ['Dashboard', '/admin', 'view-dashboard-outline'],
  ['Produtos', '/admin-products', 'archive-outline'],
  ['Vendas', '/admin-orders', 'chart-line'],
  ['Suporte', '/admin-support', 'headset'],
  ['Usuários', '/admin-users', 'account-group-outline'],
] as const;

export const ADMIN_NAV_CONFIG = {
  horizontalMargin: 16,
  bottomMargin: 16,
  height: 78,
  borderRadius: 25,
  iconSize: 22,
  indicatorWidth: 26,
  indicatorHeight: 2,
} as const;

export function AdminNavigation({ current, onReselect, disabled = false }: {
  disabled?: boolean;
  current?: typeof ADMIN_NAV_ROUTES[number][1];
  onReselect?: () => void;
}) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);
  const routes = user?.isAdmin
    ? ADMIN_NAV_ROUTES
    : ADMIN_NAV_ROUTES.filter(([, path]) => path === '/admin-support');

  return (
    <View style={styles.floatingArea}>
      <View style={styles.bar}>
        {routes.map(([label, path, icon]) => {
          const selected = path === current;
          const color = selected ? colors.primary : colors.muted;

          return (
            <Pressable
              key={path}
              accessibilityRole="tab"
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => selected ? onReselect?.() : router.navigate(path)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View style={[styles.indicator, selected && styles.selectedIndicator]} />
              <StoreIcon name={icon} color={color} size={ADMIN_NAV_CONFIG.iconSize} />
              <Text
                numberOfLines={1}
                style={[styles.label, { color }, selected && styles.selectedLabel]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  floatingArea: {
    marginHorizontal: ADMIN_NAV_CONFIG.horizontalMargin,
    marginBottom: ADMIN_NAV_CONFIG.bottomMargin,
    borderRadius: ADMIN_NAV_CONFIG.borderRadius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.34,
    shadowRadius: 16,
    elevation: 18,
  },
  bar: {
    height: ADMIN_NAV_CONFIG.height,
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 7,
    backgroundColor: c.panel,
    borderRadius: ADMIN_NAV_CONFIG.borderRadius,
    borderWidth: 1,
    borderColor: c.surfaceBorder,
    overflow: 'hidden',
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 18,
  },
  pressed: { opacity: 0.65 },
  indicator: {
    position: 'absolute',
    top: 0,
    width: ADMIN_NAV_CONFIG.indicatorWidth,
    height: ADMIN_NAV_CONFIG.indicatorHeight,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  selectedIndicator: { backgroundColor: c.primary },
  label: {
    maxWidth: '100%',
    fontFamily: fonts.regular,
    fontSize: 9,
    lineHeight: 12,
  },
  selectedLabel: { fontFamily: fonts.bold },
});
