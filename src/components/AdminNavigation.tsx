import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { fonts, type ThemeColors } from '../theme/tokens';
import { StoreIcon } from './StoreHeader';

const sections = [
  ['Dashboard', '/admin', 'view-dashboard-outline'],
  ['Produtos', '/admin-products', 'archive-outline'],
  ['Vendas', '/admin-orders', 'chart-line'],
  ['Suporte', '/admin-support', 'headset'],
  ['Usuários', '/admin-users', 'account-group-outline'],
] as const;

export function AdminNavigation({ current, onReselect, disabled = false }: {
  disabled?: boolean;
  current?: typeof sections[number][1];
  onReselect?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return <View style={styles.bar}>{sections.map(([label, path, icon]) => {
    const selected = path === current;
    const color = selected ? colors.onPrimary : colors.muted;
    return <Pressable key={path} accessibilityRole="tab" accessibilityState={{ selected, disabled }} disabled={disabled}
      onPress={() => selected ? onReselect?.() : router.navigate(path)} style={[styles.item, selected && styles.active]}>
      <StoreIcon name={icon} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>;
  })}</View>;
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: c.deepest, paddingVertical: 8, paddingHorizontal: 6, gap: 4, borderTopWidth: 1, borderColor: c.panel },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 44 },
  active: { backgroundColor: c.primary, borderRadius: 28 },
  label: { fontFamily: fonts.bold, fontSize: 9 },
});
