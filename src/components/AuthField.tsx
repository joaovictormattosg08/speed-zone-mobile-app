import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ComponentProps, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, fonts } from '../theme/tokens';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type Props = TextInputProps & { label: string; icon: IconName; hint?: string; password?: boolean };

export function AuthField({ label, icon, hint, password, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return <View style={styles.group}>
    <View style={styles.labelRow}><Text style={styles.label}>{label}</Text>{hint && <Text style={styles.hint}>{hint}</Text>}</View>
    <View style={[styles.inputWrap, focused && styles.focused]}>
      <MaterialCommunityIcons name={icon} size={21} color={colors.muted} />
      <TextInput {...props} accessibilityLabel={label} placeholderTextColor={colors.subtle} selectionColor={colors.primary} secureTextEntry={password && !visible} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={styles.input} />
      {password && <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setVisible(!visible)} style={styles.eye}><MaterialCommunityIcons name={visible ? 'eye-off-outline' : 'eye-outline'} size={21} color={colors.muted} /></Pressable>}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  group: { gap: 7 }, labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  label: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted, letterSpacing: 0.3 },
  hint: { fontFamily: fonts.medium, fontSize: 10, color: colors.muted, letterSpacing: 0.4 },
  inputWrap: { minHeight: 50, backgroundColor: colors.input, borderRadius: 5, borderWidth: 1, borderColor: 'transparent', paddingLeft: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  focused: { borderColor: colors.primary }, input: { flex: 1, minWidth: 0, minHeight: 48, paddingVertical: 12, paddingRight: 10, color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
  eye: { minHeight: 48, width: 44, alignItems: 'center', justifyContent: 'center' },
});

