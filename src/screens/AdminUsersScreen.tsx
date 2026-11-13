import { AdminThemeToggle } from '../components/AdminThemeToggle';
import { AdminNavigation } from '../components/AdminNavigation';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { ThemeColors, fonts } from '../theme/tokens';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, useWindowDimensions, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductAction, createPs } from '../components/AdminProductUI';
import { HeaderAction, StoreIcon } from '../components/StoreHeader';

import { useAuth } from '../context/AuthContext';
import { ManagedUser, UserDraft, UserLog, UserRole, roleLabels } from '../data/users';
import { money } from '../data/products';
const empty:UserDraft={name:'',surname:'',email:'',phone:'',password:'',role:'customer',blocked:false,archived:false,reason:'',revision:1};
const permissions:Record<UserRole,string>={customer:'Acesso à loja, à própria conta, pedidos e chamados.',technician:'Acesso à loja e ao painel de suporte para responder chamados. Sem gestão de usuários, produtos ou vendas.',admin:'Acesso completo ao painel, incluindo usuários, permissões, produtos, vendas e suporte.'};
export default function AdminUsersScreen() {
  const { colors: c } = useTheme();
  const s = useThemedStyles(createPs);
  const ui = useThemedStyles(directoryStyles);
  const compact = useWindowDimensions().width < 360;
  const [alerts,setAlerts]=useState(false);

  const {user,listUsers,saveUser,userLogs}=useAuth();
  const [users,setUsers]=useState<ManagedUser[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState(''),[revision,setRevision]=useState(0);
  const [query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[sort,setSort]=useState<'recent'|'name'>('recent'),[page,setPage]=useState(1);
  const [selected,setSelected]=useState<ManagedUser|null>(null),[mode,setMode]=useState<'view'|'edit'|'new'|'logs'|null>(null),[draft,setDraft]=useState<UserDraft>(empty),[modalError,setModalError]=useState(''),[busy,setBusy]=useState(false),[logs,setLogs]=useState<UserLog[]>([]),[logLoading,setLogLoading]=useState(false);
  const lock=useRef(false),logRequest=useRef(0);
  useFocusEffect(useCallback(()=>{let alive=true;void revision;setLoading(true);listUsers().then(data=>{if(alive){setUsers(data);setError('');}}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[listUsers,revision]));
  const match=(u:ManagedUser,value:string)=>value==='all'?!u.archived:value==='vip'?u.role==='customer'&&u.vip&&!u.archived&&!u.blocked:value==='blocked'?u.blocked&&!u.archived:value==='archived'?u.archived:u.role===value&&!u.archived;
  const filtered=users.filter(u=>match(u,filter)&&`${u.name} ${u.surname} ${u.email} ${u.vehicle} ${u.phone}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):(b.createdAt||'').localeCompare(a.createdAt||''));
  const pages=Math.max(1,Math.ceil(filtered.length/10)),currentPage=Math.min(page,pages),visible=filtered.slice((currentPage-1)*10,currentPage*10);
  function open(value:ManagedUser|null,target:typeof mode){setSelected(value);setMode(target);setModalError('');setDraft(value?{...value}: {...empty});}
  function close(){if(busy)return;logRequest.current++;setMode(null);}
  async function showLogs(value:ManagedUser){open(value,'logs');setLogs([]);setLogLoading(true);const request=++logRequest.current;try{const data=await userLogs(value.id);if(request===logRequest.current)setLogs(data);}catch(e){if(request===logRequest.current)setModalError((e as Error).message);}finally{if(request===logRequest.current)setLogLoading(false);}}
  async function save(){if(lock.current)return;lock.current=true;setBusy(true);setModalError('');try{const result=await saveUser(mode==='new'?null:selected!.id,draft);setUsers(previous=>[result,...previous.filter(u=>u.id!==result.id)]);setNotice(mode==='new'?'Usuário cadastrado.':'Cadastro e permissões atualizados.');setMode(null);}catch(e){setModalError((e as Error).message);}finally{lock.current=false;setBusy(false);}}
  const own=selected?.id===user?.id;
  const active=users.filter(u=>!u.archived&&!u.blocked);
  const technicians=active.filter(u=>u.role==='technician').length;
  const stats=[
    {label:'PILOTOS',count:active.filter(u=>u.role==='customer').length,note:'cadastrados ativos',icon:'racing-helmet',filter:'customer'},
    {label:'PILOTOS VIP',count:active.filter(u=>u.vip&&u.role==='customer').length,note:'homologados',icon:'star-outline',filter:'vip'},
    {label:'MECÂNICOS',count:technicians,note:'no pit lane',icon:'tools',filter:'technician'},
    {label:'ADMINS',count:active.filter(u=>u.role==='admin').length,note:'nível master',icon:'shield-account-outline',filter:'admin'},
  ] as const;
  function selectFilter(key:string){setFilter(key);setPage(1);}
  function detail(icon:React.ComponentProps<typeof StoreIcon>['name'],label:string,value:string){
    return <View style={ui.row}><StoreIcon name={icon} size={14}/><Text style={[ui.caption,ui.flex]}>{label}</Text><Text style={ui.value}>{value}</Text></View>;
  }
  function renderUser({item:u}:{item:ManagedUser}){
    const admin=u.role==='admin', tech=u.role==='technician', vip=u.role==='customer'&&u.vip;
    const restricted=u.archived||u.blocked;
    const tone=restricted?c.error:admin?c.warning:c.primary;
    const status=u.archived?'DESATIVADO':u.blocked?'BLOQUEADO':admin?'MASTER':tech?'ATIVO':vip?'VIP ATIVO':'REGULAR';
    const editUser=()=>router.push({pathname:'/admin-user',params:{id:u.id}});
    return <View style={ui.card}>
      <View style={ui.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={'Ver perfil de '+u.name} onPress={()=>open(u,'view')} style={[ui.avatar,{backgroundColor:vip||tech?c.action:admin?c.warningSoft:c.elevated}]}>
          {u.photo?<Image source={{uri:u.photo}} style={ui.photo}/>:<Text style={[ui.initials,{color:vip||tech?c.onPrimary:admin?c.warning:c.text}]}>{u.name[0]}{u.surname[0]}</Text>}
        </Pressable>
        <View style={ui.flex}><Text style={ui.name}>{u.name} {u.surname}</Text><Text numberOfLines={2} style={ui.caption}>{tech?'Mecânico • Equipe Box':admin?'Admin operacional • SpeedZone HQ':u.email}</Text></View>
        <Text style={[ui.badge,{color:tone,backgroundColor:restricted?c.dangerSoft:admin?c.warningSoft:vip||tech?c.primarySoft:c.input}]}>{status}</Text>
      </View>
      <View style={ui.inset}>
        {admin?<>{detail('shield-check-outline','Acesso administrativo','Completo')}{detail('calendar-outline','Cadastro',u.createdAt?new Date(u.createdAt).toLocaleDateString('pt-BR'):'Sem registro')}</>:tech?<>{detail('wrench-outline','Atendimentos',u.replies+' chamados respondidos')}{detail('headset','Equipe','Suporte técnico')}</>:<>
          {detail('car-outline','Carro',u.vehicle||'Não informado')}{!!u.phone&&detail('phone-outline','Telefone',u.phone)}{detail('receipt-text-outline','Total gasto ('+u.orders+' pedidos)',money(u.spent/100))}
        </>}
        {restricted&&<Text style={s.error}>{u.reason}</Text>}
      </View>
      <View style={ui.actions}>
        <Pressable accessibilityRole="button" onPress={()=>void showLogs(u)} style={ui.secondary}><Text style={ui.actionText}>{admin?'Auditoria':tech?'Histórico técnico':'Histórico'}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={editUser} style={[ui.primary,ui.row]}><StoreIcon name={admin?'lock-outline':tech?'shield-account-outline':'tune'} color={c.onPrimary} size={14}/><Text style={ui.primaryText}>{admin?'Acessos':tech?'Permissões':'Gerenciar'}</Text></Pressable>
      </View>
    </View>;
  }
  return <SafeAreaView style={s.safe}>
    <View style={[ui.header,ui.row,compact&&{flexWrap:'wrap'}]}><View style={ui.icon}><StoreIcon name="shield-account-outline"/></View><View style={[ui.flex,compact&&{minWidth:130}]}><Text style={ui.kicker}>SPEEDZONE HQ</Text><Text style={ui.title}>Usuários &amp; Permissões</Text></View>
      <AdminThemeToggle inline /><HeaderAction icon="bell-outline" label="Avisos de contas" count={users.filter(user => user.blocked || user.archived).length} onPress={()=>setAlerts(!alerts)} />
      <Pressable accessibilityRole="button" onPress={()=>open(null,'new')} style={[ui.primary,ui.row]}><StoreIcon name="plus" color={c.onPrimary} size={16}/><Text style={ui.primaryText}>Convidar</Text></Pressable>
    </View>
    <FlatList data={visible} keyExtractor={u=>u.id} renderItem={renderUser} refreshing={loading} onRefresh={()=>setRevision(v=>v+1)} contentContainerStyle={ui.content}
      ListHeaderComponent={<View style={ui.stack}>
        {alerts&&<Text style={s.body}>{users.filter(u=>u.blocked&&!u.archived).length} contas bloqueadas • {users.filter(u=>u.archived).length} contas desativadas</Text>}
        <View style={[ui.card,ui.row,compact&&{flexWrap:'wrap'}]}><View style={ui.signal}><StoreIcon name="access-point"/></View><View style={[ui.flex,compact&&{minWidth:130}]}><Text style={ui.kicker}>PIT LANE CENTRAL</Text><Text style={ui.name}>Monitoramento Ativo</Text><Text style={ui.caption}>{technicians} {technicians===1?'mecânico cadastrado':'mecânicos cadastrados'} no Box</Text></View><Text style={ui.badge}>{loading?'Atualizando':error?'Sem conexão':'● Sincronizado'}</Text></View>
        <View style={ui.grid}>{stats.map(stat=><Pressable key={stat.filter} accessibilityRole="button" onPress={()=>selectFilter(stat.filter)} style={ui.stat}><View style={ui.row}><Text style={[ui.label,ui.flex]}>{stat.label}</Text><View style={ui.icon}><StoreIcon name={stat.icon} size={17}/></View></View><Text style={[ui.number,stat.filter==='vip'&&{color:c.primary}]}>{loading&&!users.length?'—':stat.count.toLocaleString('pt-BR')}</Text><Text style={ui.caption}>{stat.note}</Text></Pressable>)}</View>
        <View style={ui.row}><View style={[ui.search,ui.flex,ui.row]}><StoreIcon name="magnify" size={18} color={c.subtle}/><TextInput accessibilityLabel="Buscar usuário" placeholder="Buscar por piloto, carro, e-mail..." placeholderTextColor={c.subtle} value={query} onChangeText={v=>{setQuery(v);setPage(1);}} style={[ui.flex,ui.input]}/></View><Pressable accessibilityRole="button" accessibilityLabel={'Ordenar por '+(sort==='recent'?'nome':'mais recentes')} onPress={()=>{setSort(sort==='recent'?'name':'recent');setPage(1);}} style={ui.tool}><StoreIcon name="tune" size={17} color={sort==='name'?c.primary:c.text}/></Pressable></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ui.row}>{[['all','Todos os Usuários'],['vip','Pilotos VIP'],['technician','Equipe Box'],['admin','Admins'],['customer','Pilotos'],['blocked','Bloqueados'],['archived','Desativados']].map(([key,label])=><Pressable key={key} accessibilityRole="tab" accessibilityState={{selected:key===filter}} onPress={()=>selectFilter(key)} style={[ui.chip,filter===key&&ui.selected]}><Text style={[ui.actionText,filter===key&&ui.primaryText]}>{label}{key==='vip'?' ('+stats[1].count+')':''}</Text></Pressable>)}</ScrollView>
        {!!notice&&<Text accessibilityLiveRegion="polite" style={s.green}>{notice}</Text>}{!!error&&<Pressable onPress={()=>setRevision(v=>v+1)}><Text style={s.error}>{error} · Tentar novamente</Text></Pressable>}
      </View>}
      ListEmptyComponent={loading?<ActivityIndicator color={c.primary}/>:<Text style={s.body}>Nenhum usuário encontrado.</Text>}
      ListFooterComponent={<View style={ui.stack}>{pages>1&&<View style={s.between}><ProductAction label="Anterior" disabled={currentPage===1} onPress={()=>setPage(currentPage-1)}/><Text style={s.small}>{currentPage} / {pages}</Text><ProductAction label="Próxima" disabled={currentPage===pages} onPress={()=>setPage(currentPage+1)}/></View>}<View style={ui.footnote}><StoreIcon name="shield-check-outline" size={14}/><Text style={ui.caption}>SpeedZone HQ • Acesso administrativo</Text></View></View>}/>
    <AdminNavigation current="/admin-users" onReselect={()=>setRevision(v=>v+1)} />
    <Modal visible={mode!==null} transparent animationType="slide" onRequestClose={close}><KeyboardAvoidingView style={[s.overlay,{justifyContent:'flex-end',padding:12}]} behavior={Platform.OS==='ios'?'padding':undefined}><View style={[s.card,{maxHeight:'92%'}]}><View style={s.between}><Text style={[s.title,s.flex]}>{mode==='new'?'Novo Usuário':mode==='edit'?'Editar / Permissões':mode==='logs'?'Histórico de Gestão':'Perfil do Usuário'}</Text><ProductAction label="Fechar" disabled={busy} onPress={close}/></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:14}}>{mode==='new'||mode==='edit'?<>{(['name','surname','email','phone'] as const).map((key,i)=><View key={key}><Text style={s.label}>{['Nome','Sobrenome','E-mail','Telefone'][i]}</Text><TextInput accessibilityLabel={['Nome','Sobrenome','E-mail','Telefone'][i]} editable={!busy} value={draft[key]} onChangeText={v=>setDraft(p=>({...p,[key]:v}))} autoCapitalize={key==='email'?'none':'words'} keyboardType={key==='email'?'email-address':key==='phone'?'phone-pad':'default'} style={s.input}/></View>)}{mode==='new'&&<View><Text style={s.label}>Senha inicial (mínimo 8 caracteres)</Text><TextInput accessibilityLabel="Senha inicial" editable={!busy} secureTextEntry autoCapitalize="none" value={draft.password} onChangeText={v=>setDraft(p=>({...p,password:v}))} style={s.input}/><Text style={s.small}>Nenhum e-mail de convite será enviado automaticamente.</Text></View>}<Text style={s.section}>Permissões de acesso</Text>{(Object.keys(roleLabels) as UserRole[]).map(role=><ProductAction key={role} primary={draft.role===role} disabled={busy||own} label={roleLabels[role]} onPress={()=>setDraft(p=>({...p,role}))}/>)}<Text style={s.body}>{permissions[draft.role]}</Text>{mode==='edit'&&<><View style={s.between}><Text style={s.body}>Bloquear login</Text><Switch accessibilityLabel="Bloquear login" disabled={busy||own} value={draft.blocked} onValueChange={v=>setDraft(p=>({...p,blocked:v}))}/></View><View style={s.between}><Text style={s.body}>Desativar conta</Text><Switch accessibilityLabel="Desativar conta" disabled={busy||own} value={draft.archived} onValueChange={v=>setDraft(p=>({...p,archived:v}))}/></View>{(draft.blocked||draft.archived)&&<><Text style={s.label}>Motivo</Text><TextInput accessibilityLabel="Motivo do bloqueio" editable={!busy} multiline maxLength={500} value={draft.reason} onChangeText={v=>setDraft(p=>({...p,reason:v}))} style={[s.input,{minHeight:80}]}/></>}<Text style={s.small}>Bloqueio, desativação ou mudança de permissão encerram as sessões da conta. Pedidos e chamados permanecem preservados.</Text>{own&&<Text style={s.small}>Sua própria permissão e disponibilidade não podem ser alteradas aqui.</Text>}</>}<ProductAction primary disabled={busy} label={busy?'Salvando…':mode==='new'?'Criar Usuário':'Salvar Cadastro e Permissões'} onPress={()=>void save()}/></>:mode==='logs'?<>{logLoading?<ActivityIndicator color={c.primary}/>:logs.length?logs.map((log,i)=><View key={i} style={s.card}><Text style={s.body}>{log.action}</Text><Text style={s.small}>{new Date(log.createdAt).toLocaleString('pt-BR')}</Text></View>):<Text style={s.body}>Nenhuma alteração administrativa registrada.</Text>}</>:selected&&<><Text style={s.title}>{selected.name} {selected.surname}</Text><Text selectable style={s.body}>{selected.email}</Text><Text style={s.body}>{selected.phone||'Telefone não informado'}</Text><Text style={s.eyebrow}>{roleLabels[selected.role]}</Text><Text style={s.body}>{permissions[selected.role]}</Text><Text style={s.body}>{selected.vehicle||'Sem veículo ativo'}</Text><Text style={s.body}>{selected.address||'Sem endereço cadastrado'}</Text><Text style={s.body}>{selected.orders} pedidos entregues • {money(selected.spent/100)}</Text><ProductAction label="Ver Histórico de Gestão" onPress={()=>void showLogs(selected)}/><ProductAction primary label="Editar Cadastro / Acessos" onPress={()=>{setMode(null);router.push({pathname:'/admin-user',params:{id:selected.id}});}}/></>}{!!modalError&&<Text accessibilityLiveRegion="polite" style={s.error}>{modalError}</Text>}</ScrollView></View></KeyboardAvoidingView></Modal>
  </SafeAreaView>;
}

const directoryStyles=(c:ThemeColors)=>StyleSheet.create({
 flex:{flex:1,minWidth:0},row:{flexDirection:'row',alignItems:'center',gap:8},stack:{gap:16},
 header:{paddingHorizontal:16,paddingVertical:9,minHeight:62,backgroundColor:c.panel,borderBottomWidth:1,borderColor:c.surfaceBorder},
 content:{padding:16,paddingBottom:42,width:'100%',maxWidth:680,alignSelf:'center',gap:14},
 icon:{width:34,height:34,borderRadius:13,backgroundColor:c.primarySoft,alignItems:'center',justifyContent:'center'},
 signal:{width:40,height:50,borderRadius:20,backgroundColor:c.primarySoft,alignItems:'center',justifyContent:'center'},
 title:{color:c.text,fontFamily:fonts.bold,fontSize:18,lineHeight:22},kicker:{color:c.primary,fontFamily:fonts.bold,fontSize:10,letterSpacing:.8},
 card:{backgroundColor:c.panel,borderWidth:1,borderColor:c.surfaceBorder,borderRadius:23,padding:19,gap:15},
 grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:10},stat:{width:'48.7%',borderRadius:23,borderWidth:1,borderColor:c.surfaceBorder,backgroundColor:c.panel,padding:16,gap:4},
 number:{color:c.text,fontFamily:fonts.heavy,fontSize:26,marginTop:6},label:{color:c.subtle,fontFamily:fonts.bold,fontSize:10,letterSpacing:.6},caption:{color:c.subtle,fontFamily:fonts.regular,fontSize:12,lineHeight:17},
 name:{fontFamily:fonts.bold,color:c.text,fontSize:15,lineHeight:21},badge:{fontFamily:fonts.bold,fontSize:10,letterSpacing:.4,color:c.primary,backgroundColor:c.primarySoft,borderRadius:12,paddingVertical:6,paddingHorizontal:8},
 tool:{width:43,height:43,borderRadius:13,alignItems:'center',justifyContent:'center',backgroundColor:c.input},
 search:{backgroundColor:c.panel,borderWidth:1,borderColor:c.border,borderRadius:13,paddingHorizontal:12},input:{minHeight:43,color:c.text,fontSize:13},
 chip:{minHeight:35,justifyContent:'center',paddingHorizontal:13,borderWidth:1,borderColor:c.border,borderRadius:11,backgroundColor:c.panel},selected:{backgroundColor:c.action,borderColor:c.action},
 avatar:{height:48,width:48,borderRadius:16,alignItems:'center',justifyContent:'center',overflow:'hidden'},photo:{height:48,width:48},initials:{fontFamily:fonts.bold,fontSize:18},
 inset:{backgroundColor:c.input,borderRadius:16,padding:14,gap:9},value:{fontFamily:fonts.medium,color:c.text,fontSize:12,maxWidth:'55%',textAlign:'right'},
 actions:{flexDirection:'row',justifyContent:'flex-end',gap:8},primary:{backgroundColor:c.action,paddingHorizontal:12,minHeight:37,borderRadius:10,alignItems:'center',justifyContent:'center'},
 secondary:{backgroundColor:c.input,paddingHorizontal:14,minHeight:37,borderRadius:10,justifyContent:'center'},primaryText:{color:c.onPrimary,fontFamily:fonts.bold,fontSize:12},actionText:{color:c.text,fontFamily:fonts.medium,fontSize:12},
 footnote:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:12},nav:{flexDirection:'row',backgroundColor:c.panel,borderTopWidth:1,borderColor:c.surfaceBorder,paddingVertical:7},tab:{flex:1,minHeight:48,alignItems:'center',justifyContent:'center',gap:4}
});