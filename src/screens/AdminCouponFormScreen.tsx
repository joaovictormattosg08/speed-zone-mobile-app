import { AdminThemeToggle } from '../components/AdminThemeToggle';
import { AdminNavigation } from '../components/AdminNavigation';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { fonts, ThemeColors } from '../theme/tokens';
import { Disclosure } from '../components/Disclosure';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { Promotion, PromotionDraft } from '../data/coupons';
import { categories, money } from '../data/products';
import { ProductAction, createPs } from '../components/AdminProductUI';
import { PilotAvatar } from '../components/PilotAvatar';
import { StoreIcon } from '../components/StoreHeader';

import * as Clipboard from 'expo-clipboard';
import { ConfirmAction } from '../components/AdminDetailUI';

const blank:PromotionDraft={code:'',label:'',kind:'percent',value:15,minimum:0,maximum:0,categories:[],limit:150,expires:'',paused:false,archived:false,ownerEmail:'',revision:0};
const numeric=(value:string)=>/^\d+(?:[.,]\d{1,2})?$/.test(value.trim())?Number(value.replace(',','.')):NaN;
function Field({label,value,onChange,numeric:decimal=false,disabled=false,placeholder}: {label:string;value:string;onChange:(v:string)=>void;numeric?:boolean;disabled?:boolean;placeholder?:string}){
  const { colors: c } = useTheme();
  const s = useThemedStyles(createPs);

 return <View><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} editable={!disabled} placeholder={placeholder} placeholderTextColor={c.subtle} keyboardType={decimal?'decimal-pad':'default'} autoCapitalize="none" style={s.input}/></View>;
}
export default function AdminCouponFormScreen(){
  const { colors: c } = useTheme();
  const s = useThemedStyles(createPs);

 const {code,duplicate}=useLocalSearchParams<{code?:string;duplicate?:string}>();
 const {listAdminCoupons,saveCoupon}=useAuth();const {products:catalog}=useCatalog();
 const [draft,setDraft]=useState<PromotionDraft>(blank),[known,setKnown]=useState<Promotion[]>([]),[loading,setLoading]=useState(true),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0);
 const [values,setValues]=useState({value:'15',minimum:'0',maximum:'0',limit:'150',sample:'1500'});
 const ui=useThemedStyles(formStyles);
 const [cap,setCap]=useState(false),[quota,setQuota]=useState(true),[info,setInfo]=useState(false);
 const lock=useRef(false),scroll=useRef<ScrollView>(null);
 const [confirmArchive,setConfirmArchive]=useState(false),[notice,setNotice]=useState('');
 const original=code&&!duplicate?known.find(p=>p.code===code):undefined;
 async function archive(){
  if(!original||lock.current)return;lock.current=true;setBusy(true);setError('');
  try{await saveCoupon(original.code,{...original,archived:true,paused:true});router.replace('/admin-coupons');}
  catch(e){setError((e as Error).message);scroll.current?.scrollTo({y:0,animated:true});}
  finally{lock.current=false;setBusy(false);}
 }
 useEffect(()=>{let alive=true;listAdminCoupons().then(all=>{if(!alive)return;setKnown(all);if(code){const p=all.find(item=>item.code===code);if(!p)throw new Error('Cupom não encontrado.');setCap(!!p.maximum);setQuota(p.limit>0);setDraft({...p,categories:p.categories||[],maximum:p.maximum||0,...(duplicate?{code:p.code.slice(0,32)+'-COPIA',paused:true,archived:false,revision:0}:{})});setValues({value:String(p.kind==='fixed'?p.value/100:p.value),minimum:String(p.minimum/100),maximum:String((p.maximum||0)/100),limit:String(p.limit),sample:'1500'});}setError('');setLoaded(true);}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[code,duplicate,listAdminCoupons,retry]);
 const change=<K extends keyof PromotionDraft>(key:K,value:PromotionDraft[K])=>setDraft(p=>({...p,[key]:value}));
 const taken=known.some(p=>p.code===draft.code&&(duplicate||p.code!==code));
 const validCode=/^[A-Z0-9][A-Z0-9-]{2,39}$/.test(draft.code)&&!draft.code.startsWith('SP-');
 const options=[...new Set([...categories.map(([name])=>name),...catalog.map(p=>p.category),...(draft.categories||[])])];
 const amount=numeric(values.sample)*100,discountValue=numeric(values.value),maximum=numeric(values.maximum)*100;
 const simulated=Math.max(0,Math.min(amount,(cap&&maximum)||Infinity,draft.kind==='fixed'?discountValue*100:amount*discountValue/100));
 async function save(paused:boolean){if(lock.current)return;setError('');lock.current=true;setBusy(true);try{
  if(!validCode||taken)throw new Error('Informe um código válido e disponível.');
  if(['value','minimum',...(cap?['maximum']:[]),...(quota?['limit']:[])].some(key=>!Number.isFinite(numeric(values[key as keyof typeof values]))))throw new Error('Informe números válidos, sem separador de milhar.');
  if(cap&&maximum<=0)throw new Error('Informe um teto maior que zero ou desligue o teto de desconto.');
  if(quota&&numeric(values.limit)<=0)throw new Error('Informe uma cota maior que zero ou desligue o limite de usos.');
  if(draft.kind!=='fixed'&&!Number.isInteger(discountValue))throw new Error('O percentual deve ser inteiro.');
  const payload={...draft,paused,value:Math.round(discountValue*(draft.kind==='fixed'?100:1)),minimum:Math.round(numeric(values.minimum)*100),maximum:cap?Math.round(maximum):0,limit:quota?numeric(values.limit):0};
  await saveCoupon(code&&!duplicate?code:null,payload);router.replace('/admin-coupons');
 }catch(e){setError((e as Error).message);scroll.current?.scrollTo({y:0,animated:true});}finally{lock.current=false;setBusy(false);}}
 const audiences={all:'Todos os Pilotos',vip:'Pilotos VIP',first:'Primeira Compra',technician:'Mecânicos Credenciados'};
 const benefit=draft.kind==='fixed'?money(discountValue||0)+' OFF':draft.kind==='shipping'&&discountValue===100?'Frete grátis':(discountValue||0)+'% OFF'+(draft.kind==='shipping'?' no frete':'');
 const [today]=useState(()=>new Date(Date.now()-3*3600000).toISOString().slice(0,10));
 const scheduled=!!draft.starts&&draft.starts>today;
 const disabled=busy||!loaded||loading;
 function shortcut(days:number|null){
   const date=new Date((draft.starts&&/^d{4}-d{2}-d{2}$/.test(draft.starts)?draft.starts:today)+'T12:00:00Z');
   if(!Number.isFinite(date.getTime()))return;
   if(days===null)date.setUTCMonth(11,31);else date.setUTCDate(date.getUTCDate()+days);
   change('expires',date.toISOString().slice(0,10));
 }
 function heading(icon:React.ComponentProps<typeof StoreIcon>['name'],title:string,detail:string){
   return <View style={ui.row}><View style={ui.icon}><StoreIcon name={icon} size={19}/></View><View style={s.flex}><Text style={ui.heading}>{title}</Text><Text style={s.small}>{detail}</Text></View></View>;
 }
 function chip(label:string,selected:boolean,onPress:()=>void){
   return <Pressable key={label} accessibilityRole="button" accessibilityState={{selected}} disabled={busy} onPress={onPress} style={[ui.chip,selected&&ui.selected]}><Text style={[ui.chipText,selected&&{color:c.onPrimary}]}>{label}</Text></Pressable>;
 }
 function toggle(title:string,detail:string,value:boolean,onChange:(v:boolean)=>void,readonly=false){
   return <View style={ui.row}><View style={s.flex}><Text style={ui.subheading}>{title}</Text><Text style={s.small}>{detail}</Text></View><Switch accessibilityLabel={title} value={value} disabled={busy||readonly} onValueChange={onChange} trackColor={{true:c.action,false:c.border}} thumbColor={value?c.light:c.subtle}/></View>;
 }
 return <SafeAreaView style={s.safe}><AdminThemeToggle/>
  <View style={[ui.header,ui.row]}><Pressable accessibilityRole="button" accessibilityLabel="Voltar para cupons" disabled={busy} onPress={()=>router.replace('/admin-coupons')} style={ui.hit}><StoreIcon name="arrow-left" color={c.text}/></Pressable>
    <View style={s.flex}><Text style={s.eyebrow}>SPEEDZONE MARKETING / ADMIN</Text><Text style={ui.heading}>{original?'Editar Cupom de Desconto':'Novo Cupom de Desconto'}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Informações sobre publicação" onPress={()=>setInfo(!info)} style={ui.hit}><StoreIcon name="information-outline" color={c.text}/></Pressable><PilotAvatar/></View>
  <KeyboardAvoidingView style={s.flex} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}>
   {info&&<Text style={s.body}>Ative o cupom para disponibilizá-lo durante o período escolhido ou salve um rascunho para editar depois.</Text>}
   {!!error&&<View><Text style={s.error} accessibilityRole="alert">{error}</Text>{!loaded&&!loading&&<ProductAction label="Tentar novamente" onPress={()=>{setLoading(true);setRetry(v=>v+1);}}/>}</View>}
   {loading?<ActivityIndicator color={c.primary}/>:loaded&&<>
    <View style={ui.card}><View style={ui.row}><View style={[ui.tag,s.flex]}><Text style={s.eyebrow}>PRÉ-VISUALIZAÇÃO EM TEMPO REAL</Text></View><Text style={ui.status}>{draft.paused?'Rascunho':scheduled?'Agendado':'● Ativo após publicação'}</Text></View>
     <View style={ui.ticket}><View style={ui.row}><View style={s.flex}><Text style={s.eyebrow}>{draft.label.toUpperCase()||'CUPOM SPEEDZONE'}</Text><Text style={ui.headline}>{benefit}{draft.categories?.length?' em '+draft.categories.join(', '):''}</Text></View><View style={ui.icon}><StoreIcon name="ticket-percent-outline"/></View></View>
      {!!draft.description&&<Text style={s.body}>{draft.description}</Text>}
      <View style={[ui.inset,ui.row]}><StoreIcon name="check-decagram-outline" size={19}/><Text style={[ui.code,s.flex]}>{draft.code||'SEU CUPOM'}</Text><Pressable accessibilityRole="button" disabled={!draft.code} onPress={async()=>{try{setNotice(await Clipboard.setStringAsync(draft.code)?'Código copiado.':'Falha ao copiar.');}catch{setNotice('Falha ao copiar.');}}} style={ui.tool}><Text style={ui.chipText}>Copiar</Text></Pressable></View>
      <View style={ui.wrap}>{['Mín. '+money(numeric(values.minimum)||0),audiences[draft.audience??'all'],draft.expires?'Até '+draft.expires.split('-').reverse().join('/'):'Sem vencimento'].map(v=><Text key={v} style={ui.meta}>{v}</Text>)}</View>
      {!!notice&&<Text accessibilityLiveRegion="polite" style={s.small}>{notice}</Text>}
     </View></View>
    <View style={ui.card}>{heading('tag-outline','Identificação do Cupom','Parâmetros essenciais e identificador único')}
      <View><Text style={s.label}>Código Promocional</Text><View style={ui.row}><TextInput accessibilityLabel="Código promocional" editable={!busy&&!original} maxLength={40} autoCapitalize="characters" value={draft.code} placeholder="Ex.: STAGE3BOOST" placeholderTextColor={c.subtle} onChangeText={v=>change('code',v.toUpperCase().replace(/[^A-Z0-9-]/g,''))} style={[s.input,s.flex]}/>{!original&&<Pressable accessibilityRole="button" onPress={()=>change('code','SZ'+Date.now().toString(36).toUpperCase())} style={ui.tool}><Text style={s.eyebrow}>⚄ Gerar</Text></Pressable>}</View><Text style={taken?s.error:s.small}>{taken?'Este código já existe.':'Use de 3 a 40 letras maiúsculas, números ou hífens.'}</Text></View>
      <Field label="Nome Interno da Campanha" value={draft.label} onChange={v=>change('label',v)} disabled={busy} placeholder="Ex.: Track Day"/>
      <View><Text style={s.label}>Descrição Exibida no Checkout</Text><TextInput accessibilityLabel="Descrição exibida no checkout" maxLength={500} multiline editable={!busy} value={draft.description??''} onChangeText={v=>change('description',v)} style={[s.input,{minHeight:72,textAlignVertical:'top'}]}/></View>
    </View>
    <View style={ui.card}><View style={ui.row}><View style={s.flex}>{heading('percent','Regra de Desconto','Tipo de abatimento a ser aplicado')}</View><Text style={ui.status}>OBRIGATÓRIO</Text></View>
      <View style={ui.segments}>{([['percent','Porcentagem','percent'],['fixed','Valor Fixo','currency-usd'],['shipping','Frete Free','truck-outline']] as const).map(([kind,label,icon])=><Pressable key={kind} accessibilityRole="tab" accessibilityState={{selected:draft.kind===kind}} onPress={()=>{change('kind',kind);if(kind==='shipping')setValues(p=>({...p,value:'100'}));}} style={[ui.segment,draft.kind===kind&&ui.segmentOn]}><StoreIcon name={icon} size={18} color={kind===draft.kind?c.primary:c.muted}/><Text style={ui.chipText}>{label}</Text></Pressable>)}</View>
      <View style={ui.inset}><View style={s.between}><Text style={ui.subheading}>Valor do Benefício</Text><Text style={s.eyebrow}>{draft.kind==='fixed'?'DEDUÇÃO FIXA':'DEDUÇÃO PERCENTUAL'}</Text></View><View style={ui.row}><TextInput accessibilityLabel="Valor do benefício" keyboardType="decimal-pad" value={values.value} onChangeText={value=>setValues(p=>({...p,value}))} style={[ui.amount,s.flex]}/><Text style={s.price}>{draft.kind==='fixed'?'R$':'%'}</Text></View>
       <View style={ui.wrap}>{(draft.kind==='shipping'?[25,50,75,100]:draft.kind==='fixed'?[10,25,50,100]:[5,10,15,20,25]).map(v=>chip(v+(draft.kind==='fixed'?' R$':'%'),discountValue===v,()=>setValues(p=>({...p,value:String(v)}))))}</View></View>
      <View style={ui.ticket}>{toggle('Definir teto máximo de desconto','Limita a economia por pedido.',cap,setCap)}{cap&&<Field label="Teto (R$)" numeric value={values.maximum} onChange={maximum=>setValues(p=>({...p,maximum}))}/>}</View>
    </View>
    <View style={ui.card}>{heading('tune','Condições de Uso','Elegibilidade e restrições de público')}
      <Field label="Valor Mínimo do Pedido (R$)" numeric value={values.minimum} onChange={minimum=>setValues(p=>({...p,minimum}))}/>
      <View style={s.between}><Text style={ui.subheading}>Categorias Homologadas</Text><Text style={s.eyebrow}>{draft.categories?.length||0} selecionadas</Text></View>
      <View style={ui.wrap}>{options.map(name=>{const active=!!draft.categories?.includes(name);return chip((active?'✓ ':'+ ')+name,active,()=>change('categories',active?draft.categories!.filter(v=>v!==name):[...(draft.categories||[]),name]));})}</View>
      <Text style={ui.subheading}>Público-Alvo / Nível do Piloto</Text><View style={ui.wrap}>{(Object.keys(audiences) as (keyof typeof audiences)[]).map(key=>chip(audiences[key],(draft.audience??'all')===key,()=>change('audience',key)))}</View>
      <View style={ui.ticket}>{toggle('Limitar quantidade total de usos','Cota global para a campanha.',quota,setQuota)}{quota&&<Field label="Resgates globais" numeric value={values.limit} onChange={limit=>setValues(p=>({...p,limit}))}/>}</View>
      <View style={ui.ticket}>{toggle('Limite de 1 uso por conta','Cada piloto pode resgatar o cupom uma vez.',true,()=>{},true)}</View>
    </View>
    <View style={ui.card}>{heading('calendar-clock','Período da Promoção','Janela de ativação no checkout')}
      <View style={ui.row}><View style={s.flex}><Field label="Data de Início" value={draft.starts??''} onChange={v=>change('starts',v)} placeholder="AAAA-MM-DD"/></View><View style={s.flex}><Field label="Data de Expiração" value={draft.expires} onChange={v=>change('expires',v)} placeholder="AAAA-MM-DD"/></View></View>
      <View style={ui.wrap}>{[7,15,30,null].map(n=>chip(n?'+'+n+' dias':'Fim do ano',false,()=>shortcut(n)))}</View>
      <View style={ui.ticket}>{toggle('Ativar cupom após salvar',scheduled?'Ativação na data de início.':'Disponível imediatamente no checkout.',!draft.paused,v=>change('paused',!v))}</View>
      {draft.archived&&<ProductAction label="Restaurar cupom arquivado" onPress={()=>change('archived',false)}/>}
    </View>
    <ProductAction primary disabled={disabled} label={busy?'Salvando…':draft.paused?'Salvar alterações':scheduled?'Salvar e Agendar Cupom':'Salvar e Ativar Cupom'} onPress={()=>void save(draft.paused)}/>
    <ProductAction label="Salvar como Rascunho" disabled={disabled} onPress={()=>void save(true)}/>
    <Disclosure title="Outras opções"><Field label="Conta exclusiva (e-mail opcional)" value={draft.ownerEmail} onChange={v=>change('ownerEmail',v)}/><Field label="Valor para simulação (R$)" numeric value={values.sample} onChange={sample=>setValues(p=>({...p,sample}))}/><Text style={s.body}>Desconto estimado: {money(Number.isFinite(simulated)?simulated/100:0)}</Text>{original&&<Text style={s.body}>{original.used} resgates • {money(original.savings/100)} concedidos</Text>}
      {original&&!original.archived&&(confirmArchive?<ConfirmAction title="Arquivar este cupom?" description={original.code} busy={busy} onConfirm={()=>void archive()} onCancel={()=>setConfirmArchive(false)}/>:<ProductAction label="Arquivar cupom" disabled={busy} onPress={()=>setConfirmArchive(true)}/>)}</Disclosure>
   </>}
  </ScrollView></KeyboardAvoidingView><AdminNavigation disabled={busy}/></SafeAreaView>;
}
const formStyles=(c:ThemeColors)=>StyleSheet.create({
 content:{padding:16,paddingBottom:32,width:'100%',maxWidth:680,alignSelf:'center',gap:15},row:{flexDirection:'row',alignItems:'center',gap:8},
 header:{paddingHorizontal:10,paddingVertical:9,backgroundColor:c.panel},hit:{width:38,height:42,alignItems:'center',justifyContent:'center'},
 card:{backgroundColor:c.panel,borderWidth:1,borderColor:c.surfaceBorder,borderRadius:22,padding:17,gap:15},ticket:{backgroundColor:c.deepest,borderRadius:16,padding:14,gap:12},
 tag:{padding:8,borderRadius:9,backgroundColor:c.input},status:{fontSize:10,fontFamily:fonts.bold,color:c.primary,backgroundColor:c.primarySoft,borderRadius:9,padding:7,maxWidth:'46%'},
 icon:{width:34,height:34,borderRadius:9,alignItems:'center',justifyContent:'center',backgroundColor:c.primarySoft},heading:{color:c.text,fontFamily:fonts.bold,fontSize:17},
 headline:{color:c.text,fontFamily:fonts.heavy,fontSize:22,lineHeight:27},subheading:{color:c.text,fontFamily:fonts.medium,fontSize:14},inset:{backgroundColor:c.input,padding:13,borderRadius:13,gap:10},
 code:{fontFamily:fonts.heavy,color:c.primary,fontSize:18,letterSpacing:1},meta:{padding:5,backgroundColor:c.input,color:c.muted,fontSize:11,borderRadius:5},
 tool:{minHeight:40,paddingHorizontal:10,justifyContent:'center',borderRadius:8,backgroundColor:c.elevated},wrap:{flexDirection:'row',flexWrap:'wrap',gap:7},
 chip:{minHeight:34,paddingHorizontal:9,justifyContent:'center',borderRadius:7,backgroundColor:c.elevated},selected:{backgroundColor:c.action},chipText:{color:c.text,fontFamily:fonts.medium,fontSize:12},
 segments:{backgroundColor:c.deepest,borderRadius:12,padding:4,flexDirection:'row'},segment:{flex:1,gap:4,paddingVertical:10,alignItems:'center',justifyContent:'center'},segmentOn:{backgroundColor:c.elevated,borderRadius:8},
 amount:{color:c.text,fontFamily:fonts.heavy,fontSize:34,minHeight:52}
});