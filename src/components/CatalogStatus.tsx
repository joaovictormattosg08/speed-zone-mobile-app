import { useTheme , useThemedStyles } from '../theme/ThemeContext';
import { ActivityIndicator, Text, View } from 'react-native';
import { useCatalog } from '../context/CatalogContext';
import { ProductAction, createPs } from './AdminProductUI';

export function CatalogStatus() {
  const { colors: c } = useTheme();

  const s = useThemedStyles(createPs);

  const { loading, error, refresh } = useCatalog();
  if (loading) return <ActivityIndicator accessibilityLabel="Carregando catálogo" color={c.primary} />;
  if (!error) return null;
  return <View style={s.card}><Text accessibilityRole="alert" style={s.error}>Não foi possível atualizar o catálogo. Os valores e o estoque podem estar desatualizados.</Text><ProductAction label="Tentar novamente" onPress={() => { void refresh().catch(() => {}); }} /></View>;
}
