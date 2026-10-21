import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { SupportTicket, supportCategories } from '../data/support';
import { StoreIcon } from '../components/StoreHeader';
import { colors as c, fonts as f } from '../theme/tokens';

export default function SupportTicketScreen({ id }: { id: string }) {
  const { getTicket, updateTicket } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const pending = useRef<{ text: string; key: string } | null>(null);
  const saving = useRef(false);
  useFocusEffect(useCallback(() => {
    let alive = true; if (retry > 0) setError(''); setLoading(true);
    getTicket(id).then(data => { if (alive) setTicket(data); }).catch(cause => { if (alive) setError(cause.message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id, getTicket, retry]));
  async function save(status?: 'open' | 'closed') {
    if (saving.current || (!status && !message.trim())) return;
    saving.current = true; setBusy(true); setError('');
    if (!status && pending.current?.text !== message.trim()) {
      // Created on a user action and reused after network failures.
      pending.current = { text: message.trim(), key: Date.now() + '-' + Math.random().toString(36).slice(2) };
    }
    try {
      const result = await updateTicket(id, status ? { status } : { text: message.trim(), requestKey: pending.current!.key });
      setTicket(result); if (!status) { setMessage(''); pending.current = null; }
    } catch (cause) { setError((cause as Error).message); } finally { saving.current = false; setBusy(false); }
  }
  const back = () => router.canGoBack() ? router.back() : router.replace('/support');
  return <SafeAreaView style={s.safe}><View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Voltar à Central de Suporte" onPress={back} style={s.icon}><StoreIcon name="arrow-left" color={c.text} /></Pressable><View style={{ flex: 1 }}><Text style={s.title}>Conversa do Chamado</Text><Text style={s.code}>#{id}</Text></View><StoreIcon name="headset" /></View><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    {loading ? <ActivityIndicator color={c.primary} /> : ticket ? <><View style={s.card}><Text style={s.status}>{ticket.status === 'open' ? '● SALVO LOCALMENTE • ABERTO' : '● CHAMADO ENCERRADO'}</Text><Text style={s.title}>{supportCategories.find(item => item.id === ticket.category)?.label}</Text><Text style={s.body}>{ticket.name} • {ticket.email}</Text><Text style={s.body}>{ticket.vehicle}</Text>{ticket.orderId && <Text style={s.code}>Pedido #{ticket.orderId}</Text>}<Text style={s.small}>Aberto em {new Date(ticket.createdAt).toLocaleString('pt-BR')}</Text></View><View style={s.notice}><StoreIcon name="information-outline" size={20} /><Text style={[s.body, { flex: 1 }]}>Esta conversa é local. As mensagens ficam salvas na sua conta; ainda não há um preparador conectado para responder.</Text></View><View style={s.bubble}><Text style={s.author}>VOCÊ • SOLICITAÇÃO INICIAL</Text><Text selectable style={s.message}>{ticket.description}</Text>{ticket.attachment && <Image accessibilityLabel="Evidência anexada ao chamado" source={{ uri: ticket.attachment }} resizeMode="contain" style={s.image} />}</View>{ticket.messages.map(item => <View key={item.id} style={s.bubble}><Text style={s.author}>VOCÊ • {new Date(item.createdAt).toLocaleString('pt-BR')}</Text><Text selectable style={s.message}>{item.text}</Text></View>)}
    {ticket.status === 'open' ? <View style={s.card}><Text style={s.title}>Complementar informações</Text><TextInput accessibilityLabel="Mensagem do chamado" editable={!busy} value={message} onChangeText={setMessage} multiline maxLength={2000} placeholder="Adicione detalhes sobre seu projeto..." placeholderTextColor={c.subtle} style={s.input} /><Text style={s.small}>{message.length}/2000</Text><Pressable accessibilityRole="button" disabled={busy || !message.trim()} onPress={() => void save()} style={[s.button, s.primary, (busy || !message.trim()) && { opacity: 0.5 }]}><StoreIcon name="send-outline" color={c.onPrimary} size={20} /><Text style={s.primaryText}>{busy ? 'Salvando...' : 'Salvar mensagem'}</Text></Pressable></View> : <Text style={s.body}>Você encerrou este chamado. Reabra para complementar a conversa.</Text>}
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => void save(ticket.status === 'open' ? 'closed' : 'open')} style={s.button}><StoreIcon name={ticket.status === 'open' ? 'check-circle-outline' : 'restore'} size={20} /><Text style={s.buttonText}>{ticket.status === 'open' ? 'Encerrar chamado' : 'Reabrir chamado'}</Text></Pressable></> : <View style={s.card}><Text style={s.title}>Chamado indisponível</Text><Text style={s.body}>Confira se este chamado pertence à sua conta.</Text></View>}
    {error !== '' && <View style={s.card}><Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>{!ticket && <Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)} style={s.button}><Text style={s.buttonText}>Tentar novamente</Text></Pressable>}</View>}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: c.background }, header: { minHeight: 68, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.deepest }, icon: { minHeight: 44, width: 40, alignItems: 'center', justifyContent: 'center' }, content: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 16, gap: 14, paddingBottom: 36 }, title: { color: c.text, fontFamily: f.bold, fontSize: 16 }, code: { color: c.primary, fontFamily: f.medium, fontSize: 12, marginTop: 4 }, card: { backgroundColor: c.input, padding: 16, borderRadius: 8, gap: 12 }, status: { color: c.primary, fontFamily: f.bold, fontSize: 10 }, body: { color: c.muted, fontFamily: f.regular, fontSize: 12, lineHeight: 19 }, small: { color: c.subtle, fontFamily: f.regular, fontSize: 10 }, notice: { flexDirection: 'row', gap: 10, backgroundColor: '#152b23', padding: 14, borderRadius: 6 }, bubble: { backgroundColor: c.panel, borderLeftWidth: 3, borderLeftColor: c.primary, padding: 14, borderRadius: 7, gap: 10 }, author: { color: c.primary, fontFamily: f.medium, fontSize: 10 }, message: { color: c.text, fontFamily: f.regular, fontSize: 14, lineHeight: 22 }, image: { width: '100%', height: 220, backgroundColor: c.deepest, borderRadius: 4 }, input: { backgroundColor: c.deepest, borderRadius: 5, minHeight: 110, padding: 12, color: c.text, fontFamily: f.regular, fontSize: 14, textAlignVertical: 'top' }, button: { minHeight: 48, padding: 12, borderRadius: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.elevated }, primary: { backgroundColor: c.primary }, primaryText: { color: c.onPrimary, fontFamily: f.bold, fontSize: 13 }, buttonText: { color: c.text, fontFamily: f.medium, fontSize: 13 }, error: { color: c.error, fontFamily: f.regular, fontSize: 12, lineHeight: 18 } });
