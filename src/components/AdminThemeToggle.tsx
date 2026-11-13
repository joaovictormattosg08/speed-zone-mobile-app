import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { HeaderAction } from './StoreHeader';

export function AdminThemeToggle({ inline = false }: { inline?: boolean }) {
  const { mode, setPreference } = useTheme();
  const button = <HeaderAction
    icon={mode === 'dark' ? 'white-balance-sunny' : 'moon-waning-crescent'}
    label={mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
    onPress={() => setPreference(mode === 'dark' ? 'light' : 'dark')}
  />;
  return inline ? button : <View style={{ alignItems: 'flex-end', paddingHorizontal: 16 }}>{button}</View>;
}
