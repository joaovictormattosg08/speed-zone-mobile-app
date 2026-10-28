import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AdminProductShell, ProductAction, ps as s } from '../components/AdminProductUI';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { InventoryProduct } from '../data/inventory';
import { categories, money, products as seeds } from '../data/products';
const empty: InventoryProduct = { id:'',name:'',category:'Turbo',subcategory:'',stage:'STAGE 1',price:0,cost:0,stock:0,minimum:3,published:false,images:[],platforms:[],power:'',diameter:'',material:'',description:'',revision:0 };
function Field({ label, value, onChange, numeric = false, multiline = false, disabled = false }: { label:string; value:string; onChange:(value:string)=>void; numeric?:boolean; multiline?:boolean; disabled?:boolean }) {
  return <View style={{flex:1}}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} editable={!disabled} keyboardType={numeric?'decimal-pad':'default'} multiline={multiline} style={[s.input,multiline&&{minHeight:100,textAlignVertical:'top'}]} /></View>;
}
const numberOf = (text: string) => /^\d+(?:[.,]\d{1,2})?$/.test(text.trim()) ? Number(text.replace(',','.')) : NaN;
export default function AdminProductFormScreen() {
  const params = useLocalSearchParams<{id?:string;preview?:string}>(); const id = params.id;
  const { productRequest } = useAuth(); const { refresh } = useCatalog();
  const [draft,setDraft] = useState<InventoryProduct>(empty), [values,setValues] = useState({price:'',cost:'0',stock:'0',minimum:'3'});
  const [loading,setLoading] = useState(!!id), [error,setError] = useState(''), [busy,setBusy] = useState(false), [picking,setPicking] = useState(false), [platform,setPlatform] = useState(''), [preview,setPreview] = useState(params.preview === '1');
  const lock = useRef(false); const scroll = useRef<ScrollView>(null);
  useEffect(() => { if (!id) return; let alive = true; productRequest('/admin/products').then(data => { const p = data.products.find(p => p.id === id); if (!p) throw new Error('Produto não encontrado.'); if (alive) { setDraft(p); setValues({price:String(p.price).replace('.',','),cost:String(p.cost).replace('.',','),stock:String(p.stock),minimum:String(p.minimum)}); } }).catch(e => { if(alive)setError(e.message); }).finally(() => {if(alive)setLoading(false);}); return () => {alive=false;}; }, [id,productRequest]);
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
  const image = draft.images[0] ? {uri:draft.images[0]} : seeds.find(p=>p.id===id)?.image;
  return <AdminProductShell footer={<View style={[s.footer,s.row]}><View style={s.flex}><ProductAction label="Cancelar" disabled={busy} onPress={()=>router.replace('/admin-products')} /></View><View style={{flex:2}}><ProductAction primary label={busy?'Salvando…':preview?'Editar Produto':'✓ Salvar e Inspecionar'} disabled={loading||busy||picking||(!!id&&!draft.id)} onPress={()=>preview?setPreview(false):void save()} /></View></View>}>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
      <ProductAction label="← Voltar para Produtos" disabled={busy} onPress={()=>router.replace('/admin-products')} /><View><Text style={s.eyebrow}>● SKU WIZARD</Text><Text style={s.title}>{preview?'Inspecionar Produto':id?'Editar Produto':'Cadastrar Novo Produto'}</Text><Text style={s.body}>Especificações e gestão do componente motorsport.</Text></View>
      {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}{loading?<ActivityIndicator color="#4edea3"/>:preview?<><View style={s.card}><Image source={image} style={{width:'100%',height:260,borderRadius:6}}/><Text style={s.eyebrow}>{draft.id} • {draft.published?'PUBLICADO':'RASCUNHO'}</Text><Text style={s.title}>{draft.name}</Text><Text style={s.price}>{money(draft.price)}</Text><Text style={s.body}>{draft.stock} unidades • mínimo {draft.minimum}</Text><Text style={s.body}>{draft.category} / {draft.subcategory} • {draft.stage}</Text><Text style={s.body}>{draft.description}</Text><Text style={s.green}>{draft.platforms.join(' • ')}</Text>{[draft.power,draft.diameter,draft.material].filter(Boolean).map((v,i)=><Text key={i} style={s.body}>{v}</Text>)}<ScrollView horizontal>{draft.images.slice(1).map((uri,i)=><Image key={i} source={{uri}} style={s.image}/>)}</ScrollView></View></>:<>
      <View style={s.card}>
        <View style={s.between}><Text style={[s.section,s.flex]}>▧ 1. Mídia & Documentação Técnica</Text><Text style={s.small}>{draft.images.length}/5 SLOTS</Text></View>
        {image ? <View style={local.hero}>
          <Image source={image} style={local.heroImage}/>
          <Text style={local.heroLabel}>◉ FOTO PRINCIPAL (HERO)</Text>
          <View style={local.heroActions}><ProductAction label="Substituir" disabled={picking||busy} onPress={()=>void pick(draft.images.length?0:undefined)}/>{draft.images.length>0&&<ProductAction label="Remover" disabled={busy||picking} onPress={()=>change('images',draft.images.slice(1))}/>}</View>
        </View> : <Pressable accessibilityRole="button" disabled={busy||picking} onPress={()=>void pick()} style={local.emptyPhoto}><Text style={s.price}>⊕</Text><Text style={s.section}>{picking?'Carregando…':'Adicionar foto principal'}</Text><Text style={s.small}>Escolha uma imagem do computador ou celular</Text></Pressable>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10}}>
          {draft.images.slice(1).map((uri,i)=><View key={i} style={local.thumbnail}>
            <Pressable accessibilityRole="button" accessibilityLabel={'Usar foto '+(i+2)+' como principal'} disabled={busy||picking} onPress={()=>change('images',[uri,...draft.images.filter((_,j)=>j!==i+1)])}><Image source={{uri}} style={local.thumbnailImage}/><Text style={s.small}>Foto {i+2} · Usar como capa</Text></Pressable>
            <ProductAction label="Remover" disabled={busy||picking} onPress={()=>change('images',draft.images.filter((_,j)=>j!==i+1))}/>
          </View>)}
          {draft.images.length>0&&draft.images.length<5&&<Pressable accessibilityRole="button" disabled={busy||picking} onPress={()=>void pick()} style={local.newSlot}><Text style={s.price}>⊕</Text><Text style={s.section}>Novo Slot</Text><Text style={s.small}>+ Fotos</Text></Pressable>}
        </ScrollView><Text style={s.small}>Até 5 fotos • 4,8 MB no total. Toque em uma miniatura para usá-la como capa.</Text>
      </View>
      <View style={s.card}><Text style={s.section}>☷ 2. Identificação & Aplicação</Text><Field label="Nome do Componente Automotivo" value={draft.name} onChange={v=>change('name',v)}/><Field label="Código SKU (único)" value={draft.id} disabled={!!id} onChange={v=>change('id',v.toUpperCase().replace(/[^A-Z0-9-]/g,''))}/>{!id&&<ProductAction label="⟳ Gerar SKU" onPress={()=>change('id','SZ-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,5).toUpperCase())}/>}<Text style={s.label}>Categoria</Text><ScrollView horizontal contentContainerStyle={{gap:6}}>{categories.map(([value])=><ProductAction key={value} primary={draft.category===value} label={value} onPress={()=>change('category',value)}/>)}</ScrollView><Field label="Subcategoria" value={draft.subcategory} onChange={v=>change('subcategory',v)}/><Field label="Stage / Linha" value={draft.stage} onChange={v=>change('stage',v)}/><Text style={s.label}>Plataformas Validadas (Cross-fit)</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{draft.platforms.map((value,i)=><ProductAction key={i} label={'✓ '+value+'  ×'} onPress={()=>change('platforms',draft.platforms.filter((_,j)=>i!==j))}/>)}</View><Field label="Motor / Plataforma" value={platform} onChange={setPlatform}/><ProductAction label="＋ Adicionar Motor" disabled={!platform.trim()} onPress={()=>{if(platform.trim()&&!draft.platforms.includes(platform.trim()))change('platforms',[...draft.platforms,platform.trim()]);setPlatform('');}}/></View>
      <View style={s.card}><Text style={s.section}>▣ 3. Precificação & Gestão de Estoque</Text><Text style={s.eyebrow}>Margem: {price>0&&Number.isFinite(cost)?((price-cost)/price*100).toFixed(1)+'%':'—'}</Text><View style={s.row}><Field label="Preço Venda (R$)" numeric value={values.price} onChange={v=>setValues(p=>({...p,price:v}))}/><Field label="Custo (R$)" numeric value={values.cost} onChange={v=>setValues(p=>({...p,cost:v}))}/></View><View style={s.row}><View style={s.flex}><Text style={s.label}>Estoque Físico</Text><View style={local.stepper}><Pressable accessibilityRole="button" accessibilityLabel="Diminuir estoque" disabled={busy||!(numberOf(values.stock)>0)} onPress={()=>setValues(p=>({...p,stock:String(Math.max(0,(numberOf(p.stock)||0)-1))}))} style={local.stepButton}><Text style={s.section}>−</Text></Pressable><TextInput accessibilityLabel="Quantidade em estoque" keyboardType="number-pad" value={values.stock} onChangeText={stock=>setValues(p=>({...p,stock}))} style={[s.input,{flex:1,minWidth:0,paddingHorizontal:0,textAlign:'center'}]}/><Pressable accessibilityRole="button" accessibilityLabel="Aumentar estoque" disabled={busy} onPress={()=>setValues(p=>({...p,stock:String(Math.min(10000000,(numberOf(p.stock)||0)+1))}))} style={local.stepButton}><Text style={s.section}>+</Text></Pressable></View></View><Field label="Gatilho Mínimo (un)" numeric value={values.minimum} onChange={v=>setValues(p=>({...p,minimum:v}))}/></View></View>
      <View style={s.card}><Text style={s.section}>⚙ 4. Blueprint & Métricas de Dyno</Text><Field label="Potência Suportada (ex.: 350–660 CV)" value={draft.power} onChange={v=>change('power',v)}/><Field label="Diâmetro Inducer / Exducer" value={draft.diameter} onChange={v=>change('diameter',v)}/><Field label="Material de Engenharia" value={draft.material} onChange={v=>change('material',v)}/><Field label="Descrição Técnica" multiline value={draft.description} onChange={v=>change('description',v)}/></View>
      <View style={[s.card,s.row]}><View style={s.flex}><Text style={s.section}>Publicar no Catálogo Geral</Text><Text style={s.body}>Disponibilizar para os clientes do aplicativo.</Text></View><Switch accessibilityLabel="Publicar no catálogo" value={draft.published} onValueChange={v=>change('published',v)} trackColor={{false:'#323538',true:'#4edea3'}} thumbColor="#003824"/></View>
      </>}
    </ScrollView></KeyboardAvoidingView>
  </AdminProductShell>;
}
const local=StyleSheet.create({
 hero:{position:'relative',borderRadius:6,overflow:'hidden',backgroundColor:'#0b0e11'},
 heroImage:{width:'100%',aspectRatio:1.6},
 heroLabel:{position:'absolute',top:10,left:10,color:'#4edea3',backgroundColor:'#0b0e11dd',fontSize:10,fontWeight:'700',padding:5},
 heroActions:{position:'absolute',bottom:8,right:8,flexDirection:'row',gap:6},
 emptyPhoto:{minHeight:210,alignItems:'center',justifyContent:'center',gap:12,backgroundColor:'#0b0e11',borderRadius:6,padding:16},
 thumbnail:{width:122,gap:8},thumbnailImage:{width:122,height:100,borderRadius:4},
 newSlot:{width:115,minHeight:130,alignItems:'center',justifyContent:'center',gap:6,backgroundColor:'#272a2d',borderRadius:4},
 stepper:{flexDirection:'row',alignItems:'center',backgroundColor:'#191c1f',borderRadius:5},
 stepButton:{minWidth:36,minHeight:48,alignItems:'center',justifyContent:'center',backgroundColor:'#272a2d'},
});

