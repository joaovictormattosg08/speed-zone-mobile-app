import { useTheme , useThemedStyles } from '../theme/ThemeContext';
import { palette as speedPalette } from '../theme/tokens';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AdminDetail, DetailSection } from '../components/AdminDetailUI';
import { ProductAction, createPs } from '../components/AdminProductUI';
import { useAuth } from '../context/AuthContext';
import { SupportTicket, supportCategories } from '../data/support';

// Drafts remain isolated by signed-in operator and ticket while navigating in this session.
const drafts = new Map<string, { text: string; status: 'open' | 'closed'; version: string; key?: string }>();
export default function AdminTicketDetailScreen() {
  const { colors: c } = useTheme();

  const s = useThemedStyles(createPs);

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
  return <AdminDetail title="Detalhes do Chamado de Suporte" back="/admin-support" busy={busy} footer={<View style={s.row}><View style={s.flex}><ProductAction label="Rascunho" disabled={busy || !ticket} onPress={saveDraft} /></View><View style={{ flex: 2 }}><ProductAction primary label={busy ? 'Enviando…' : '➤ Enviar Parecer'} disabled={busy || loading || !ticket || !text.trim() || conflict} onPress={() => void send()} /></View></View>}>
    {loading && <ActivityIndicator color={c.primary} />}{!!error && <View style={s.card}><Text accessibilityRole="alert" style={s.error}>{error}</Text>{!ticket && <ProductAction label="Tentar novamente" onPress={() => { setLoading(true); setRetry(v => v + 1); }} />}</View>}{!!notice && <Text accessibilityLiveRegion="polite" style={s.green}>{notice}</Text>}
    {ticket && !loading && <><Text style={s.eyebrow}>SUPORTE · {ticket.status === 'closed' ? '✓ RESOLVIDO' : '● CHAMADO ATIVO'}</Text><Text style={[s.title, { fontSize: 28, lineHeight: 36 }]}>Chamado #{ticket.id}</Text><Text style={s.small}>Abertura {new Date(ticket.createdAt).toLocaleString('pt-BR')}</Text>
      <DetailSection title={supportCategories.find(c => c.id === ticket.category)?.label || ticket.category}><Text style={s.label}>Piloto / solicitante</Text><Text style={s.title}>{ticket.name}</Text><Text selectable style={s.body}>{ticket.email}</Text><Text style={s.label}>Veículo / setup</Text><Text style={[s.section, { color: c.primary }]}>{ticket.vehicle || 'Não informado'}</Text>{ticket.orderId && <><Text style={s.label}>Pedido vinculado</Text><ProductAction label={'#' + ticket.orderId + (user?.isAdmin ? ' → Ver Pedido' : '')} disabled={!user?.isAdmin} onPress={() => router.push({ pathname: '/admin-order', params: { id: ticket.orderId } })} /></>}</DetailSection>
      <DetailSection title="Relato do Piloto"><Text selectable style={[s.body, { fontStyle: 'italic', fontSize: 16, lineHeight: 25 }]}>{ticket.description}</Text>{ticket.attachment && <><Text style={s.label}>Telemetria & evidência anexa</Text><Image source={{ uri: ticket.attachment }} resizeMode="cover" style={{ width: '100%', height: 150, borderRadius: 5 }} /><ProductAction label="Ver foto em tamanho completo" onPress={() => setPhoto(true)} /></>}</DetailSection>
      <DetailSection title="Diagnóstico Técnico"><Text style={s.eyebrow}>RESPONSÁVEL PELA RESPOSTA · {user?.name} {user?.surname}</Text><Text style={s.label}>Status após o envio</Text><View style={s.row}><View style={s.flex}><ProductAction label="Em Análise" primary={status === 'open'} disabled={busy} onPress={() => { setStatus('open'); requestKey.current = undefined; }} /></View><View style={s.flex}><ProductAction label="Resolvido" primary={status === 'closed'} disabled={busy} onPress={() => { setStatus('closed'); requestKey.current = undefined; }} /></View></View><Text style={s.label}>Resposta de engenharia</Text><TextInput accessibilityLabel="Resposta de engenharia" editable={!busy} multiline maxLength={2000} placeholder="Descreva a análise, as especificações e os próximos passos…" placeholderTextColor={c.muted} value={text} onChangeText={edit} style={[s.input, { minHeight: 190, textAlignVertical: 'top', lineHeight: 24 }]} /><Text style={s.small}>{text.length}/2000 · A resposta ficará disponível no app do piloto.</Text>{conflict && <View style={s.card}><Text style={s.error}>O chamado mudou. Confira a conversa abaixo antes de reenviar.</Text><ProductAction label="Conferi o histórico: usar versão atual" disabled={busy} onPress={() => { setVersion(ticket.updatedAt); requestKey.current = undefined; }} /></View>}</DetailSection>
      <DetailSection title={`Conversa · ${ticket.messages.length} mensagens`}>{ticket.messages.length ? ticket.messages.map(message => <View key={message.author + message.id} style={[s.card, { backgroundColor: speedPalette.carbonBlack, borderLeftWidth: 2, borderLeftColor: message.author === 'team' ? speedPalette.speedGreen : speedPalette.speedGreen }]}><Text style={s.eyebrow}>{message.author === 'team' ? message.authorName || 'Equipe SpeedZone' : ticket.name}</Text><Text style={s.small}>{new Date(message.createdAt).toLocaleString('pt-BR')}</Text><Text selectable style={s.body}>{message.text}</Text></View>) : <Text style={s.body}>Nenhuma resposta enviada.</Text>}</DetailSection>
    </>}
    <Modal visible={photo} transparent animationType="fade" onRequestClose={() => setPhoto(false)}><View style={[s.overlay, { padding: 16 }]}><ProductAction label="Fechar foto" onPress={() => setPhoto(false)} /><ScrollView maximumZoomScale={4} contentContainerStyle={{ flexGrow: 1 }}>{ticket?.attachment && <Image accessibilityLabel="Evidência anexada ao chamado" source={{ uri: ticket.attachment }} resizeMode="contain" style={{ width: '100%', height: 560 }} />}</ScrollView></View></Modal>
  </AdminDetail>;
}
