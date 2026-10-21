import { useLocalSearchParams } from 'expo-router';
import SupportTicketScreen from '../../screens/SupportTicketScreen';
export default function TicketRoute() { const { id } = useLocalSearchParams<{ id: string }>(); return <SupportTicketScreen key={id} id={id} />; }
