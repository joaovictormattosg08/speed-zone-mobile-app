import { AdminThemeToggle } from '../components/AdminThemeToggle';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme , useThemedStyles } from '../theme/ThemeContext';
import { ThemeColors, fonts } from '../theme/tokens';

import { Disclosure } from '../components/Disclosure';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ProductAction, createPs } from '../components/AdminProductUI';
import { ConfirmAction } from '../components/AdminDetailUI';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { InventoryProduct } from '../data/inventory';
import { categories, money, products as seeds } from '../data/products';
const empty: InventoryProduct = { id:'',name:'',category:'Turbo',subcategory:'',stage:'STAGE 1',price:0,cost:0,stock:0,minimum:3,published:false,images:[],platforms:[],power:'',diameter:'',material:'',description:'',revision:0 };
function Field({ label, value, onChange, numeric = false, multiline = false, disabled = false }: { label:string; value:string; onChange:(value:string)=>void; numeric?:boolean; multiline?:boolean; disabled?:boolean }) {
  const s = useThemedStyles(createPs);

  return <View style={{flex:1}}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} editable={!disabled} keyboardType={numeric?'decimal-pad':'default'} multiline={multiline} style={[s.input,multiline&&{minHeight:100,textAlignVertical:'top'}]} /></View>;
}
const numberOf = (text: string) => /^\d+(?:[.,]\d{1,2})?$/.test(text.trim()) ? Number(text.replace(',','.')) : NaN;
export default function AdminProductFormScreen() {
  const { colors: c } = useTheme();

  const local = useThemedStyles(createLocal);
  const s = useThemedStyles(createPs);

  const params = useLocalSearchParams<{id?:string;preview?:string}>(); const id = params.id;
  const { productRequest } = useAuth(); const { refresh } = useCatalog();
  const [draft,setDraft] = useState<InventoryProduct>(empty), [values,setValues] = useState({price:'',cost:'0',fixedCost:'0',stock:'0',minimum:'3'});
  const [loading,setLoading] = useState(!!id), [error,setError] = useState(''), [busy,setBusy] = useState(false), [picking,setPicking] = useState(false), [platform,setPlatform] = useState(''), [preview,setPreview] = useState(params.preview === '1');
  const [moreCategories, setMoreCategories] = useState(false);
  const lock = useRef(false); const scroll = useRef<ScrollView>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  async function archive() {
    if (!id || !draft.id || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      await productRequest('/admin/products/' + encodeURIComponent(id), 'PATCH', { revision: draft.revision, archived: true });
      await refresh().catch(() => {});
      router.replace('/admin-products');
    } catch (e) { setError((e as Error).message); scroll.current?.scrollTo({ y: 0, animated: true }); }
    finally { lock.current = false; setBusy(false); }
  }
  useEffect(() => { if (!id) return; let alive = true; productRequest('/admin/products').then(data => { const p = data.products.find(p => p.id === id); if (!p) throw new Error('Produto não encontrado.'); if (alive) { setDraft(p); setValues({price:String(p.price).replace('.',','),cost:String(p.cost).replace('.',','),fixedCost:String(p.fixedCost??0).replace('.',','),stock:String(p.stock),minimum:String(p.minimum)}); } }).catch(e => { if(alive)setError(e.message); }).finally(() => {if(alive)setLoading(false);}); return () => {alive=false;}; }, [id,productRequest]);
  const change = <K extends keyof InventoryProduct>(key:K,value:InventoryProduct[K]) => setDraft(p => ({...p,[key]:value}));
  async function pick(replace?:number) {
    if(picking || busy) return; setPicking(true); setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],base64:true,quality:.7,allowsEditing:true});
      if(result.canceled) return;
      const asset = result.assets[0]; if(!asset.base64) throw new Error('Não foi possível ler a foto. Escolha outra imagem.');
      const mime = asset.base64.startsWith('iVBOR') ? 'image/png' : asset.base64.startsWith('UklGR') ? 'image/webp' : 'image/jpeg';
      const uri = `data:${mime};base64,${asset.base64}`;
      const images = [...draft.images]; if(replace !== undefined) images[replace]=uri; else images.push(uri);
      if(images.length>5 || images.join('').length>6500000) throw new Error('Use até 5 fotos, total de até 4,8 MB. Escolha imagens menores.');
      change('images',images);
    } catch(e) {setError((e as Error).message);} finally {setPicking(false);}
  }
  async function save() {
    if(lock.current) return; lock.current=true; setBusy(true); setError('');
    try {
      const product = {...draft, ...Object.fromEntries(Object.entries(values).map(([key,value])=>[key,numberOf(value)]))};
      if(Object.values(values).some(v=>!Number.isFinite(numberOf(v)))) throw new Error('Preencha preço, custo e estoque com números válidos, sem separador de milhar.');
      const data = await productRequest(id ? '/admin/products/'+id : '/admin/products',id?'PATCH':'POST',product);
      setDraft(data.product); await refresh().catch(()=>{});
      router.replace({pathname:'/admin-product',params:{id:data.product.id,preview:'1'}});
      setPreview(true);
      scroll.current?.scrollTo({y:0,animated:false});
    } catch(e) {setError((e as Error).message);scroll.current?.scrollTo({y:0,animated:true});} finally {lock.current=false;setBusy(false);}
  }
  const price = numberOf(values.price), cost = numberOf(values.cost);
  const fixedCost = numberOf(values.fixedCost);
  const breakEven = price > cost && Number.isFinite(fixedCost) ? Math.ceil(fixedCost / (price-cost)) : null;
  const image = draft.images[0] ? {uri:draft.images[0]} : seeds.find(p=>p.id===id)?.image;
  const blocked = loading || busy || picking || (!!id && !draft.id);
  const goBack = () => router.replace('/admin-products');
  const featured = ['Turbo', 'Eletrônica', 'Cooling', 'Escape'];
  const labels: Record<string,string> = { Turbo:'Sobrealimentação / Turbo', Eletrônica:'Ignição', Cooling:'Arrefecimento' };
  const heading = (icon: React.ComponentProps<typeof Icon>['name'], title: string, badge?: string) => (
    <View style={local.row}><View style={local.icon}><Icon name={icon} size={18} color={c.primary}/></View>
      <Text style={[local.heading,s.flex]}>{title}</Text>{badge && <Text style={local.badge}>{badge}</Text>}
    </View>
  );
  function addPlatform() {
    const model = platform.trim();
    if (model && !draft.platforms.includes(model)) change('platforms',[...draft.platforms,model]);
    setPlatform('');
  }
  const margin = price > 0 && Number.isFinite(cost) ? (100*(price-cost)/price).toLocaleString('pt-BR',{maximumFractionDigits:1})+'% Margem' : undefined;
  return <SafeAreaView style={s.safe}><AdminThemeToggle/>
    <View style={local.bar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar para produtos" disabled={busy} onPress={goBack} style={local.back}><Icon name="arrow-left" size={22} color={c.text}/></Pressable>
      <View style={s.flex}><Text style={s.section}>{preview?'Inspecionar peça':id?'Editar peça':'Cadastrar Nova Peça'}</Text><Text style={s.eyebrow}>SPEEDZONE OPS</Text></View>
      <Text style={local.badge}>SKU Live</Text>
    </View>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={local.content}>
      <View style={local.row}><View style={s.flex}><Text style={local.kicker}>CATÁLOGO SPEEDZONE</Text><Text style={local.title}>Cadastro de Peça &amp; Telemetria</Text></View><Text style={local.step}>Passo {preview?2:1} de 2</Text></View>
      {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}{loading?<ActivityIndicator color={c.primary}/>:preview?<><View style={s.card}><Image source={image} style={{width:'100%',height:260,borderRadius:6}}/><Text style={s.eyebrow}>{draft.id} • {draft.published?'PUBLICADO':'RASCUNHO'}</Text><Text style={s.title}>{draft.name}</Text><Text style={s.price}>{money(draft.price)}</Text><Text style={s.body}>{draft.stock} unidades • mínimo {draft.minimum}</Text><Text style={s.body}>{draft.category} / {draft.subcategory} • {draft.stage}</Text><Text style={s.body}>{draft.description}</Text><Text style={s.green}>{draft.platforms.join(' • ')}</Text>{[draft.power,draft.diameter,draft.material].filter(Boolean).map((v,i)=><Text key={i} style={s.body}>{v}</Text>)}<ScrollView horizontal>{draft.images.slice(1).map((uri,i)=><Image key={i} source={{uri}} style={s.image}/>)}</ScrollView></View></>:<>
      <View style={local.card}>
        {heading('camera-outline','Fotos do Componente','OBRIGATÓRIO')}
        <Pressable accessibilityRole="button" accessibilityLabel="Carregar foto do componente" disabled={busy||picking||draft.images.length>=5} onPress={()=>void pick()} style={local.upload}>
          <View style={local.uploadIcon}><Icon name="image-plus-outline" size={24} color={c.primary}/></View>
          <Text style={local.uploadTitle}>{picking?'Carregando foto…':'Toque para carregar fotos do componente'}</Text>
          <Text style={local.hint}>Formatos PNG, JPG ou WEBP (até 4,8 MB no total)</Text>
          <View style={local.file}><View style={local.dot}/><Text style={local.fileText}>{draft.images.length ? draft.images.length+' foto(s) selecionada(s)' : image?'Foto do catálogo':'Nenhum arquivo selecionado'}</Text></View>
        </Pressable>
        {!!image && <ScrollView horizontal contentContainerStyle={local.row}>{(draft.images.length?draft.images.map(uri=>({uri})):[image]).map((source,i)=><View key={i} style={local.thumb}>
          <Pressable accessibilityRole="button" accessibilityLabel={'Substituir foto '+(i+1)} onPress={()=>void pick(draft.images.length?i:undefined)}><Image source={source} style={local.thumbImage}/></Pressable>
          {draft.images.length>0 && <Pressable accessibilityRole="button" onPress={()=>change('images',draft.images.filter((_,j)=>j!==i))}><Text style={s.small}>Remover</Text></Pressable>}
          {i>0 && <Pressable accessibilityRole="button" onPress={()=>change('images',[draft.images[i],...draft.images.filter((_,j)=>j!==i)])}><Text style={s.eyebrow}>Usar como capa</Text></Pressable>}
        </View>)}</ScrollView>}
      </View>
      <View style={local.card}>
        {heading('tune','Especificações Técnicas',draft.name.trim().length>=3 && draft.id.length>=3?'Calibrado':undefined)}
        <Field label="Nome Comercial da Peça" value={draft.name} onChange={v=>change('name',v)}/>
        <View style={local.fieldsRow}>
          <View style={local.fieldColumn}><Field label="SKU SpeedZone" value={draft.id} disabled={!!id} onChange={v=>change('id',v.toUpperCase().replace(/[^A-Z0-9-]/g,''))}/>{!id&&<ProductAction label="Gerar SKU" disabled={busy} onPress={()=>change('id','SZ-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase())}/>}</View>
          <Field label="Cód. Fabricante" value={draft.manufacturerCode??''} onChange={v=>change('manufacturerCode',v)}/>
        </View>
        <View><View style={s.between}><Text style={s.label}>Categoria de Performance</Text><Text style={s.small}>{draft.stage}</Text></View>
          <View style={local.wrap}>{[...featured,...categories.map(([value])=>value).filter(value=>!featured.includes(value)&&(moreCategories||value===draft.category))].map(value=>{
            const selected=draft.category===value;
            const icon=categories.find(([name])=>name===value)?.[1]??'tools';
            return <Pressable key={value} accessibilityRole="button" accessibilityState={{selected}} onPress={()=>change('category',value)} style={[local.chip,selected&&local.selected]}><Icon name={icon} size={15} color={selected?c.onPrimary:c.text}/><Text style={[local.chipText,selected&&{color:c.onPrimary}]}>{labels[value]??value}</Text></Pressable>;
          })}<Pressable accessibilityRole="button" accessibilityLabel="Alternar outras categorias" onPress={()=>setMoreCategories(!moreCategories)} style={local.chip}><Icon name={moreCategories?'chevron-up':'dots-horizontal'} size={16} color={c.text}/></Pressable></View>
        </View>
        <View><Text style={s.label}>Compatibilidade Homologada</Text><View style={local.wrap}>{draft.platforms.map(model=><Pressable key={model} accessibilityRole="button" accessibilityLabel={'Remover '+model} onPress={()=>change('platforms',draft.platforms.filter(p=>p!==model))} style={local.tag}><Text style={local.chipText}>{model}</Text><Icon name="close" size={13} color={c.text}/></Pressable>)}</View>
          <View style={local.add}><TextInput accessibilityLabel="Adicionar modelo compatível" placeholder="Adicionar outro modelo..." placeholderTextColor={c.subtle} value={platform} onChangeText={setPlatform} onSubmitEditing={addPlatform} style={[local.editor,s.flex]}/><Pressable accessibilityRole="button" accessibilityLabel="Adicionar modelo" onPress={addPlatform} style={local.mini}><Icon name="plus" size={18} color={c.text}/></Pressable></View>
        </View>
      </View>
      <View style={local.card}>
        {heading('cash-multiple','Preço & Estoque',margin)}
        <View style={local.row}>{(['price','cost'] as const).map(key=><View key={key} style={local.tile}><Text style={s.small}>{key==='price'?'Preço de Venda':'Preço de Custo'}</Text><View style={local.row}><Text style={s.eyebrow}>R$</Text><TextInput accessibilityLabel={key==='price'?'Preço de venda':'Preço de custo'} keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor={c.subtle} value={values[key]} onChangeText={value=>setValues(p=>({...p,[key]:value}))} style={[local.amount,s.flex]}/></View></View>)}</View>
        <View style={local.metric}><View style={local.trend}><Icon name="trending-up" size={20} color={c.onPrimary}/></View><View style={s.flex}><Text style={s.eyebrow}>LUCRO BRUTO PREVISTO</Text><Text style={local.amount}>{price>0&&Number.isFinite(cost)?money(price-cost):'—'}</Text></View><View><Text style={local.kicker}>BREAK-EVEN</Text><Text style={s.small}>{breakEven===null?'—':breakEven+' un'}</Text></View></View>
        <View style={local.row}><View style={local.tile}><Text style={s.small}>Em Estoque</Text><View style={local.stock}>
          <Pressable accessibilityRole="button" accessibilityLabel="Diminuir estoque" style={local.mini} onPress={()=>setValues(p=>({...p,stock:String(Math.max(0,(numberOf(p.stock)||0)-1))}))}><Icon name="minus" size={16} color={c.text}/></Pressable>
          <TextInput accessibilityLabel="Em estoque" keyboardType="number-pad" value={values.stock} onChangeText={stock=>setValues(p=>({...p,stock}))} style={[local.amount,s.flex,{textAlign:'center'}]}/>
          <Pressable accessibilityRole="button" accessibilityLabel="Aumentar estoque" style={local.mini} onPress={()=>setValues(p=>({...p,stock:String(Math.min(10000000,(numberOf(p.stock)||0)+1))}))}><Icon name="plus" size={16} color={c.text}/></Pressable>
        </View></View><View style={local.tile}><Text style={s.small}>Alerta Mínimo</Text><View style={local.row}><TextInput accessibilityLabel="Alerta mínimo em unidades" keyboardType="number-pad" value={values.minimum} onChangeText={minimum=>setValues(p=>({...p,minimum}))} style={[local.amount,s.flex,{color:c.warning}]}/><Text style={s.small}>un</Text><Icon name="bell-ring-outline" size={16} color={c.warning}/></View></View></View>
      </View>
      <View style={local.card}>
        {heading('toggle-switch-outline','Parâmetros de Publicação')}
        {([{key:'published',title:'Exibir no Catálogo Mobile',detail:'Visível para clientes no app após salvar.'},{key:'boxInstallation',title:'Instalação no Box SpeedZone',detail:'Peça disponível para montagem no Box.'}] as const).map(({key,title,detail},i)=><View key={key} style={[local.row,i===1&&local.divider]}><View style={s.flex}><Text style={local.heading}>{title}</Text><Text style={s.small}>{detail}</Text></View><Switch accessibilityLabel={title} value={!!draft[key]} onValueChange={v=>change(key,v)} trackColor={{true:c.action,false:c.border}}/></View>)}
      </View>
      <Disclosure title="Mais detalhes da peça">
        <Field label="Custo fixo para cálculo do break-even (R$)" numeric value={values.fixedCost} onChange={fixedCost=>setValues(p=>({...p,fixedCost}))}/>
        {([['subcategory','Subcategoria'],['stage','Stage / Linha'],['power','Potência suportada'],['diameter','Diâmetro'],['material','Material'],['description','Descrição técnica']] as const).map(([key,label])=><Field key={key} label={label} value={draft[key]} multiline={key==='description'} onChange={v=>change(key,v)}/>)}
      </Disclosure>
      {id&&draft.id&&<View style={[s.card,{backgroundColor:c.dangerSoft}]}><Text style={s.error}>Zona de Exclusão do Item</Text><Text style={s.body}>Remove a peça do catálogo e impede novas compras. Os pedidos anteriores continuam preservados.</Text>{confirmArchive?<ConfirmAction title="Remover produto do catálogo?" description={draft.name} busy={busy} onConfirm={()=>void archive()} onCancel={()=>setConfirmArchive(false)}/>:<ProductAction label="Excluir Produto do Catálogo" disabled={busy||picking} onPress={()=>setConfirmArchive(true)}/>}</View>}
      </>}
    <View style={local.row}>
      <View style={s.flex}><ProductAction label="Voltar" disabled={busy} onPress={goBack}/></View>
      <View style={{flex:2}}><ProductAction primary label={busy?'Salvando…':preview?'Editar peça':draft.published?'Salvar e publicar':'Salvar rascunho'} disabled={blocked} onPress={()=>preview?setPreview(false):void save()}/></View>
    </View>
    </ScrollView></KeyboardAvoidingView>
  </SafeAreaView>;
}
const createLocal = (c: ThemeColors) => StyleSheet.create({
 content:{width:'100%',maxWidth:680,alignSelf:'center',padding:16,gap:16,paddingBottom:32},
 bar:{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:16,paddingVertical:10,backgroundColor:c.panel,borderColor:c.surfaceBorder,borderWidth:StyleSheet.hairlineWidth},
 back:{width:40,height:40,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:c.input},
  row:{flexDirection:'row',alignItems:'center',gap:8},fieldsRow:{flexDirection:'row',alignItems:'flex-start',gap:8},fieldColumn:{flex:1,minWidth:0,gap:8},wrap:{flexDirection:'row',flexWrap:'wrap',gap:6},
 card:{backgroundColor:c.panel,borderColor:c.surfaceBorder,borderWidth:1,borderRadius:23,padding:18,gap:16},
 kicker:{color:c.subtle,fontFamily:fonts.bold,fontSize:10,letterSpacing:.7},
 title:{color:c.text,fontFamily:fonts.heavy,fontSize:23,lineHeight:25,letterSpacing:-.8},
 step:{backgroundColor:c.panel,color:c.text,borderWidth:1,borderColor:c.border,borderRadius:12,paddingHorizontal:12,paddingVertical:7,fontSize:12,maxWidth:86},
 badge:{backgroundColor:c.primarySoft,color:c.primary,paddingHorizontal:8,paddingVertical:5,borderRadius:9,fontFamily:fonts.medium,fontSize:10},
 icon:{width:32,height:32,alignItems:'center',justifyContent:'center',backgroundColor:c.input,borderRadius:10},
 heading:{fontFamily:fonts.bold,fontSize:15,color:c.text},
 upload:{minHeight:210,padding:18,borderWidth:1.5,borderStyle:'dashed',borderColor:c.border,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:c.input,gap:9},
 uploadIcon:{padding:12,backgroundColor:c.panel,borderRadius:12}, uploadTitle:{textAlign:'center',fontFamily:fonts.medium,fontSize:15,color:c.text},
 hint:{textAlign:'center',fontSize:12,color:c.subtle},file:{alignSelf:'stretch',backgroundColor:c.panel,borderRadius:10,borderWidth:1,borderColor:c.border,padding:10,flexDirection:'row',alignItems:'center',gap:8},
 dot:{width:8,height:8,borderRadius:4,backgroundColor:c.primary},fileText:{flex:1,color:c.text,textAlign:'center',fontSize:12},
 thumb:{gap:5},thumbImage:{width:76,height:62,borderRadius:8},
 chip:{flexDirection:'row',minHeight:34,paddingHorizontal:9,alignItems:'center',gap:5,backgroundColor:c.input,borderRadius:8},
 selected:{backgroundColor:c.action},chipText:{fontFamily:fonts.medium,fontSize:12,color:c.text},
 tag:{flexDirection:'row',alignItems:'center',padding:7,gap:6,borderRadius:5,backgroundColor:c.primarySoft},
 add:{marginTop:8,flexDirection:'row',alignItems:'center',backgroundColor:c.input,borderWidth:1,borderColor:c.border,borderRadius:8,paddingHorizontal:8},
 editor:{color:c.text,fontSize:13,minHeight:42},mini:{width:28,height:32,alignItems:'center',justifyContent:'center',backgroundColor:c.panel,borderColor:c.border,borderWidth:1,borderRadius:7},
 tile:{flex:1,minWidth:0,borderWidth:1,borderColor:c.surfaceBorder,backgroundColor:c.input,borderRadius:15,padding:10,gap:7},
 amount:{fontFamily:fonts.bold,fontSize:17,minWidth:0,color:c.text,paddingVertical:3,paddingHorizontal:0,minHeight:30},
 metric:{flexDirection:'row',alignItems:'center',gap:8,padding:12,borderWidth:1,borderColor:c.border,borderRadius:15,backgroundColor:c.primarySoft},
 trend:{padding:8,borderRadius:10,backgroundColor:c.action},stock:{flexDirection:'row',alignItems:'center'},
 divider:{borderTopWidth:StyleSheet.hairlineWidth,borderTopColor:c.border,paddingTop:14}
});
