import { ScreenHeader } from '../components/ScreenHeader';
import { ThemeColors , fonts as f } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { SupportTicket, supportCategories } from '../data/support';
import { PilotAvatar } from '../components/PilotAvatar';
import { StoreIcon } from '../components/StoreHeader';

export default function SupportTicketScreen({ id }: { id: string }) {
  const { colors: c } = useTheme();
  const s = useThemedStyles(createS);

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
    let inFlight = false;
    const load = async () => { if (inFlight || saving.current) return; inFlight = true; try { const data = await getTicket(id); if (alive) { setTicket(previous => previous && previous.updatedAt > data.updatedAt ? previous : data); setError(''); } } catch (cause) { if (alive) setError((cause as Error).message); } finally { inFlight = false; if (alive) setLoading(false); } };
    void load(); const timer = setInterval(() => void load(), 10000);
    return () => { alive = false; clearInterval(timer); };
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
  const date = (value: string) => new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  return <SafeAreaView style={s.safe}>
    <ScreenHeader title="Detalhes do chamado" leading={<Pressable accessibilityRole="button" accessibilityLabel="Voltar à Central de Suporte" onPress={back} style={s.icon}><StoreIcon name="chevron-left" color={c.text} /></Pressable>}><PilotAvatar size={36} /></ScreenHeader>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        {loading ? <ActivityIndicator color={c.primary} /> : ticket ? <>
          <View style={s.summary}><Text selectable style={s.protocol}>#{ticket.id}</Text><Text style={s.status}>{ticket.status === 'open' ? '● ANÁLISE ATIVA' : '✓ RESOLVIDO'}</Text></View>
          <Text style={s.small}>Aberto {date(ticket.createdAt)}</Text>
          <View style={s.card}>
            <View style={s.summary}><StoreIcon name="car-outline" /><Text style={s.label}>VEÍCULO DO CHAMADO</Text></View>
            <Text style={s.vehicle}>{ticket.vehicle || 'Veículo não informado'}</Text>
            <Text style={s.body}>{supportCategories.find(item => item.id === ticket.category)?.label}</Text>
            {ticket.orderId && <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/order/[id]', params: { id: ticket.orderId! } })} style={s.inset}>
              <StoreIcon name="package-variant-closed" /><View style={{ flex: 1 }}><Text style={s.small}>PEDIDO VINCULADO</Text><Text style={s.title}>#{ticket.orderId}</Text></View><Text style={s.code}>Ver pedido →</Text>
            </Pressable>}
          </View>
          <View style={s.card}><View style={s.inset}><StoreIcon name="headset" size={30} /><View style={{flex:1}}><Text style={s.title}>Equipe técnica SpeedZone</Text><Text style={s.body}>Atendimento pelo chamado</Text></View><StoreIcon name="shield-check-outline" /></View></View>
          <View style={s.summary}><Text style={s.label}>HISTÓRICO TÉCNICO & MENSAGENS</Text><Text style={s.small}>{ticket.messages.length + 1} mensagens</Text></View>
          <View style={s.bubble}>
            <View style={s.inset}><View style={s.avatar}><Text style={s.author}>{ticket.name.slice(0,2).toUpperCase()}</Text></View><View style={{flex:1}}><Text style={s.title}>{ticket.name}</Text><Text style={s.small}>Piloto · {date(ticket.createdAt)}</Text></View></View>
            <Text selectable style={s.message}>{ticket.description}</Text>
            {ticket.attachment && <Image accessibilityLabel="Evidência anexada ao chamado" source={{ uri: ticket.attachment }} resizeMode="contain" style={s.image} />}
          </View>
          {ticket.messages.map(item => <View key={item.author + item.id} style={[s.bubble, item.author === 'team' && { backgroundColor: c.elevated }]}>
            <View style={s.inset}><View style={s.avatar}><StoreIcon name={item.author === 'team' ? 'headset' : 'account-outline'} size={20} /></View><View style={{flex:1}}><Text style={s.title}>{item.author === 'team' ? item.authorName || 'Equipe SpeedZone' : ticket.name}</Text><Text style={s.small}>{item.author === 'team' ? 'Equipe técnica' : 'Piloto'} · {date(item.createdAt)}</Text></View></View>
            <Text selectable style={s.message}>{item.text}</Text>
          </View>)}
          <View style={s.notice}><StoreIcon name={ticket.status === 'open' ? 'clock-outline' : 'check-circle-outline'} /><View style={{ flex: 1 }}><Text style={s.author}>STATUS DO CHAMADO</Text><Text style={s.body}>{ticket.status === 'open' ? 'Atendimento em andamento' : 'Atendimento resolvido'} · {date(ticket.updatedAt)}</Text></View></View>
        </> : <View style={s.card}><Text style={s.title}>Chamado indisponível</Text><Text style={s.body}>Confira se este chamado pertence à sua conta.</Text></View>}
        {!!error && <View style={s.card}><Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>{!ticket && <Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)} style={s.button}><Text style={s.buttonText}>Tentar novamente</Text></Pressable>}</View>}
      </ScrollView>
      {ticket && !loading && <View style={s.composer}>
        {ticket.status === 'open' && <View style={s.composeRow}>
          <TextInput accessibilityLabel="Mensagem do chamado" editable={!busy} value={message} onChangeText={setMessage} multiline maxLength={2000} placeholder="Digite sua mensagem…" placeholderTextColor={c.subtle} style={s.input} />
          <Pressable accessibilityRole="button" accessibilityLabel="Enviar mensagem" disabled={busy || !message.trim()} onPress={() => void save()} style={[s.send, (busy || !message.trim()) && { opacity: 0.5 }]}>{busy ? <ActivityIndicator color={c.onPrimary} /> : <StoreIcon name="send-outline" color={c.onPrimary} />}</Pressable>
        </View>}
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void save(ticket.status === 'open' ? 'closed' : 'open')} style={s.resolve}><StoreIcon name={ticket.status === 'open' ? 'check-circle-outline' : 'restore'} size={18} /><Text style={s.body}>{ticket.status === 'open' ? 'Marcar chamado como resolvido' : 'Reabrir chamado'}</Text></Pressable>
      </View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const createS = (c: ThemeColors) => StyleSheet.create({
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  protocol: { fontFamily: f.bold, fontSize: 23, color: c.text },
  vehicle: { fontFamily: f.bold, fontSize: 21, color: c.text },
  label: { fontFamily: f.medium, fontSize: 12, color: c.muted },
  inset: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primarySoft },
  composer: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 16, backgroundColor: c.deepest },
  composeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  send: { width: 48, height: 52, borderRadius: 6, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  resolve: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  safe: { flex: 1, backgroundColor: c.background }, header: { minHeight: 68, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.deepest }, icon: { minHeight: 44, width: 40, alignItems: 'center', justifyContent: 'center' }, content: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 16, gap: 14, paddingBottom: 36 }, title: { color: c.text, fontFamily: f.bold, fontSize: 16 }, code: { color: c.primary, fontFamily: f.medium, fontSize: 12, marginTop: 4 }, card: { borderWidth: 1, borderColor: c.surfaceBorder, backgroundColor: c.panel, padding: 18, borderRadius: 10, gap: 12 }, status: { color: c.primary, fontFamily: f.bold, fontSize: 10 }, body: { color: c.muted, fontFamily: f.regular, fontSize: 12, lineHeight: 19 }, small: { color: c.subtle, fontFamily: f.regular, fontSize: 10 }, notice: { flexDirection: 'row', gap: 10, backgroundColor: c.primarySoft, padding: 14, borderRadius: 6 }, bubble: { backgroundColor: c.panel, padding: 18, borderRadius: 7, gap: 10 }, author: { color: c.primary, fontFamily: f.medium, fontSize: 10 }, message: { color: c.text, fontFamily: f.regular, fontSize: 16, lineHeight: 26 }, image: { width: '100%', height: 220, backgroundColor: c.deepest, borderRadius: 4 }, input: { borderWidth: 1, borderColor: c.border, backgroundColor: c.deepest, borderRadius: 5, flex: 1, minHeight: 52, maxHeight: 140, padding: 12, color: c.text, fontFamily: f.regular, fontSize: 14, textAlignVertical: 'top' }, button: { borderWidth: 1, borderColor: c.border, minHeight: 48, padding: 12, borderRadius: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.elevated }, primary: { backgroundColor: c.primary }, primaryText: { color: c.onPrimary, fontFamily: f.bold, fontSize: 13 }, buttonText: { color: c.text, fontFamily: f.medium, fontSize: 13 }, error: { color: c.error, fontFamily: f.regular, fontSize: 12, lineHeight: 18 } });
