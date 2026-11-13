import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemePreference, useTheme, useThemedStyles } from '../theme/ThemeContext';
import { fonts, ThemeColors } from '../theme/tokens';

const options = [
  { value: 'light', label: 'Claro', icon: 'white-balance-sunny' },
  { value: 'dark', label: 'Escuro', icon: 'moon-waning-crescent' },
  { value: 'system', label: 'Sistema', icon: 'cellphone' },
] as const;

export function ThemePicker({ compact = false }: { compact?: boolean }) {
  const { colors, preference, setPreference, storageError } = useTheme();
  const s = useThemedStyles(createStyles);
  return <View style={compact ? s.compact : s.card}>
    {!compact && <><Text style={s.title}>Do seu jeito</Text><Text style={s.description}>Escolha a aparência da sua garagem.</Text></>}
    <View accessibilityRole="radiogroup" accessibilityLabel="Tema do aplicativo" style={s.options}>
      {options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={`Tema ${option.label.toLowerCase()}`} accessibilityState={{ checked: preference === option.value }} onPress={() => setPreference(option.value as ThemePreference)} style={[s.option, preference === option.value && s.selected]}>
        <View style={s.optionIcon}><MaterialCommunityIcons name={option.icon} size={18} color={preference === option.value ? colors.primary : colors.muted} /></View>
        <Text numberOfLines={1} style={[s.label, preference === option.value && { color: colors.primary }]}>{option.label}</Text>
      </Pressable>)}
    </View>
    {!!storageError && <Text accessibilityRole="alert" style={s.error}>{storageError}</Text>}
  </View>;
}
const createStyles = (c: ThemeColors) => StyleSheet.create({
  card: { backgroundColor: c.panel, borderRadius: 24, padding: 20, gap: 8, marginVertical: 12 },
  compact: { marginVertical: 16, gap: 8 },
  title: { fontFamily: fonts.bold, fontSize: 18, color: c.text },
  description: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, marginBottom: 8 },
  options: { width: '100%', flexDirection: 'row', alignItems: 'stretch', backgroundColor: c.input, borderRadius: 16, padding: 4, gap: 4 },
  option: { flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 8 },
  optionIcon: { width: 20, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: c.panel, boxShadow: '0 2px 8px #00000008' },
  label: { fontFamily: fonts.medium, fontSize: 12, color: c.muted },
  error: { fontFamily: fonts.regular, fontSize: 12, color: c.error },
});
