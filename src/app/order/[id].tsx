import { useLocalSearchParams } from 'expo-router';
import OrderDetailsScreen from '../../screens/OrderDetailsScreen';
export default function OrderRoute() {
  const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>();
  return <OrderDetailsScreen key={`${id}-${preview}`} id={id} preview={preview === '1'} />;
}
