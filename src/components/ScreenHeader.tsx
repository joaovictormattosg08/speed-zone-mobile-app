import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';
import { fonts, type ThemeColors } from '../theme/tokens';

type Props = { title: ReactNode; eyebrow?: string; leading?: ReactNode; children?: ReactNode };

/** Keep the title beside fixed-size actions, with bounded text wrapping. */
export function ScreenHeader({ title, eyebrow = 'SPEEDZONE', leading, children }: Props) {
  const s = useThemedStyles(createStyles);
  return <View style={s.header}><View style={s.inner}>
    <View style={s.identity}>
      {leading && <View style={s.leading}>{leading}</View>}
      <View style={s.heading}><Text numberOfLines={1} style={s.eyebrow}>{eyebrow}</Text><Text accessibilityRole="header" numberOfLines={2} style={s.title}>{title}</Text></View>
    </View>
    {children && <View style={s.actions}>{children}</View>}
  </View></View>;
}
const createStyles = (c: ThemeColors) => StyleSheet.create({
  header: { backgroundColor: c.background, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.surfaceBorder },
  inner: { width: '100%', maxWidth: 760, alignSelf: 'center', minHeight: 80, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  leading: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heading: { flex: 1, minWidth: 0, gap: 4 },
  eyebrow: { color: c.primary, fontFamily: fonts.bold, fontSize: 9, lineHeight: 14, letterSpacing: 1.4 },
  title: { color: c.text, fontFamily: fonts.bold, fontSize: 16, lineHeight: 21 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, flexShrink: 0 },
});
