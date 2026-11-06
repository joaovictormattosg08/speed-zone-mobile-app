import { palette as speedPalette } from '../theme/tokens';
import { ActivityIndicator, Text, View } from 'react-native';
import { useCatalog } from '../context/CatalogContext';
import { ProductAction, ps as s } from './AdminProductUI';

export function CatalogStatus() {
  const { loading, error, refresh } = useCatalog();
  if (loading) return <ActivityIndicator accessibilityLabel="Carregando catálogo" color={speedPalette.speedGreen} />;
  if (!error) return null;
  return <View style={s.card}><Text accessibilityRole="alert" style={s.error}>Não foi possível atualizar o catálogo. Os valores e o estoque podem estar desatualizados.</Text><ProductAction label="Tentar novamente" onPress={() => { void refresh().catch(() => {}); }} /></View>;
}
