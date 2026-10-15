import { Image, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, fonts } from '../theme/tokens';
export function PilotAvatar({ size = 32 }: { size?: number }) {
  const { user } = useAuth();
  const style = { width: size, height: size, borderRadius: size * 0.22, borderWidth: 1.5, borderColor: colors.primary };
  return user?.photo ? <Image accessibilityLabel="Foto do piloto" source={{ uri: user.photo }} style={style} /> : <View style={[style, { backgroundColor: colors.elevated, justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontFamily: fonts.bold, color: colors.primary, fontSize: size * 0.32 }}>{`${user?.name[0] || 'P'}${user?.surname[0] || ''}`.toUpperCase()}</Text></View>;
}
