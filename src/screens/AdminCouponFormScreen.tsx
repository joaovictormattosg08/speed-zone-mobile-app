import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { Promotion, PromotionDraft } from '../data/coupons';
import { categories, money, products } from '../data/products';
import { ProductAction, ps as s } from '../components/AdminProductUI';
import { PilotAvatar } from '../components/PilotAvatar';
import { StoreIcon } from '../components/StoreHeader';
import { colors as c } from '../theme/tokens';

const blank:PromotionDraft={code:'',label:'',kind:'percent',value:20,minimum:0,maximum:0,categories:[],limit:150,expires:'',paused:false,archived:false,ownerEmail:'',revision:0};
const numeric=(value:string)=>/^\d+(?:[.,]\d{1,2})?$/.test(value.trim())?Number(value.replace(',','.')):NaN;
function Field({label,value,onChange,numeric:decimal=false,disabled=false,placeholder}: {label:string;value:string;onChange:(v:string)=>void;numeric?:boolean;disabled?:boolean;placeholder?:string}){
 return <View><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} editable={!disabled} placeholder={placeholder} placeholderTextColor={c.subtle} keyboardType={decimal?'decimal-pad':'default'} autoCapitalize="none" style={s.input}/></View>;
}
export default function AdminCouponFormScreen(){
 const {code,duplicate}=useLocalSearchParams<{code?:string;duplicate?:string}>();
 const {listAdminCoupons,saveCoupon}=useAuth();const {products:catalog}=useCatalog();
 const [draft,setDraft]=useState<PromotionDraft>(blank),[known,setKnown]=useState<Promotion[]>([]),[loading,setLoading]=useState(true),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0);
 const [values,setValues]=useState({value:'20',minimum:'0',maximum:'0',limit:'150',sample:'1500'});
 const lock=useRef(false),scroll=useRef<ScrollView>(null);
 useEffect(()=>{let alive=true;listAdminCoupons().then(all=>{if(!alive)return;setKnown(all);if(code){const p=all.find(item=>item.code===code);if(!p)throw new Error('Cupom não encontrado.');setDraft({...p,categories:p.categories||[],maximum:p.maximum||0,...(duplicate?{code:p.code.slice(0,32)+'-COPIA',paused:true,archived:false,revision:0}:{})});setValues({value:String(p.kind==='fixed'?p.value/100:p.value),minimum:String(p.minimum/100),maximum:String((p.maximum||0)/100),limit:String(p.limit),sample:'1500'});}setError('');setLoaded(true);}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[code,duplicate,listAdminCoupons,retry]);
 const change=<K extends keyof PromotionDraft>(key:K,value:PromotionDraft[K])=>setDraft(p=>({...p,[key]:value}));
 const taken=known.some(p=>p.code===draft.code&&(duplicate||p.code!==code));
 const validCode=/^[A-Z0-9][A-Z0-9-]{2,39}$/.test(draft.code)&&!draft.code.startsWith('SP-');
 const options=[...new Set([...categories.map(([name])=>name),...catalog.map(p=>p.category),...(draft.categories||[])])];
 const amount=numeric(values.sample)*100,discountValue=numeric(values.value),maximum=numeric(values.maximum)*100;
 const simulated=Math.max(0,Math.min(amount,maximum||Infinity,draft.kind==='fixed'?discountValue*100:amount*discountValue/100));
 async function save(){if(lock.current)return;setError('');lock.current=true;setBusy(true);try{
  if(!validCode||taken)throw new Error('Informe um código válido e disponível.');
  if(['value','minimum','maximum','limit'].some(key=>!Number.isFinite(numeric(values[key as keyof typeof values]))))throw new Error('Informe números válidos, sem separador de milhar.');
  if(draft.kind!=='fixed'&&!Number.isInteger(discountValue))throw new Error('O percentual deve ser inteiro.');
  const payload={...draft,value:Math.round(discountValue*(draft.kind==='fixed'?100:1)),minimum:Math.round(numeric(values.minimum)*100),maximum:Math.round(maximum),limit:numeric(values.limit)};
  await saveCoupon(code&&!duplicate?code:null,payload);router.replace('/admin-coupons');
 }catch(e){setError((e as Error).message);scroll.current?.scrollTo({y:0,animated:true});}finally{lock.current=false;setBusy(false);}}
 return <SafeAreaView style={s.safe}>
  <View style={s.header}><Text style={s.logo}>ϟ SPEED<Text style={s.green}>ZONE</Text></Text><View style={s.flex}><Text style={s.eyebrow}>PAINEL ADMIN // OPS</Text><Text style={s.section}>Cupons</Text></View><PilotAvatar/></View>
  <KeyboardAvoidingView style={s.flex} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
   <ProductAction label="‹ Voltar para Cupons" disabled={busy} onPress={()=>router.replace('/admin-coupons')}/>
   <View><Text style={s.eyebrow}>TELEMETRIA PROMOCIONAL</Text><Text style={s.title}>{code&&!duplicate?'Editar Cupom':'Configurar Cupom'}</Text></View>
   {!!error&&<View><Text accessibilityRole="alert" style={s.error}>{error}</Text>{!loaded&&!loading&&<ProductAction label="Tentar novamente" onPress={()=>{setLoading(true);setLoaded(false);setRetry(v=>v+1);}}/>}</View>}
   {loading?<ActivityIndicator color={c.primary}/>:loaded&&<>
    <View style={[s.card,s.row]}><View style={s.flex}><Text style={s.eyebrow}>SIMULADOR DE IMPACTO</Text><Text style={s.title}>{draft.code||'SEU CUPOM'}</Text><Text style={s.body}>{draft.kind==='fixed'?money(discountValue||0):`${discountValue||0}%`} de desconto {draft.kind==='shipping'?'no frete':'nos produtos elegíveis'}.</Text></View><Image source={products.find(p=>p.category==='Freios')?.image||products[0].image} style={{width:72,height:72,borderRadius:5}}/></View>
    <View style={s.card}><Text style={s.section}>▦ 1. Código & Identificação</Text><View style={s.between}><Text style={s.label}>Código do Cupom (#TAG)</Text><Text style={taken?s.error:s.eyebrow}>{taken?'Já cadastrado':validCode?'Disponível na consulta':'3–40 caracteres'}</Text></View><TextInput accessibilityLabel="Código do cupom" autoCapitalize="characters" maxLength={40} editable={!busy&&!(code&&!duplicate)} value={draft.code} onChangeText={v=>change('code',v.toUpperCase().replace(/[^A-Z0-9-]/g,''))} style={s.input}/><Field label="Nome da Ação Promocional" value={draft.label} onChange={v=>change('label',v)} disabled={busy} placeholder="Ex.: Campanha Track Day"/></View>
    <View style={s.card}><Text style={s.section}>☷ 2. Desconto & Parâmetros</Text><Text style={s.label}>Mecânica de Cálculo</Text><View style={{gap:8}}>{([['percent','% Percentual'],['fixed','R$ Valor Fixo'],['shipping','Desconto no Frete']] as const).map(([kind,label])=><ProductAction key={kind} label={label} primary={draft.kind===kind} disabled={busy} onPress={()=>change('kind',kind)}/>)}</View>
     {(['value','minimum','maximum'] as const).map((key,i)=><Field key={key} label={[draft.kind==='fixed'?'Valor do Desconto (R$)':'Valor do Desconto (%)','Valor Mínimo do Pedido (R$)','Desconto Máximo Limitado (R$)'][i]} numeric value={values[key]} disabled={busy} onChange={v=>setValues(p=>({...p,[key]:v}))}/>)}<Text style={s.small}>Teto igual a 0: sem limite de valor. O mínimo considera o subtotal do pedido.</Text>
    </View>
    <View style={s.card}><Text style={s.section}>▣ 3. Validade & Regras</Text><Field label="Data de Expiração (AAAA-MM-DD)" value={draft.expires} onChange={v=>change('expires',v)} disabled={busy} placeholder="Opcional"/><Text style={s.small}>Válido até 23:59 da data informada, horário de Brasília.</Text><Field label="Limite Global de Usos (0 = ilimitado)" numeric value={values.limit} onChange={v=>setValues(p=>({...p,limit:v}))} disabled={busy}/><View style={[s.row,{backgroundColor:c.input,padding:12}]}><StoreIcon name="shield-check-outline"/><View style={s.flex}><Text style={s.section}>Apenas 1 uso por conta</Text><Text style={s.small}>Regra permanente. Cancelamentos não liberam outro uso.</Text></View></View><Field label="Conta exclusiva: e-mail (opcional)" value={draft.ownerEmail} onChange={v=>change('ownerEmail',v)} disabled={busy}/></View>
    <View style={s.card}><Text style={s.section}>⚑ 4. Restrições de Categorias</Text><Text style={s.body}>{draft.categories?.length?`${draft.categories.length} categorias selecionadas`:'Todas as categorias. Selecione para restringir.'}</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{options.map(name=>{const active=draft.categories?.includes(name);return <Pressable key={name} accessibilityRole="checkbox" accessibilityState={{checked:!!active}} disabled={busy} onPress={()=>change('categories',active?draft.categories!.filter(v=>v!==name):[...(draft.categories||[]),name])} style={[s.chip,active&&s.active]}><Text style={active?s.green:s.body}>{active?'✓ ':''}{name}</Text></Pressable>;})}</View><Text style={s.small}>{draft.kind==='shipping'?'O pedido deve conter ao menos uma peça da categoria selecionada.':'O desconto incide apenas sobre as peças das categorias selecionadas.'}</Text></View>
    <View style={s.card}><Text style={s.section}>● 5. Status & Publicação</Text><View style={s.between}><View style={s.flex}><Text style={s.section}>Ativar cupom no checkout</Text><Text style={s.small}>A validade e o limite de usos continuam valendo.</Text></View><Switch accessibilityLabel="Ativar cupom" value={!draft.paused} disabled={busy} onValueChange={v=>change('paused',!v)} trackColor={{true:c.primary,false:c.elevated}}/></View>{draft.archived&&<ProductAction label="Restaurar cupom arquivado" disabled={busy} onPress={()=>change('archived',false)}/>}</View>
    <View style={s.card}><Text style={s.eyebrow}>PRÉVIA DO BENEFÍCIO</Text><Field label={draft.kind==='shipping'?'Frete para simular (R$)':'Produtos elegíveis para simular (R$)'} numeric value={values.sample} onChange={v=>setValues(p=>({...p,sample:v}))}/><Text style={s.section}>Desconto estimado: {money(Number.isFinite(simulated)?simulated/100:0)}</Text><Text style={s.small}>Simulação para um pedido que atende ao valor mínimo, à validade e às regras de uso.</Text></View>
    <ProductAction primary disabled={busy||!loaded} label={busy?'Salvando…':'✓ Salvar Cupom de Desconto'} onPress={()=>void save()}/><ProductAction label="Cancelar" disabled={busy} onPress={()=>router.replace('/admin-coupons')}/>
   </>}
  </ScrollView></KeyboardAvoidingView>
  <View style={s.nav}>{([{label:'Dashboard',path:'/admin',icon:'view-dashboard-outline'},{label:'Produtos',path:'/admin-products',icon:'archive-outline'},{label:'Vendas',path:'/admin-orders',icon:'chart-line'},{label:'Cupons',path:'/admin-coupons',icon:'ticket-percent-outline'},{label:'Usuários',path:'/admin-users',icon:'account-group-outline'}] as const).map(tab=><Pressable key={tab.label} accessibilityRole="button" disabled={busy} style={s.navItem} onPress={()=>router.replace(tab.path)}><StoreIcon name={tab.icon} color={tab.label==='Cupons'?c.primary:c.muted}/><Text style={[s.small,tab.label==='Cupons'&&s.green]}>{tab.label}</Text></Pressable>)}</View>
 </SafeAreaView>;
}
