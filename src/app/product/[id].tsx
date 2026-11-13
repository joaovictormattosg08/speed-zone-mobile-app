import { useLocalSearchParams } from 'expo-router';
import ProductScreen from '../../screens/ProductScreen';
export default function ProductRoute() {
  const { id, vehicleId } = useLocalSearchParams<{ id: string; vehicleId?: string }>();
  return <ProductScreen key={id} id={id} vehicleId={vehicleId} />;
}
