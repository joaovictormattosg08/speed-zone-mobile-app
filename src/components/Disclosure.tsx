import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StoreIcon } from './StoreHeader';
import { colors as c, fonts as f } from '../theme/tokens';

/** Keeps secondary information available without competing with the primary task. */
export function Disclosure({ title, children, initiallyOpen = false, expanded, onExpandedChange }: PropsWithChildren<{ title: string; initiallyOpen?: boolean; expanded?: boolean; onExpandedChange?: (value: boolean) => void }>) {
  const [localOpen, setOpen] = useState(initiallyOpen);
  const open = expanded ?? localOpen;
  return <View style={s.container}><Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => { setOpen(!open); onExpandedChange?.(!open); }} style={s.header}><Text style={s.title}>{title}</Text><StoreIcon name={open ? 'chevron-up' : 'chevron-down'} size={20} /></Pressable>{open && <View style={s.body}>{children}</View>}</View>;
}
const s = StyleSheet.create({ container: { backgroundColor: c.panel, borderRadius: 8, marginVertical: 6 }, header: { minHeight: 52, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, title: { flex: 1, fontFamily: f.medium, fontSize: 14, lineHeight: 20, color: c.text }, body: { padding: 12, paddingTop: 0, gap: 12 } });
