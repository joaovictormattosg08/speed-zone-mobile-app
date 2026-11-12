import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/tokens';
import { StoreIcon } from './StoreHeader';

export function AdminThemeToggle() {
  const { colors, mode, setPreference } = useTheme();
  const label = mode === 'dark' ? 'Tema claro' : 'Tema escuro';
  return <View style={{ backgroundColor: colors.panel, alignItems: 'flex-end', paddingHorizontal: 12 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={'Ativar '+label.toLowerCase()}
      onPress={() => setPreference(mode === 'dark' ? 'light' : 'dark')}
      style={{ minHeight: 40, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <StoreIcon name={mode === 'dark' ? 'white-balance-sunny' : 'moon-waning-crescent'} size={18}/>
      <Text style={{ color: colors.primary, fontFamily: fonts.medium, fontSize: 12 }}>{label}</Text>
    </Pressable>
  </View>;
}
