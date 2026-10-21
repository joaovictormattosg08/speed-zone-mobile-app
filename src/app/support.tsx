import { useLocalSearchParams } from 'expo-router';
import SupportScreen from '../screens/SupportScreen';
export default function SupportRoute() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  return <SupportScreen key={orderId || 'general'} orderId={orderId} />;
}
