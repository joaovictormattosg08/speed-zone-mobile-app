import { useTheme , useThemedStyles } from '../theme/ThemeContext';
import { fonts, ThemeColors } from '../theme/tokens';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, TextInput, View, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { StoreIcon } from '../components/StoreHeader';
import { PilotAvatar } from '../components/PilotAvatar';
import { AdminThemeToggle } from '../components/AdminThemeToggle';
import { ProductAction } from '../components/AdminProductUI';
import { useAuth } from '../context/AuthContext';
import { SupportTicket, supportCategories } from '../data/support';

// Drafts remain isolated by signed-in operator and ticket while navigating in this session.
const drafts = new Map<string, { text: string; status: 'open' | 'closed'; version: string; key?: string }>();
export default function AdminTicketDetailScreen() {
  const { colors: c } = useTheme();

  const s = useThemedStyles(createTicketStyles);

  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, getAdminTicket, respondTicket } = useAuth();
  const draftId = `${user?.id}:${id}`;
  const [ticket, setTicket] = useState<SupportTicket | null>(null), [text, setText] = useState(''), [status, setStatus] = useState<'open' | 'closed'>('open'), [version, setVersion] = useState('');
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [photo, setPhoto] = useState(false), [retry, setRetry] = useState(0);
  const lock = useRef(false), requestKey = useRef<string | undefined>(undefined);
  useEffect(() => { let alive = true; getAdminTicket(id).then(value => { if (!alive) return; setTicket(value); const saved = drafts.get(draftId); setText(saved?.text || ''); setStatus(saved?.status || value.status); setVersion(saved?.version || value.updatedAt); requestKey.current = saved?.key; setError(''); }).catch(e => { if (alive) setError(e.message); }).finally(() => { if (alive) setLoading(false); }); return () => { alive = false; }; }, [id, draftId, getAdminTicket, retry]);
  function edit(value: string) { setText(value); requestKey.current = undefined; setNotice(''); }
  function saveDraft() { drafts.set(draftId, { text, status, version, key: requestKey.current }); setNotice('Rascunho guardado nesta sessão.'); }
  async function send() {
    if (!ticket || !text.trim() || lock.current) return; lock.current = true; setBusy(true); setError('');
    requestKey.current ||= Date.now() + '-' + Math.random().toString(36).slice(2);
    drafts.set(draftId, { text, status, version, key: requestKey.current });
    try { const value = await respondTicket(id, { text: text.trim(), status, expectedUpdatedAt: version, requestKey: requestKey.current }); setTicket(value); setVersion(value.updatedAt); setText(''); requestKey.current = undefined; drafts.delete(draftId); setNotice('Parecer enviado para a conversa do cliente.'); }
    catch (e) { setError((e as Error).message); if ((e as { status?: number }).status === 409) { try { setTicket(await getAdminTicket(id)); } catch { /* Preserve the response and original error for retry. */ } } }
    finally { lock.current = false; setBusy(false); }
  }
  const conflict = !!ticket && version !== ticket.updatedAt;
  const [options, setOptions] = useState(false);
  const stamp = (value: string) => new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  async function copy() {
    try { await Clipboard.setStringAsync(id); setNotice('Protocolo copiado.'); }
    catch { setError('Não foi possível copiar o protocolo.'); }
  }
  async function share() {
    try { await Share.share({ message: 'Chamado #' + id + ' · SpeedZone' }); }
    catch { setError('Não foi possível compartilhar o protocolo.'); }
  }
  return <SafeAreaView style={s.safe}>
    <View style={s.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar aos chamados" disabled={busy} onPress={() => router.replace('/admin-support')} style={s.icon}><StoreIcon name="chevron-left" color={c.text} size={28} /></Pressable>
      <View style={s.flex}><Text style={s.label}>CHAMADO TÉCNICO</Text><Text style={s.title}>Detalhes do chamado</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Compartilhar protocolo" onPress={() => void share()} style={s.icon}><StoreIcon name="share-variant-outline" color={c.muted} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Mais ações" onPress={() => setOptions(true)} style={s.icon}><StoreIcon name="dots-vertical" color={c.muted} /></Pressable>
      <PilotAvatar size={36} />
    </View>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        {loading && <ActivityIndicator color={c.primary} />}
        {!!error && <View style={s.card}><Text accessibilityRole="alert" style={s.error}>{error}</Text>{!ticket && <ProductAction label="Tentar novamente" onPress={() => { setLoading(true); setRetry(v => v + 1); }} />}</View>}
        {!!notice && <Text accessibilityLiveRegion="polite" style={s.green}>{notice}</Text>}
        {ticket && !loading && <>
          <View style={s.wrap}>
            <View style={s.row}><Text selectable style={s.protocol}>#{ticket.id}</Text><Pressable accessibilityRole="button" accessibilityLabel="Copiar protocolo" onPress={() => void copy()} style={s.copy}><StoreIcon name="content-copy" size={20} color={c.muted} /></Pressable></View>
            <Text style={s.pill}>{ticket.status === 'closed' ? '✓ RESOLVIDO' : '● ANÁLISE ATIVA'}</Text>
          </View>
          <View style={s.wrap}><View style={s.meta}><StoreIcon name="clock-outline" size={14} color={c.muted} /><Text style={s.small}>Aberto {stamp(ticket.createdAt)}</Text></View></View>
          <View style={s.card}>
            <View style={s.row}><StoreIcon name="car-outline" size={20} /><Text style={s.label}>VEÍCULO DO CHAMADO</Text></View>
            <Text style={s.vehicle}>{ticket.vehicle || 'Veículo não informado'}</Text>
            <Text style={s.secondary}>{supportCategories.find(item => item.id === ticket.category)?.label || ticket.category}</Text>
            {ticket.orderId && <View style={s.inset}><StoreIcon name="package-variant-closed" size={34} /><View style={s.flex}><Text style={s.small}>PEDIDO VINCULADO</Text><Text style={s.title}>#{ticket.orderId}</Text></View>{user?.isAdmin && <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/admin-order', params: { id: ticket.orderId } })} style={s.action}><Text style={s.green}>Ver pedido →</Text></Pressable>}</View>}
          </View>
          <View style={[s.card, s.row]}>
            <PilotAvatar size={54} />
            <View style={s.flex}><Text style={s.title}>{user?.name} {user?.surname}</Text><Text style={s.secondary}>Equipe técnica SpeedZone</Text><Text style={s.green}>Responsável pela resposta</Text></View>
            <StoreIcon name="shield-check-outline" size={24} />
          </View>
          <View style={s.wrap}><Text style={s.label}>HISTÓRICO TÉCNICO & MENSAGENS</Text><Text style={s.small}>{ticket.messages.length + 1} mensagens</Text></View>
          <View style={s.card}>
            <View style={s.row}><View style={s.avatar}><Text style={s.green}>{ticket.name.slice(0,2).toUpperCase()}</Text></View><View style={s.flex}><Text style={s.title}>{ticket.name}</Text><Text style={s.small}>Piloto</Text></View><Text style={s.small}>{stamp(ticket.createdAt)}</Text></View>
            <Text selectable style={s.body}>{ticket.description}</Text>
            {ticket.attachment && <Pressable accessibilityRole="button" accessibilityLabel="Ver foto em tamanho completo" onPress={() => setPhoto(true)} style={s.inset}><Image source={{ uri: ticket.attachment }} style={s.thumbnail} /><View style={s.flex}><Text style={s.title}>Foto do chamado</Text><Text style={s.small}>Toque para ampliar</Text></View><StoreIcon name="arrow-expand" size={18} /></Pressable>}
          </View>
          {ticket.messages.map(message => <View key={message.author + message.id} style={[s.card, message.author === 'team' && s.team]}>
            <View style={s.row}><View style={s.avatar}><StoreIcon name={message.author === 'team' ? 'headset' : 'account-outline'} size={20} /></View><View style={s.flex}><Text style={s.title}>{message.author === 'team' ? message.authorName || 'Equipe SpeedZone' : ticket.name}</Text><Text style={message.author === 'team' ? s.green : s.small}>{message.author === 'team' ? 'Equipe técnica' : 'Piloto'}</Text></View><Text style={s.small}>{stamp(message.createdAt)}</Text></View>
            <Text selectable style={s.body}>{message.text}</Text>
          </View>)}
          <View style={[s.card, s.row]}><View style={s.avatar}><StoreIcon name="clipboard-check-outline" size={20} /></View><View style={s.flex}><Text style={s.green}>STATUS DO CHAMADO</Text><Text style={s.secondary}>{ticket.status === 'closed' ? 'Atendimento resolvido.' : 'Atendimento em análise.'}</Text></View><Text style={s.small}>{stamp(ticket.updatedAt)}</Text></View>
          {conflict && <View style={s.card}><Text style={s.error}>O chamado mudou. Confira a conversa antes de reenviar.</Text><ProductAction label="Conferi o histórico: usar versão atual" disabled={busy} onPress={() => { setVersion(ticket.updatedAt); requestKey.current = undefined; }} /></View>}
        </>}
      </ScrollView>
      {ticket && !loading && <View style={s.footer}>
        <View style={s.row}>
          <Pressable accessibilityRole="button" accessibilityLabel="Salvar rascunho" disabled={busy} onPress={saveDraft} style={s.tool}><StoreIcon name="content-save-outline" color={c.muted} /></Pressable>
          {ticket.attachment && <Pressable accessibilityRole="button" accessibilityLabel="Abrir foto anexada" onPress={() => setPhoto(true)} style={s.tool}><StoreIcon name="image-outline" color={c.muted} /></Pressable>}
          <TextInput accessibilityLabel="Resposta de engenharia" editable={!busy} multiline maxLength={2000} placeholder="Digite sua resposta técnica…" placeholderTextColor={c.muted} value={text} onChangeText={edit} style={s.input} />
          <Pressable accessibilityRole="button" accessibilityLabel="Enviar parecer" disabled={busy || !text.trim() || conflict} onPress={() => void send()} style={[s.send, (busy || !text.trim() || conflict) && { opacity: 0.45 }]}>{busy ? <ActivityIndicator color={c.onPrimary} /> : <StoreIcon name="send-outline" color={c.onPrimary} />}</Pressable>
        </View>
        <View style={s.wrap}>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: status === 'closed', disabled: busy }} disabled={busy} onPress={() => { setStatus(status === 'closed' ? 'open' : 'closed'); requestKey.current = undefined; }} style={s.action}><Text style={status === 'closed' ? s.green : s.small}>{status === 'closed' ? '✓ Resolver ao enviar' : 'Marcar como resolvido ao enviar'}</Text></Pressable>
          <Text style={s.small}>{text.length}/2000</Text>
        </View>
      </View>}
    </KeyboardAvoidingView>
    <Modal visible={options} transparent animationType="fade" onRequestClose={() => setOptions(false)}><View style={s.scrim}><View style={s.card}><Text style={s.title}>Ações do chamado</Text><AdminThemeToggle />{ticket && <><Text selectable style={s.secondary}>{ticket.name} · {ticket.email}</Text><ProductAction label="Salvar rascunho" disabled={busy} onPress={() => { saveDraft(); setOptions(false); }} /></>}<ProductAction label="Fechar" onPress={() => setOptions(false)} /></View></View></Modal>
    <Modal visible={photo} transparent animationType="fade" onRequestClose={() => setPhoto(false)}><View style={s.overlay}><ProductAction label="Fechar foto" onPress={() => setPhoto(false)} /><ScrollView maximumZoomScale={4} contentContainerStyle={{ flexGrow: 1 }}>{ticket?.attachment && <Image accessibilityLabel="Evidência anexada ao chamado" source={{ uri: ticket.attachment }} resizeMode="contain" style={{ width: '100%', height: 560 }} />}</ScrollView></View></Modal>
  </SafeAreaView>;
}

const createTicketStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, minHeight: 72, backgroundColor: c.deepest },
  content: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 18, gap: 18, paddingBottom: 28 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1, minWidth: 0 },
  card: { padding: 18, gap: 12, borderRadius: 10, backgroundColor: c.panel },
  team: { backgroundColor: c.elevated },
  title: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: c.text },
  protocol: { fontFamily: fonts.bold, fontSize: 23, color: c.text },
  vehicle: { fontFamily: fonts.bold, fontSize: 21, lineHeight: 28, color: c.text },
  label: { fontFamily: fonts.medium, fontSize: 12, letterSpacing: 0.3, color: c.muted },
  small: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 15, color: c.muted },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 26, color: c.text },
  secondary: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.muted },
  green: { fontFamily: fonts.medium, fontSize: 11, color: c.primary },
  error: { color: c.error, lineHeight: 21 },
  icon: { width: 36, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  copy: { width: 38, height: 40, borderRadius: 5, backgroundColor: c.input, alignItems: 'center', justifyContent: 'center' },
  pill: { color: c.primary, backgroundColor: c.primarySoft, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, fontSize: 10, fontFamily: fonts.bold },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: c.elevated },
  inset: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 5, backgroundColor: c.input },
  thumbnail: { width: 48, height: 48, borderRadius: 4 },
  input: { flex: 1, minHeight: 52, maxHeight: 120, backgroundColor: c.input, borderRadius: 5, padding: 12, color: c.text, fontSize: 15, textAlignVertical: 'top' },
  footer: { paddingHorizontal: 18, paddingTop: 12, width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: c.deepest },
  tool: { width: 44, height: 52, borderRadius: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: c.elevated },
  send: { width: 48, height: 52, borderRadius: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary },
  action: { minHeight: 44, justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: c.deepest, gap: 12, padding: 16 },
  scrim: { flex: 1, backgroundColor: '#0009', padding: 20, justifyContent: 'center' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' },
});
