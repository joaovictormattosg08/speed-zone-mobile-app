import { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Href, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductAction, ps as s } from './AdminProductUI';
import { StoreIcon } from './StoreHeader';
import { Disclosure } from './Disclosure';

export function AdminDetail({ title, back, children, footer, busy = false }: PropsWithChildren<{ title: string; back: Href; footer?: ReactNode; busy?: boolean }>) {
  return <SafeAreaView style={s.safe}>
    <View style={[s.header, { gap: 12 }]}><ProductAction label="←" disabled={busy} onPress={() => router.replace(back)} /><View style={s.flex}><Text style={s.eyebrow}>SPEEDZONE // ADMIN</Text><Text style={s.section}>{title}</Text></View><StoreIcon name="tune-variant" /></View>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>{children}</ScrollView>
      {footer && <View style={[s.footer, { width: '100%', maxWidth: 760, alignSelf: 'center' }]}>{footer}</View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function DetailSection({ title, children, collapsible = false }: PropsWithChildren<{ title: string; collapsible?: boolean }>) {
  if (collapsible) return <Disclosure title={title}>{children}</Disclosure>;
  return <View style={s.card}><Text style={s.section}>{title}</Text>{children}</View>;
}

export function ConfirmAction({ title, description, busy, onConfirm, onCancel }: { title: string; description: string; busy: boolean; onConfirm: () => void; onCancel: () => void }) {
  return <View style={[s.card, { backgroundColor: '#301419' }]}><Text style={s.error}>{title}</Text><Text style={s.body}>{description}</Text><ProductAction label={busy ? 'Aguarde…' : 'Confirmar'} disabled={busy} onPress={onConfirm} /><ProductAction label="Voltar sem alterar" disabled={busy} onPress={onCancel} /></View>;
}
