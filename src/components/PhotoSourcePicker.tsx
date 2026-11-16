import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { StoreIcon } from './StoreHeader';
export function PhotoSourcePicker({ onSelect, disabled = false }: { onSelect: (source: 'camera' | 'library') => void; disabled?: boolean }) {
  const { colors } = useTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 10 }}>{(['camera', 'library'] as const).map(source => <Pressable key={source} accessibilityRole="button" disabled={disabled} onPress={() => onSelect(source)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.elevated, opacity: disabled ? 0.5 : 1 }}><StoreIcon name={source === 'camera' ? 'camera-outline' : 'image-outline'} /><Text style={{ color: colors.text }}>{source === 'camera' ? 'Tirar foto agora' : 'Escolher da galeria'}</Text></Pressable>)}</View>;
}
