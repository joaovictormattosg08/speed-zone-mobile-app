import { AdminThemeToggle } from '../components/AdminThemeToggle';
import { AdminNavigation } from '../components/AdminNavigation';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../context/AuthContext';
import { Promotion } from '../data/coupons';
import { money } from '../data/products';
import { HeaderAction, StoreIcon } from '../components/StoreHeader';
import { PilotAvatar } from '../components/PilotAvatar';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { fonts, ThemeColors } from '../theme/tokens';

const filters = { all:'Todos', active:'Ativos', scheduled:'Agendados', expired:'Expirados', paused:'Pausados', exhausted:'Esgotados', archived:'Arquivados' };
type Filter = keyof typeof filters;
const states = { active:'Ativo', scheduled:'Agendado', expired:'Expirado', paused:'Pausado', exhausted:'Esgotado', archived:'Arquivado' };
const matches = (p:Promotion, filter:Filter) => filter==='all' ? !p.archived : p.state===filter;
function daysLeft(p:Promotion) {
  return p.expires ? Math.ceil((Date.parse(p.expires+'T23:59:59.999-03:00')-Date.now())/86400000) : Infinity;
}
function edit(p?:Promotion, duplicate=false) {
  router.push({pathname:'/admin-coupon',params:p?{code:p.code,...(duplicate?{duplicate:'1'}:{})}:{}});
}

