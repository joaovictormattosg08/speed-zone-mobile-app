import { ScreenHeader } from '../components/ScreenHeader';
import { AdminThemeToggle } from '../components/AdminThemeToggle';
import { ThemeColors , fonts as f } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { SupportTicket, supportCategories } from '../data/support';
import { StoreIcon } from '../components/StoreHeader';
import { ProductAction, createPs } from '../components/AdminProductUI';
import { PilotAvatar } from '../components/PilotAvatar';
import { AdminNavigation } from '../components/AdminNavigation';
type Draft = { text: string; status: 'open' | 'closed'; version: string; key?: string };
const categoryName = (ticket: SupportTicket) => supportCategories.find(category => category.id === ticket.category)?.label || ticket.category;
const date = (value: string) => new Date(value).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
export default function AdminSupportScreen() {
  const { colors: c } = useTheme();
  const local = useThemedStyles(createLocal);
  const base = useThemedStyles(createPs);
  const layout = useThemedStyles(createLayout);
  const s = { ...base, ...layout };

  const { listAdminTickets, getAdminTicket, respondTicket } = useAuth();
  const [tickets,setTickets] = useState<SupportTicket[]>([]), [loading,setLoading] = useState(true), [error,setError] = useState(''), [notice,setNotice] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [filter,setFilter] = useState<'all'|'open'|'closed'>('all'), [category,setCategory] = useState('all'), [query,setQuery] = useState('');
  const [drafts,setDrafts] = useState<Record<string,Draft>>({}), [expanded,setExpanded] = useState<string|null>(null), [busy,setBusy] = useState<string|null>(null);
  const [history,setHistory] = useState<SupportTicket|null>(null), [historyId,setHistoryId] = useState<string|null>(null), [historyError,setHistoryError] = useState('');
  const locked = useRef(false), historyRequest = useRef(0);
  const refresh = useCallback(async () => { const data = await listAdminTickets(); setTickets(data); setError(''); }, [listAdminTickets]);
  useFocusEffect(useCallback(() => { let alive=true,inFlight=false; const load=async()=>{if(inFlight||locked.current)return;inFlight=true;try{const data=await listAdminTickets();if(alive){setTickets(data);setError('');}}catch(e){if(alive)setError((e as Error).message);}finally{inFlight=false;if(alive)setLoading(false);}};void load();const timer=setInterval(()=>void load(),10000);return()=>{alive=false;clearInterval(timer);};},[listAdminTickets]));
  const draftFor = (ticket:SupportTicket):Draft => drafts[ticket.id] || {text:'',status:ticket.status,version:ticket.updatedAt};
  function edit(ticket:SupportTicket, values:Partial<Draft>) {setDrafts(previous=>({...previous,[ticket.id]:{...draftFor(ticket),...values,key:undefined}}));}
  async function openHistory(ticket:SupportTicket) {const version=++historyRequest.current;setHistoryId(ticket.id);setHistory(null);setHistoryError('');try{const full=await getAdminTicket(ticket.id);if(version===historyRequest.current)setHistory(full);}catch(e){if(version===historyRequest.current)setHistoryError((e as Error).message);}}
  function closeHistory(){historyRequest.current++;setHistoryId(null);setHistory(null);}
  async function send(ticket:SupportTicket) {
    const draft=draftFor(ticket); if(locked.current||!draft.text.trim())return;
    locked.current=true;setBusy(ticket.id);setError('');setNotice('');
    const key=draft.key || Date.now()+'-'+Math.random().toString(36).slice(2);
    setDrafts(previous=>({...previous,[ticket.id]:{...draft,key}}));
    try {const result=await respondTicket(ticket.id,{text:draft.text.trim(),status:draft.status,requestKey:key,expectedUpdatedAt:draft.version});setTickets(previous=>previous.map(item=>item.id===result.id?result:item));setDrafts(previous=>{const next={...previous};delete next[ticket.id];return next;});setExpanded(null);setNotice(result.status==='closed'?'Resposta enviada e chamado concluído.':'Resposta enviada ao cliente.');}
    catch(e){setError((e as Error).message);if((e as {status?:number}).status===409){await refresh().catch(()=>{});}}
    finally{locked.current=false;setBusy(null);}
  }
  const filtered=tickets.filter(ticket=>(filter==='all'||ticket.status===filter)&&(category==='all'||ticket.category===category)&&`${ticket.id} ${ticket.name} ${ticket.email} ${ticket.description} ${ticket.vehicle} ${ticket.orderId||''}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')));
  return <SafeAreaView style={s.safe}><ScreenHeader title="Central de chamados" eyebrow="SPEEDZONE ADMIN"><AdminThemeToggle/>
<Pressable accessibilityRole="button" accessibilityLabel="Voltar para Minha Conta" onPress={()=>router.replace('/(main)/account')}><PilotAvatar/></Pressable></ScreenHeader>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS==='ios'?'padding':undefined}><FlatList keyboardShouldPersistTaps="handled" data={filtered} keyExtractor={ticket=>ticket.id} contentContainerStyle={s.content} refreshing={loading} onRefresh={()=>{setLoading(true);void refresh().catch(e=>setError(e.message)).finally(()=>setLoading(false));}}
      ListHeaderComponent={<View style={{gap:16}}>{!!notice&&<View accessibilityLiveRegion="polite" style={s.card}><Text style={s.eyebrow}>✓ OPERAÇÃO CONCLUÍDA</Text><Text style={s.body}>{notice}</Text><ProductAction label="Fechar aviso" onPress={()=>setNotice('')}/></View>}<View style={layout.hero}>
        <View style={s.between}><Text style={s.eyebrow}>CENTRAL DE ATENDIMENTO</Text><StoreIcon name="headset" size={20}/></View>
        <Text style={layout.heroTitle}>Atendimento aos pilotos</Text>
        <Text style={s.body}>Acompanhe as conversas e os projetos em andamento.</Text>
        <View style={s.row}>
          <View style={layout.metric}><Text style={s.small}>EM ANDAMENTO</Text><Text style={layout.metricValue}>{tickets.filter(t=>t.status==='open').length}<Text style={s.eyebrow}> atendendo</Text></Text></View>
          <View style={layout.metric}><Text style={s.small}>RESOLVIDOS</Text><Text style={layout.metricValue}>{tickets.filter(t=>t.status==='closed').length}</Text></View>
        </View>
      </View>
      <View style={s.row}><View style={layout.search}><StoreIcon name="magnify" color={c.muted}/><TextInput accessibilityLabel="Buscar chamado" value={query} onChangeText={setQuery} placeholder="Buscar protocolo, piloto ou veículo…" placeholderTextColor={c.subtle} style={layout.searchInput}/></View><Pressable accessibilityRole="button" accessibilityLabel="Filtrar por categoria" accessibilityState={{expanded:categoryOpen}} onPress={()=>setCategoryOpen(!categoryOpen)} style={layout.filterButton}><StoreIcon name="tune" color={category!=='all'?c.primary:c.text}/></Pressable></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:6}}>{([{id:'all',label:'Todos'},{id:'open',label:'Em análise'},{id:'closed',label:'Resolvidos'}] as const).map(tab=><Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{selected:filter===tab.id}} onPress={()=>setFilter(tab.id)} style={[layout.chip,filter===tab.id&&{backgroundColor:c.primary}]}><Text style={[layout.chipText,filter===tab.id&&{color:c.onPrimary}]}>{tab.label}  {tickets.filter(t=>tab.id==='all'||t.status===tab.id).length}</Text></Pressable>)}</ScrollView>
      {categoryOpen&&<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:6}}><ProductAction label="Todas as categorias" primary={category==='all'} onPress={()=>setCategory('all')}/>{supportCategories.map(item=><ProductAction key={item.id} label={item.label} primary={category===item.id} onPress={()=>setCategory(item.id)}/>)}</ScrollView>}
      {!!error&&<View style={s.card}><Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text><ProductAction label="Atualizar chamados" onPress={()=>void refresh().catch(e=>setError(e.message))}/></View>}{loading&&<ActivityIndicator color={c.primary}/>}</View>}
      ListEmptyComponent={!loading&&!error?<View style={layout.empty}><StoreIcon name="text-box-search-outline" size={36}/><Text style={s.section}>Nenhum chamado encontrado</Text><Text style={s.body}>Tente outro termo ou ajuste os filtros.</Text><ProductAction label="Limpar filtros" onPress={()=>{setQuery("");setCategory("all");setFilter("all");}}/></View>:null}
      renderItem={({item:ticket})=>{const draft=draftFor(ticket);const changed=draft.version!==ticket.updatedAt && !ticket.messages.some(message=>message.author==='team'&&message.id===draft.key);return <View style={s.card}><View style={layout.ticketTop}><Text style={s.eyebrow}>#{ticket.id}</Text><Text style={[layout.status,{backgroundColor:ticket.status==="closed"?c.input:c.primarySoft,color:ticket.status==="closed"?c.muted:c.primary}]}>{ticket.status==="closed"?"✓ Resolvido":"● Em análise"}</Text></View><Text style={s.small}>Atualizado {date(ticket.updatedAt)}</Text><Text selectable numberOfLines={2} style={layout.ticketTitle}>{ticket.description}</Text><View style={layout.vehicleTag}><StoreIcon name="car-outline" size={16}/><Text style={local.blue}>{ticket.vehicle || 'Veículo não informado'}</Text></View><Text style={local.category}>{categoryName(ticket)}</Text>{ticket.orderId&&<Text style={s.small}>Pedido #{ticket.orderId}</Text>}<View style={local.customer}><View style={local.initials}><Text style={s.green}>{ticket.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</Text></View><View style={s.flex}><Text style={s.section}>{ticket.name}</Text><Text numberOfLines={1} style={s.small}>{ticket.email}</Text></View></View>{ticket.messages.length>0&&<View style={local.question}><Text style={s.eyebrow}>{ticket.messages.at(-1)?.author==='team'?'ÚLTIMA RESPOSTA DA EQUIPE':'NOVA MENSAGEM DO CLIENTE'}</Text><Text numberOfLines={3} style={s.body}>{ticket.messages.at(-1)?.text}</Text></View>}
      <Pressable accessibilityRole="button" onPress={()=>router.push({pathname:"/admin-ticket",params:{id:ticket.id}})} style={layout.detailLink}><Text style={s.green}>Acompanhar chamado</Text><StoreIcon name="arrow-right" size={19}/></Pressable>
      <Pressable accessibilityRole="button" onPress={()=>void openHistory(ticket)} style={layout.historyLink}><StoreIcon name={ticket.hasAttachment?"paperclip":"history"} size={17} color={c.muted}/><Text style={s.small}>Histórico {ticket.hasAttachment?"e anexo ":""}· {ticket.messages.length} mensagens</Text></Pressable>
      {expanded===ticket.id?<View style={{gap:12}}><Text style={s.small}>AÇÃO RÁPIDA DE ATENDIMENTO</Text><View style={s.row}><View style={s.flex}><ProductAction disabled={!!busy} primary={draft.status==='open'} label="Manter ativo" onPress={()=>edit(ticket,{status:'open'})}/></View><View style={s.flex}><ProductAction disabled={!!busy} primary={draft.status==='closed'} label="Concluir" onPress={()=>edit(ticket,{status:'closed'})}/></View></View><TextInput accessibilityLabel={`Resposta para ${ticket.id}`} editable={!busy} multiline maxLength={2000} value={draft.text} onChangeText={text=>edit(ticket,{text})} placeholder="Digite o parecer técnico ou especificação..." placeholderTextColor={c.subtle} style={[s.input,{minHeight:110,textAlignVertical:'top'}]}/><Text style={s.small}>{draft.text.length}/2000 • {draft.status==='closed'?'Enviar e resolver chamado':'Enviar e manter conversa ativa'}</Text>{changed&&<View style={local.question}><Text style={s.error}>O chamado foi atualizado enquanto você escrevia. Confira o histórico antes de enviar.</Text><ProductAction label="Já conferi: atualizar versão" onPress={()=>edit(ticket,{version:ticket.updatedAt})}/></View>}<ProductAction primary disabled={!!busy||!draft.text.trim()||changed} label={busy===ticket.id?'Enviando…':'Enviar Resposta como Equipe SpeedZone'} onPress={()=>void send(ticket)}/><ProductAction disabled={!!busy} label="Recolher resposta" onPress={()=>setExpanded(null)}/></View>:<ProductAction primary label={ticket.status==='closed'?'Responder / Reabrir':'↩ Responder'} onPress={()=>{setExpanded(ticket.id);if(ticket.status==='closed')edit(ticket,{status:'open'});}}/>}</View>;}}/>
    </KeyboardAvoidingView><AdminNavigation current="/admin-support" />
    <Modal visible={!!historyId} transparent animationType="slide" onRequestClose={closeHistory}><View style={[s.overlay,{justifyContent:'flex-end',padding:12}]}><View style={[s.card,{maxHeight:'90%'}]}><View style={s.between}><Text style={s.section}>Conversa #{historyId}</Text><ProductAction label="Fechar" onPress={closeHistory}/></View><ScrollView contentContainerStyle={{gap:14}}>{history?<><Text style={s.body}>{history.name} • {history.vehicle}</Text><Text style={s.eyebrow}>CLIENTE • {date(history.createdAt)}</Text><Text selectable style={s.body}>{history.description}</Text>{history.attachment&&<Image accessibilityLabel="Evidência enviada pelo cliente" source={{uri:history.attachment}} resizeMode="contain" style={{width:'100%',height:280}}/>}{history.messages.map(message=><View key={message.author+message.id} style={[local.question,message.author==='team'&&{borderLeftColor:c.primary,borderLeftWidth:3}]}><Text style={s.eyebrow}>{message.author==='team'?`EQUIPE • ${message.authorName||'SpeedZone'}`:history.name} • {date(message.createdAt)}</Text><Text selectable style={s.body}>{message.text}</Text></View>)}<Text style={s.small}>{history.status==='closed'?'CHAMADO RESOLVIDO':'CHAMADO ATIVO'}</Text></>:historyError?<Text style={s.error}>{historyError}</Text>:<ActivityIndicator color={c.primary}/>}</ScrollView></View></View></Modal>
  </SafeAreaView>;
}
const createLocal = (c: ThemeColors) => StyleSheet.create({customer:{backgroundColor:c.input,padding:12,flexDirection:'row',alignItems:'center',gap:12,borderRadius:5},initials:{width:42,height:42,backgroundColor:c.primarySoft,alignItems:'center',justifyContent:'center',borderRadius:21},blue:{color:c.primary,fontFamily:f.medium,fontSize:12},category:{color:c.muted,fontFamily:f.medium,fontSize:11},question:{backgroundColor:c.input,padding:14,borderRadius:12,gap:8},questionText:{fontFamily:f.regular,fontSize:15,lineHeight:23,color:c.text}});

const createLayout = (c: ThemeColors) => StyleSheet.create({
ticketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
status: { fontFamily: f.medium, fontSize: 11, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
detailLink: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border, paddingTop: 6 },
historyLink: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
empty: { padding: 28, gap: 14, alignItems: 'center', backgroundColor: c.panel, borderRadius: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, backgroundColor: c.deepest },
  logo: { display: 'none' },
  content: { padding: 18, gap: 12, width: '100%', maxWidth: 600, alignSelf: 'center', paddingBottom: 24 },
  card: { backgroundColor: c.panel, borderRadius: 20, padding: 18, gap: 12, borderWidth: 1, borderColor: c.surfaceBorder },
  hero: { backgroundColor: c.panel, borderRadius: 22, padding: 20, gap: 14, borderWidth: 1, borderColor: c.surfaceBorder },
  heroTitle: { fontFamily: f.bold, fontSize: 24, color: c.text, letterSpacing: -0.7 },
  metric: { flex: 1, minWidth: 0, padding: 12, gap: 8, backgroundColor: c.input, borderRadius: 14 },
  metricValue: { fontFamily: f.bold, fontSize: 29, color: c.text },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, backgroundColor: c.panel, borderRadius: 14 },
  searchInput: { flex: 1, minWidth: 0, minHeight: 54, color: c.text, fontSize: 14 },
  filterButton: { width: 54, height: 54, borderRadius: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: c.panel },
  chip: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: c.panel, borderRadius: 16 },
  chipText: { fontFamily: f.medium, fontSize: 12, color: c.muted },
  ticketTitle: { fontFamily: f.bold, fontSize: 18, lineHeight: 25, color: c.text },
  vehicleTag: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
});

