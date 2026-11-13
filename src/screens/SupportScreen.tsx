import { ThemeColors , fonts as f } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { SupportCategory, SupportTicket, supportCategories, supportFaq } from '../data/support';
import { StoreIcon } from '../components/StoreHeader';
import { PilotAvatar } from '../components/PilotAvatar';

export default function SupportScreen({ orderId }: { orderId?: string }) {
  const { colors: c } = useTheme();
  const s = useThemedStyles(createS);

  const { user, listTickets, createTicket } = useAuth();
  const [name, setName] = useState(`${user?.name || ''} ${user?.surname || ''}`.trim());
  const [email, setEmail] = useState(user?.email || '');
  const [category, setCategory] = useState<SupportCategory>(orderId ? 'order' : 'installation');
  const [vehicleId, setVehicleId] = useState<string | null>(user?.activeCarId || null);
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [dialog, setDialog] = useState<'category' | 'vehicle' | 'warranty' | null>(null);
  const [faq, setFaq] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const pending = useRef<{ signature: string; key: string } | null>(null);
  const submitting = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const formY = useRef(0);
  const [formOpen, setFormOpen] = useState(!!orderId);
  const vehicle = user?.cars.find(car => car.id === vehicleId);
  const reload = async () => { setLoading(true); setLoadError(''); try { setTickets(await listTickets()); } catch (cause) { setLoadError((cause as Error).message); } finally { setLoading(false); } };
  useFocusEffect(useCallback(() => { let alive = true; let inFlight = false; const load = async () => { if (inFlight) return; inFlight = true; try { const data = await listTickets(); if (alive) { setTickets(data); setLoadError(''); } } catch (cause) { if (alive) setLoadError((cause as Error).message); } finally { inFlight = false; if (alive) setLoading(false); } }; void load(); const timer = setInterval(() => void load(), 10000); return () => { alive = false; clearInterval(timer); }; }, [listTickets]));
  const openForm = () => { setFormOpen(true); setDialog(null); scroll.current?.scrollTo({ y: formY.current, animated: true }); };
  async function openWhatsApp() {
    const message = encodeURIComponent('Olá! Vim pelo aplicativo SpeedZone e gostaria de conversar com a equipe do Box.');
    try { await Linking.openURL(`https://wa.me/5541999627476?text=${message}`); }
    catch { setError('Não foi possível abrir o WhatsApp neste dispositivo.'); }
  }
  async function selectImage() {
    if (busy || pickerBusy) return;
    setError(''); setPickerBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.8 });
      if (result.canceled) return;
      const asset = result.assets[0]; const base64 = asset.base64;
      if (!base64 || (asset.fileSize || base64.length * 0.75) > 5 * 1024 * 1024) throw new Error('Escolha uma imagem de até 5 MB.');
      const mime = base64.startsWith('/9j/') ? 'image/jpeg' : base64.startsWith('iVBORw0KGgo') ? 'image/png' : base64.startsWith('UklGR') ? 'image/webp' : '';
      if (!mime) throw new Error('Use uma imagem PNG, JPEG ou WebP.');
      setAttachment(`data:${mime};base64,${base64}`);
    } catch (cause) { setError((cause as Error).message); } finally { setPickerBusy(false); }
  }
  async function submit() {
    if (submitting.current || pickerBusy) return;
    if (name.trim().length < 2) { setError('Informe seu nome.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Informe um e-mail válido.'); return; }
    if (description.trim().length < 20) { setError('Descreva sua solicitação com pelo menos 20 caracteres.'); return; }
    submitting.current = true; setBusy(true); setError('');
    const draft = { name, email, category, vehicleId, description, attachment, ...(orderId ? { orderId } : {}) };
    const signature = JSON.stringify(draft);
    // Idempotency key is generated on submission, never during render.
    if (pending.current?.signature !== signature) pending.current = { signature, key: Date.now() + '-' + Math.random().toString(36).slice(2) };
    try {
      const ticket = await createTicket(draft, pending.current.key);
      setTickets(previous => [ticket, ...previous.filter(item => item.id !== ticket.id)]);
      setDescription(''); setAttachment(null); pending.current = null;
      router.push({ pathname: '/support-ticket/[id]', params: { id: ticket.id } });
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); submitting.current = false; }
  }
  const activeTickets = tickets.filter(ticket => ticket.status === 'open');
  const sortedTickets = [...tickets].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const visibleTickets = showHistory ? sortedTickets : sortedTickets.slice(0, 1);
  return <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}><View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Voltar para Conta" onPress={() => router.canGoBack() ? router.back() : router.replace('/(main)/account')} style={s.icon}><StoreIcon name="arrow-left" color={c.text} /></Pressable><View style={s.grow}><Text style={s.section}>Central de Atendimento</Text><Text style={s.small}>SpeedZone Box</Text></View><StoreIcon name="headset" color={c.primary} /></View>
  <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    <View><Text style={s.title}>Suporte Técnico &amp; Box</Text><Text style={s.body}>Assistência técnica especializada para pilotos SpeedZone.</Text></View>
    <View style={s.card}>
      <View style={s.row}>
        <PilotAvatar size={52} />
        <View style={s.grow}>
          <Text style={s.section}>{[user?.name, user?.surname].filter(Boolean).join(' ') || 'Piloto SpeedZone'}</Text>
          <View style={s.row}><StoreIcon name="flag-checkered" size={16} color={c.muted} /><Text style={[s.body,s.grow]}>{vehicle?.model || 'Sem veículo selecionado'}</Text></View>
        </View>
      </View>
      <View style={s.strip}><StoreIcon name="clipboard-text-outline" size={17} color={c.primary} /><Text style={[s.link,s.grow]}>Chamados em andamento</Text><Text style={s.link}>{loading || loadError ? '—' : activeTickets.length}</Text></View>
    </View>
    <Text style={s.heading}>Canais diretos do Box</Text>
    <View style={s.card}>
      <View style={s.row}>
        <View style={[s.tile,s.primary]}><StoreIcon name="chat" color={c.onPrimary} /></View>
        <View style={s.grow}><Text style={s.section}>WhatsApp do Preparador</Text><Text style={s.small}>Atendimento direto com a equipe</Text></View>
      </View>
      <Text style={s.body}>Tem uma dúvida de montagem ou acerto? Converse diretamente com a equipe pelo WhatsApp.</Text>
      <Pressable accessibilityRole="link" accessibilityLabel="Conversar com o Box pelo WhatsApp" onPress={() => void openWhatsApp()} style={[s.button,s.primary]}><StoreIcon name="whatsapp" color={c.onPrimary} size={19} /><Text style={s.primaryText}>Conversar com o Box</Text></Pressable>
    </View>
    <View style={s.card} onLayout={event => { formY.current = event.nativeEvent.layout.y; }}>
      <View style={s.row}>
        <View style={[s.tile,{backgroundColor:c.primarySoft}]}><StoreIcon name="wrench-outline" color={c.primary} /></View>
        <View style={s.grow}><Text style={s.section}>Chamado de Engenharia (O.S.)</Text><Text style={s.small}>Compatibilidade, instalação e garantia</Text></View>
      </View>
      <Text style={s.body}>Descreva o que aconteceu e anexe uma foto da peça ou da montagem para análise técnica.</Text>
      <Pressable accessibilityRole="button" accessibilityState={{expanded:formOpen}} onPress={() => setFormOpen(!formOpen)} style={s.button}><StoreIcon name={formOpen ? 'chevron-up' : 'clipboard-plus-outline'} size={18} color={c.text} /><Text style={s.buttonText}>{formOpen ? 'Recolher formulário' : 'Abrir novo chamado'}</Text></Pressable>
      {formOpen && <View style={{gap:12}}>{orderId && <Text style={s.green}>Pedido vinculado: #{orderId}</Text>}
      <Text style={s.label}>Nome do Piloto / Mecânico</Text><TextInput accessibilityLabel="Nome do Piloto / Mecânico" value={name} onChangeText={setName} editable={!busy} maxLength={140} style={s.input} autoComplete="name" />
      <Text style={s.label}>E-mail para Telemetria & Laudos</Text><TextInput accessibilityLabel="E-mail para Telemetria e Laudos" value={email} onChangeText={setEmail} editable={!busy} maxLength={254} keyboardType="email-address" autoCapitalize="none" autoComplete="email" style={s.input} />
      <Text style={s.label}>Tipo de Solicitação / Categoria</Text><Pressable accessibilityRole="button" accessibilityLabel="Selecionar categoria do chamado" disabled={busy} onPress={() => setDialog('category')} style={[s.input, s.row]}><Text style={[s.body, s.grow]}>{supportCategories.find(item => item.id === category)?.label}</Text><StoreIcon name="chevron-down" color={c.muted} size={18} /></Pressable>
      <Text style={s.label}>Veículo / Projeto Vinculado</Text><Pressable accessibilityRole="button" accessibilityLabel="Alterar veículo do chamado" disabled={busy} onPress={() => setDialog('vehicle')} style={[s.input, s.row]}><StoreIcon name="car-outline" size={20} /><Text style={[s.body, s.grow]}>{vehicle?.model || 'Sem veículo vinculado'}</Text><Text style={s.micro}>ALTERAR</Text></Pressable>
      <View style={s.between}><Text style={[s.label, s.grow]}>Descrição Técnica do Sintoma ou Dúvida</Text><Text style={s.micro}>{description.length}/4000</Text></View><TextInput accessibilityLabel="Descrição técnica" value={description} onChangeText={setDescription} editable={!busy} multiline maxLength={4000} placeholder="Descreva o sintoma, a peça, as modificações do veículo e sua dúvida..." placeholderTextColor={c.subtle} style={[s.input, s.textarea]} />
      <Text style={s.label}>Evidências Mecânicas</Text><Pressable accessibilityRole="button" disabled={busy || pickerBusy} onPress={selectImage} style={s.button}><StoreIcon name="camera-plus-outline" size={20} /><Text style={s.buttonText}>{pickerBusy ? 'Lendo imagem...' : attachment ? 'Trocar imagem anexada' : 'Anexar foto ou diagrama (opcional)'}</Text></Pressable><Text style={s.small}>PNG, JPEG ou WebP • até 5 MB • uma imagem por chamado</Text>{attachment && <View style={{ gap: 8 }}><Image accessibilityLabel="Prévia da evidência" source={{ uri: attachment }} resizeMode="contain" style={s.evidence} /><Pressable accessibilityRole="button" disabled={busy} onPress={() => setAttachment(null)} style={s.button}><Text style={s.buttonText}>Remover anexo</Text></Pressable></View>}
      {error !== '' && <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>}<Pressable accessibilityRole="button" accessibilityLabel="Registrar chamado técnico" disabled={busy || pickerBusy} onPress={() => void submit()} style={[s.button, s.primary, (busy || pickerBusy) && { opacity: 0.5 }]}><StoreIcon name="send-outline" color={c.onPrimary} size={20} /><Text style={s.primaryText}>{busy ? 'Salvando chamado...' : 'Registrar Solicitação Técnica'}</Text></Pressable><Text style={s.small}>Registro local. Nenhuma mensagem é enviada por WhatsApp ou e-mail.</Text>
      </View>}
    </View>
    <View style={s.between}>
      <Text style={[s.heading,s.grow]}>{showHistory ? 'Histórico de chamados' : 'Chamados recentes'}</Text>
      <Pressable accessibilityRole="button" accessibilityState={{expanded:showHistory}} onPress={() => setShowHistory(!showHistory)} style={s.filter}><Text style={s.link}>{showHistory ? 'Ver recente' : 'Ver histórico (' + tickets.length + ')'}</Text></Pressable>
    </View>
    {loading && <ActivityIndicator color={c.primary} />}{loadError !== '' && <View style={s.card}><Text style={s.error}>{loadError}</Text><Pressable accessibilityRole="button" onPress={reload} style={s.button}><Text style={s.buttonText}>Recarregar chamados</Text></Pressable></View>}
    {visibleTickets.map(ticket => <View key={ticket.id} style={s.card}><View style={s.between}><Text style={s.section}>#{ticket.id}</Text><Text style={s.micro}>{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</Text></View><Text style={s.badgeText}>{supportCategories.find(item => item.id === ticket.category)?.label}</Text><Text numberOfLines={2} style={s.section}>{ticket.description}</Text><View style={s.messagePreview}><Text style={s.body}>{ticket.messages.at(-1)?.text || 'Solicitação registrada. Nenhuma resposta da equipe disponível.'}</Text></View><View style={s.between}><Text style={[s.small, s.grow]}>{ticket.status === 'closed' ? 'RESOLVIDO' : ticket.messages.at(-1)?.author === 'team' ? 'RESPONDIDO PELA EQUIPE' : 'AGUARDANDO ATENDIMENTO'}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Ver conversa ${ticket.id}`} onPress={() => router.push({ pathname: '/support-ticket/[id]', params: { id: ticket.id } })} style={s.button}><Text style={s.buttonText}>Ver Conversa ›</Text></Pressable></View></View>)}
    {!loading && !loadError && !visibleTickets.length && <View style={s.card}><Text style={s.body}>Seus chamados aparecerão aqui após a primeira solicitação.</Text></View>}
    <Pressable accessibilityRole="button" accessibilityLabel="Detalhes de garantia e troca de peças" onPress={() => setDialog('warranty')} style={[s.card, s.row]}><StoreIcon name="shield-check-outline" color={c.primary} /><View style={s.grow}><Text style={s.section}>Garantia & Troca de Peças</Text><Text style={s.body}>Consulte orientações para sua solicitação</Text></View><Text style={s.micro}>DETALHES ›</Text></Pressable>
    <View style={s.between}><Text style={[s.heading,s.grow]}>Dúvidas frequentes</Text><Text style={s.small}>Autoatendimento</Text></View>
    <View style={s.faqGroup}>{supportFaq.map((item, index) => <View key={item.title} style={s.faq}><Pressable accessibilityRole="button" accessibilityState={{ expanded: faq === index }} onPress={() => setFaq(faq === index ? null : index)} style={[s.row, { minHeight: 52 }]}><StoreIcon name="help-circle-outline" size={18} color={c.primary} /><Text style={[s.section, s.grow]}>{item.title}</Text><StoreIcon name={faq === index ? 'chevron-up' : 'chevron-down'} color={c.muted} size={20} /></Pressable>{faq === index && <Text style={[s.body, { paddingBottom: 14 }]}>{item.text}</Text>}</View>)}
    </View>
    <View style={[s.card,s.trackDay]}><View style={s.row}><StoreIcon name="flag-checkered" color={c.error} /><View style={s.grow}><Text style={s.section}>Plantão Box • Track Day</Text><Text style={s.body}>Atendimento de pista indisponível.</Text></View></View></View>
  </ScrollView></KeyboardAvoidingView>
  <Modal visible={dialog !== null} transparent animationType="fade" onRequestClose={() => setDialog(null)}><View style={s.overlay}><View style={s.dialog}><View style={s.between}><Text style={s.section}>{dialog === 'category' ? 'Tipo de Solicitação' : dialog === 'vehicle' ? 'Selecionar Projeto' : dialog === 'warranty' ? 'Garantia & Troca' : 'WhatsApp do Preparador'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar opções de suporte" onPress={() => setDialog(null)} style={s.icon}><StoreIcon name="close" color={c.text} /></Pressable></View><ScrollView contentContainerStyle={{ gap: 10 }}>{dialog === 'category' ? supportCategories.map(item => <Pressable accessibilityRole="radio" accessibilityState={{ checked: category === item.id }} key={item.id} onPress={() => { setCategory(item.id); setDialog(null); }} style={s.button}><Text style={s.buttonText}>{item.label}</Text></Pressable>) : dialog === 'vehicle' ? <>{[{ id: null, model: 'Sem veículo vinculado' }, ...(user?.cars || [])].map(car => <Pressable key={car.id || 'none'} accessibilityRole="radio" accessibilityState={{ checked: vehicleId === car.id }} onPress={() => { setVehicleId(car.id); setDialog(null); }} style={s.button}><Text style={s.buttonText}>{car.model}</Text></Pressable>)}</> : <><Text style={s.body}>{dialog === 'warranty' ? 'Para registrar uma solicitação, informe o pedido, a peça e a descrição do problema. Anexe uma foto e selecione Garantia ou Devolução. A cobertura e as condições dependem da documentação do produto; não há garantia automaticamente ativada nesta demonstração.' : 'Este canal ainda não está conectado a uma equipe de atendimento. Você pode registrar uma solicitação local e complementar as informações na conversa do chamado.'}</Text><Pressable accessibilityRole="button" onPress={() => { if (dialog === 'warranty') setCategory('warranty'); openForm(); }} style={[s.button, s.primary]}><Text style={s.primaryText}>Abrir chamado técnico</Text></Pressable></>}</ScrollView></View></View></Modal></SafeAreaView>;
}
const createS = (c: ThemeColors) => StyleSheet.create({
  strip: {flexDirection:'row', alignItems:'center', gap:8, padding:12, borderRadius:14, backgroundColor:c.primarySoft},
  tile: {width:46, height:46, borderRadius:15, alignItems:'center', justifyContent:'center'},
  heading: {fontFamily:f.bold, color:c.text, fontSize:17},
  faqGroup: {borderRadius:18, overflow:'hidden', borderWidth:1, borderColor:c.surfaceBorder},
  trackDay: {backgroundColor:c.dangerSoft},
  safe: { flex: 1, backgroundColor: c.background }, header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10, backgroundColor: c.deepest }, icon: { minWidth: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, brand: { flexDirection: 'row', alignItems: 'center', gap: 3 }, brandText: { color: c.text, fontFamily: f.heavy, fontSize: 10, fontStyle: 'italic' }, headerText: { flex: 1, color: c.text, fontFamily: f.bold, fontSize: 14 }, content: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: 16, gap: 14, paddingBottom: 40 }, grow: { flex: 1, minWidth: 0 }, green: { color: c.primary }, row: { flexDirection: 'row', alignItems: 'center', gap: 8 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, garage: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.primarySoft, padding: 16, gap: 12, borderRadius: 18 }, garageName: { color: c.text, fontFamily: f.bold, fontSize: 12 }, stage: { backgroundColor: c.primarySoft, color:c.primary, fontFamily:f.bold, fontSize:11, padding: 7, borderRadius:10, maxWidth:100 }, micro: { color: c.muted, fontFamily: f.medium, fontSize: 9, letterSpacing: 0.4 }, title: { color: c.text, fontFamily: f.bold, fontSize: 24, letterSpacing: -0.6, marginBottom: 4 }, body: { color: c.muted, fontFamily: f.regular, fontSize: 12, lineHeight: 18 }, section: { color: c.text, fontFamily: f.bold, fontSize: 14, lineHeight: 20 }, card: { borderWidth: 1, borderColor: c.surfaceBorder, backgroundColor: c.panel, borderRadius: 24, padding: 18, gap: 14 }, iconTile: { padding: 6, borderRadius: 4, backgroundColor: c.panel }, badge: { backgroundColor: c.primarySoft, borderRadius: 10, padding: 7 }, badgeText: { color: c.primary, fontFamily: f.bold, fontSize: 9, lineHeight: 14, letterSpacing: 0.3 }, button: { borderWidth: 1, borderColor: c.border, minHeight: 46, padding: 10, borderRadius: 12, backgroundColor: c.elevated, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, buttonText: { color: c.text, fontFamily: f.medium, fontSize: 12, textAlign: 'center', flexShrink: 1 }, primary: { backgroundColor: c.action }, primaryText: { color: c.onPrimary, fontFamily: f.bold, fontSize: 12, textAlign: 'center', flexShrink: 1 }, label: { color: c.muted, fontFamily: f.regular, fontSize: 11, marginTop: 3 }, input: { borderWidth: 1, borderColor: c.border, minHeight: 46, backgroundColor: c.deepest, color: c.text, padding: 12, borderRadius: 4, fontFamily: f.regular, fontSize: 13 }, textarea: { minHeight: 120, textAlignVertical: 'top', lineHeight: 20 }, small: { color: c.subtle, fontFamily: f.regular, fontSize: 10, lineHeight: 15 }, evidence: { width: '100%', height: 160, backgroundColor: c.deepest, borderRadius: 5 }, error: { color: c.error, fontFamily: f.regular, fontSize: 12, lineHeight: 18 }, filter: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' }, link: { color: c.primary, fontFamily: f.medium, fontSize: 12 }, messagePreview: { backgroundColor: c.deepest, padding: 10, borderRadius: 4 }, banner: { height: 130, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end', marginVertical: 4 }, bannerImage: { position: 'absolute', width: '100%', height: '100%', opacity: 0.6 }, bannerShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.primarySoft }, bannerCopy: { padding: 12, gap: 3 }, faq: { paddingHorizontal: 14, backgroundColor: c.panel, borderBottomWidth:StyleSheet.hairlineWidth, borderColor:c.surfaceBorder }, overlay: { flex: 1, backgroundColor: '#000b', padding: 20, alignItems: 'center', justifyContent: 'center' }, dialog: { backgroundColor: c.panel, borderRadius: 24, padding: 18, width: '100%', maxWidth: 460, maxHeight: '85%', gap: 14 },
});