export default function AdminCouponsScreen() {
  const { colors:c }=useTheme();
  const s=useThemedStyles(styles);
  const { couponDashboard,saveCoupon }=useAuth();
  const [coupons,setCoupons]=useState<Promotion[]>([]);
  const [metrics,setMetrics]=useState<Awaited<ReturnType<typeof couponDashboard>>['metrics']>();
  const [query,setQuery]=useState(''), [filter,setFilter]=useState<Filter>('all');
  const [sorted,setSorted]=useState(false), [alerts,setAlerts]=useState(false);
  const [loading,setLoading]=useState(true), [retry,setRetry]=useState(0);
  const [error,setError]=useState(''), [notice,setNotice]=useState('');
  const lock=useRef(false);
  const [busy,setBusy]=useState(false);
  useFocusEffect(useCallback(()=>{
    void retry;
    let alive=true;
    setLoading(true);
    couponDashboard().then(data=>{if(alive){setCoupons(data.coupons);setMetrics(data.metrics);setError('');}})
      .catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});
    return ()=>{alive=false;};
  },[couponDashboard,retry]));
  const visible=coupons.filter(p=>matches(p,filter)&&(p.code+' '+p.label).toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a,b)=>sorted?b.used-a.used:Number(b.state==='active')-Number(a.state==='active')||a.code.localeCompare(b.code));
  const expiring=coupons.filter(p=>p.state==='active'&&daysLeft(p)<=7);
  async function toggle(p:Promotion) {
    if(lock.current)return;
    lock.current=true;setBusy(true);
    try { const saved=await saveCoupon(p.code,{...p,paused:!p.paused});setCoupons(all=>all.map(item=>item.code===saved.code?saved:item)); }
    catch(e){setError((e as Error).message);}finally{lock.current=false;setBusy(false);}
  }
  async function copy(code:string) {
    try {setNotice(await Clipboard.setStringAsync(code)?code+' copiado.':'Não foi possível copiar.');}
    catch {setNotice('Não foi possível copiar neste dispositivo.');}
  }
  function renderCoupon({item:p}:{item:Promotion}) {
    const disabled=['expired','exhausted','archived'].includes(p.state);
    const urgent=p.state==='active'&&daysLeft(p)<=2;
    const tone=disabled?c.subtle:urgent?c.warning:c.primary;
    const benefit=p.kind==='fixed'?money(p.value/100)+' de desconto':p.kind==='shipping'?(p.value===100?'Frete grátis':p.value+'% OFF no frete'):p.value+'% OFF';
    const badge=urgent?'Expira em '+daysLeft(p)+ ' dias':p.ownerEmail&&p.state==='active'?'Exclusivo':states[p.state]+(!p.limit&&p.state==='active'?' • Ilimitado':'');
    const percent=p.limit?Math.min(100,Math.round(p.used/p.limit*100)):0;
    const progress=p.limit>0&&p.kind==='percent'&&!disabled;
    return <View style={[s.card,disabled&&s.inactive]}>
      <View style={s.row}><View style={[s.tags,s.flex]}><Text style={[s.code,disabled&&s.strike,urgent&&{color:tone}]}>{p.code}</Text><Text style={[s.badge,{color:tone,backgroundColor:disabled?c.elevated:urgent?c.warningSoft:c.primarySoft}]}>{badge.toUpperCase()}</Text></View>
        <Pressable accessibilityRole="switch" accessibilityLabel={'Ativar '+p.code}
          accessibilityState={{checked:!p.paused&&!disabled,disabled:busy||disabled}}
          disabled={busy||disabled} hitSlop={8} onPress={()=>void toggle(p)}
          style={[s.switchTrack,!p.paused&&!disabled&&s.switchOn]}>
          <View style={[s.thumb,disabled&&{backgroundColor:c.subtle}]}/>
        </Pressable></View>
      <Text style={s.body}>{benefit} · {p.label}</Text>
      <View style={s.usage}><View style={s.row}>{!progress&&<StoreIcon name={p.kind==='shipping'?'truck-outline':disabled?'history':'check-decagram-outline'} size={16} color={tone}/>}
        <Text style={[s.small,s.flex]}>{progress?'Progresso de ativação':disabled?'Total atingido':p.kind==='shipping'?'Envios com desconto':'Uso acumulado na temporada'}</Text>
        <Text style={s.strong}>{p.used}{p.limit?' / '+p.limit:''} resgates{progress?' ('+percent+'%)':''}</Text></View>
        {progress&&<View style={s.track}><View style={{height:7,width:`${percent}%`,backgroundColor:c.action,borderRadius:4}}/></View>}</View>
      <View style={[s.row,s.divider]}><StoreIcon name={p.expires?'calendar-outline':'infinity'} size={15} color={c.subtle}/><Text style={[s.small,s.flex]}>{p.expires?(p.state==='expired'?'Encerrado em ':'Válido até ')+p.expires.split('-').reverse().join('/'):'Sem data de expiração'}</Text>
        {!disabled&&<Pressable accessibilityRole="button" accessibilityLabel={'Copiar código '+p.code} style={s.tool} onPress={()=>void copy(p.code)}><StoreIcon name="content-copy" size={16} color={c.text}/></Pressable>}
        <Pressable accessibilityRole="button" accessibilityHint="Mantenha pressionado para duplicar o cupom" onLongPress={()=>edit(p,true)} onPress={()=>edit(p)} style={[s.tool,s.row]}><StoreIcon name={disabled?'restore':'pencil-outline'} size={15} color={c.text}/><Text style={s.strong}>{disabled?'Reativar':'Editar'}</Text></Pressable></View>
    </View>;
  }
  return <SafeAreaView style={s.safe}>
    <View style={[s.header,s.row]}><View style={s.mark}><StoreIcon name="ticket-percent-outline"/></View><View style={s.flex}><Text style={s.kicker}>SPEEDZONE NEOBANK</Text><Text style={s.code}>Gestão de Cupons</Text></View>
      <AdminThemeToggle inline /><HeaderAction icon="bell-outline" label="Avisos de vencimento" count={expiring.length} onPress={()=>setAlerts(!alerts)} />
      <Pressable accessibilityRole="button" accessibilityLabel="Minha conta" onPress={()=>router.navigate('/(main)/account')}><PilotAvatar size={36}/></Pressable></View>
    <FlatList data={visible} keyExtractor={p=>p.code} renderItem={renderCoupon} contentContainerStyle={s.content} refreshing={loading} onRefresh={()=>setRetry(v=>v+1)}
      ListHeaderComponent={<View style={s.stack}>
        {alerts&&<Text style={s.body}>{expiring.length?'Vencem nos próximos 7 dias: '+expiring.map(p=>p.code).join(', '):'Nenhum cupom vence nos próximos 7 dias.'}</Text>}
        <View style={s.row}><View style={s.flex}><Text style={s.kicker}>CAMPANHAS COMERCIAIS</Text><Text style={s.title}>Cupons &amp;{ '\n' }Descontos</Text></View><Pressable accessibilityRole="button" style={[s.create,s.row]} onPress={()=>edit()}><StoreIcon name="plus" color={c.onPrimary} size={19}/><Text style={s.createText}>{'Novo\nCupom'}</Text></Pressable></View>
        <View style={s.card}><View style={s.row}><View style={s.flex}><View style={s.row}><View style={s.statusDot}/><Text style={s.kicker}>ECONOMIA TOTAL CONCEDIDA</Text></View><View style={s.tags}><Text style={s.total}>{metrics?money(metrics.savings/100):'—'}</Text>{metrics?.growth!=null&&<View style={s.delta}><StoreIcon name={metrics.growth>=0?'trending-up':'trending-down'} size={13}/><Text style={s.growth}>{metrics.growth>0?'+':''}{metrics.growth.toLocaleString('pt-BR',{maximumFractionDigits:1})}%</Text></View>}</View><Text style={s.small}>Mês vigente • Descontos diretos aplicados no checkout</Text></View><View style={s.mark}><StoreIcon name="piggy-bank-outline"/></View></View>
          <View style={[s.row,s.tiles]}>{([{label:'Utilizados',value:metrics?metrics.used+' resgates':'—',icon:'ticket-percent-outline'},{label:'Ticket Médio',value:metrics?money(metrics.average/100):'—',icon:'cash-multiple'}] as const).map(stat=><View key={stat.label} style={[s.tile,s.row]}><View style={s.statIcon}><StoreIcon name={stat.icon} size={18}/></View><View style={s.flex}><Text style={s.small}>{stat.label}</Text><Text style={s.statValue}>{stat.value}</Text></View></View>)}</View></View>
        <View style={[s.search,s.row]}><StoreIcon name="magnify" size={20} color={c.subtle}/><TextInput style={[s.input,s.flex]} accessibilityLabel="Buscar cupom" placeholder="Buscar cupom por código ou regra..." placeholderTextColor={c.subtle} value={query} onChangeText={setQuery}/><Pressable accessibilityRole="button" accessibilityLabel="Ordenar pelos mais usados" accessibilityState={{selected:sorted}} onPress={()=>setSorted(!sorted)} style={s.tool}><StoreIcon name="tune" size={18} color={sorted?c.primary:c.muted}/></Pressable></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>{(Object.keys(filters) as Filter[]).map(key=><Pressable accessibilityRole="button" accessibilityState={{selected:key===filter}} key={key} onPress={()=>setFilter(key)} style={[s.chip,key===filter&&s.selected]}><Text style={[s.strong,key===filter&&{color:c.onPrimary}]}>{filters[key]}{key==='all'?'':' ('+coupons.filter(p=>matches(p,key)).length+')'}</Text></Pressable>)}</ScrollView>
        {!!notice&&<Text accessibilityLiveRegion="polite" style={s.body}>{notice}</Text>}{!!error&&<Pressable onPress={()=>setRetry(v=>v+1)}><Text style={{color:c.error}}>{error} · Tentar novamente</Text></Pressable>}{loading&&<ActivityIndicator color={c.primary}/>}
      </View>} ListEmptyComponent={!loading?<Text style={s.body}>Nenhum cupom encontrado para estes filtros.</Text>:null}/>
    <AdminNavigation />
  </SafeAreaView>;
}

const styles=(c:ThemeColors)=>StyleSheet.create({
 safe:{flex:1,backgroundColor:c.background},flex:{flex:1,minWidth:0},row:{flexDirection:'row',alignItems:'center',gap:8},tags:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:6},
 header:{minHeight:64,paddingHorizontal:16,paddingVertical:12,backgroundColor:c.panel,borderBottomWidth:1,borderColor:c.surfaceBorder},
 content:{width:'100%',maxWidth:680,alignSelf:'center',padding:16,gap:14,paddingBottom:48},stack:{gap:16},
 switchTrack:{width:44,height:24,padding:2,borderRadius:14,backgroundColor:c.border,justifyContent:'center'},switchOn:{backgroundColor:c.action,alignItems:'flex-end'},thumb:{width:20,height:20,borderRadius:10,backgroundColor:c.light},mark:{width:38,height:38,borderRadius:13,alignItems:'center',justifyContent:'center',backgroundColor:c.primarySoft},
 tool:{paddingHorizontal:10,minHeight:36,alignItems:'center',justifyContent:'center',borderRadius:10,backgroundColor:c.input},
 dot:{position:'absolute',right:7,top:5,width:7,height:7,borderRadius:4,backgroundColor:c.primary},
 kicker:{color:c.muted,fontFamily:fonts.medium,fontSize:11,letterSpacing:.6},title:{color:c.text,fontFamily:fonts.heavy,fontSize:26,lineHeight:32},
 total:{color:c.text,fontFamily:fonts.heavy,fontSize:31,letterSpacing:-1},growth:{color:c.primary,backgroundColor:c.primarySoft,borderRadius:8,paddingHorizontal:6},
 code:{fontFamily:fonts.bold,fontSize:16,letterSpacing:.4,color:c.text},body:{fontFamily:fonts.regular,fontSize:13,color:c.muted},small:{fontFamily:fonts.regular,fontSize:12,color:c.subtle},strong:{fontFamily:fonts.medium,fontSize:12,color:c.text},
 create:{width:126,justifyContent:'center',minHeight:52,paddingHorizontal:16,borderRadius:13,backgroundColor:c.action},createText:{textAlign:'center',fontFamily:fonts.bold,color:c.onPrimary,fontSize:14},
 card:{boxShadow:[{offsetX:0,offsetY:2,blurRadius:12,color:c.text+'09'}],backgroundColor:c.panel,borderRadius:24,padding:20,gap:8,borderWidth:1,borderColor:c.surfaceBorder},inactive:{backgroundColor:c.background,opacity:.72},strike:{color:c.subtle,textDecorationLine:'line-through'},
 badge:{fontFamily:fonts.bold,fontSize:10,paddingHorizontal:8,paddingVertical:5,borderRadius:16},tiles:{marginTop:12},tile:{flex:1,minWidth:0,borderWidth:1,borderColor:c.surfaceBorder,minHeight:90,padding:12,backgroundColor:c.input,borderRadius:16},
 statusDot:{width:8,height:8,borderRadius:4,backgroundColor:c.action},statIcon:{width:34,height:40,alignItems:'center',justifyContent:'center',backgroundColor:c.panel,borderRadius:10},statValue:{fontFamily:fonts.bold,fontSize:14,lineHeight:20,color:c.text},delta:{flexDirection:'row',alignItems:'center',paddingHorizontal:5,backgroundColor:c.primarySoft,borderRadius:12},usage:{borderWidth:1,borderColor:c.surfaceBorder,marginVertical:8,padding:12,borderRadius:15,gap:8,backgroundColor:c.input},track:{height:7,backgroundColor:c.elevated,borderRadius:4,overflow:'hidden'},divider:{paddingTop:6,borderTopWidth:1,borderColor:c.surfaceBorder},
 search:{borderWidth:1,borderColor:c.surfaceBorder,paddingHorizontal:12,minHeight:48,backgroundColor:c.panel,borderRadius:16},input:{color:c.text,fontSize:14,minHeight:44},chip:{paddingHorizontal:14,minHeight:36,borderRadius:12,justifyContent:'center',backgroundColor:c.panel},selected:{backgroundColor:c.action},
 nav:{backgroundColor:c.panel,borderTopWidth:1,borderColor:c.surfaceBorder,paddingVertical:7},tab:{flex:1,minHeight:48,gap:5,alignItems:'center',justifyContent:'center'}
});