import { StoreIcon } from '../components/StoreHeader';
import { PilotAvatar } from '../components/PilotAvatar';
import { AdminNavigation } from '../components/AdminNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, fonts } from '../theme/tokens';
import { useTheme , useThemedStyles } from '../theme/ThemeContext';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Switch, StyleSheet, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ProductAction, createPs } from '../components/AdminProductUI';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { InventoryProduct } from '../data/inventory';
import { money, products as seeds } from '../data/products';
export default function AdminProductsScreen() {
  const { colors: c } = useTheme();

  const ui = useThemedStyles(catalogStyles);
  const s = useThemedStyles(createPs);

  const { productRequest } = useAuth(); const { refresh } = useCatalog();
  const [items, setItems] = useState<InventoryProduct[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [query, setQuery] = useState(''), [filter, setFilter] = useState('Todos'), [sort, setSort] = useState(false), [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<InventoryProduct | null>(null), [busy, setBusy] = useState(false);
  useFocusEffect(useCallback(() => { let alive = true; void revision; productRequest('/admin/products').then(data => { if (alive) { setItems(data.products); setError(''); } }).catch(e => { if (alive) setError(e.message); }).finally(() => { if (alive) setLoading(false); }); return () => { alive = false; }; }, [productRequest, revision]));
  const matches = (p: InventoryProduct, value: string) => value === 'Todos' || (value === 'Disponíveis' ? p.stock > 0 && p.published : value === 'Estoque crítico' ? p.stock > 0 && p.stock <= p.minimum : value === 'Esgotados' ? p.stock === 0 : !p.published);
  const filtered = items.filter(p => matches(p, filter) && `${p.id} ${p.name} ${p.category}`.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim())).sort((a,b) => sort ? a.stock - b.stock : a.name.localeCompare(b.name));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  async function updateProduct(product: InventoryProduct, changes: Partial<Pick<InventoryProduct, 'stock' | 'published'>>) {
    if (updating || (changes.stock !== undefined && changes.stock < 0)) return;
    setUpdating(product.id);
    setError('');
    try {
      const result = await productRequest('/admin/products/' + product.id, 'PATCH', {...product, ...changes});
      setItems(current => current.map(item => item.id === product.id ? result.product : item));
      await refresh();
    } catch (cause) {
      setError((cause as Error).message);
      setRevision(value => value + 1);
    } finally {
      setUpdating(null);
    }
  }
  async function archive() { if (!selected || busy) return; setBusy(true); try { await productRequest('/admin/products/' + selected.id, 'PATCH', { revision: selected.revision, archived: true }); setSelected(null); setRevision(v => v + 1); await refresh(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  return <SafeAreaView style={s.safe}>
    <View style={ui.header}><View style={ui.brand}><StoreIcon name="tune" color={c.onPrimary} size={20}/></View>
      <View style={s.flex}><Text style={s.eyebrow}>SPEEDZONE OPS</Text><Text style={ui.title}>Catálogo &amp; Estoque Admin</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Ver alertas de reposição" style={ui.icon} onPress={()=>{setQuery('');setFilter('Estoque crítico');setFiltersOpen(true);}}><StoreIcon name="bell-outline" color={c.text} size={18}/></Pressable><PilotAvatar size={32}/>
    </View>
    <FlatList data={filtered} keyExtractor={p=>p.id} contentContainerStyle={ui.list} refreshing={loading} onRefresh={()=>setRevision(v=>v+1)}
      ListHeaderComponent={<View style={{gap:14}}>
        <View style={ui.toolbar}>
          <View style={[ui.control,s.flex]}><StoreIcon name="magnify" color={c.subtle} size={17}/><TextInput style={ui.search} placeholderTextColor={c.subtle} accessibilityLabel="Buscar produtos" placeholder="Buscar por nome ou SKU" value={query} onChangeText={setQuery}/></View>
          <Pressable accessibilityRole="button" accessibilityState={{expanded:filtersOpen}} onPress={()=>setFiltersOpen(!filtersOpen)} style={ui.control}><StoreIcon name="filter-variant" size={16} color={c.text}/><Text style={ui.action}>Filtros</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={()=>router.push('/admin-product')} style={[ui.control,ui.primary]}><StoreIcon name="plus" size={16} color={c.onPrimary}/><Text style={[ui.action,{color:c.onPrimary}]}>Cadastrar peça</Text></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>{[
          {label:'Total ativos',value:items.filter(p=>p.published).length,color:c.primary},
          {label:'Alerta reposição',value:items.filter(p=>matches(p,'Estoque crítico')).length,color:c.warning},
          {label:'Esgotados',value:items.filter(p=>!p.stock).length,color:c.error}
        ].map(m=><View key={m.label} style={ui.counter}><Text style={{color:m.color}}>●</Text><Text style={s.small}>{m.label}: <Text style={ui.action}>{m.value}</Text></Text></View>)}</ScrollView>
        {filtersOpen && <View style={{gap:10}}><ProductAction label={sort ? 'Ordenação: menor estoque ↑' : 'Ordenação: nome A–Z'} onPress={() => setSort(!sort)} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>{['Todos','Disponíveis','Estoque crítico','Esgotados','Rascunhos'].map(value => <ProductAction key={value} primary={filter === value} label={`${value} (${items.filter(p => matches(p,value)).length})`} onPress={() => setFilter(value)} />)}</ScrollView></View>}{!!error && <View style={s.card}><Text style={s.error}>{error}</Text><ProductAction label="Tentar novamente" onPress={() => setRevision(v => v + 1)} /></View>}{loading && <ActivityIndicator color={c.primary} />}</View>}
      ListEmptyComponent={!loading ? <Text style={s.body}>Nenhum produto encontrado. Cadastre uma peça ou ajuste a busca.</Text> : null}
      renderItem={({item:p})=>{
        const empty=p.stock===0, low=p.stock<=p.minimum;
        const color=empty?c.error:low?c.warning:c.primary;
        const source=p.images[0]?{uri:p.images[0]}:seeds.find(seed=>seed.id===p.id)?.image;
        const preview=()=>router.push({pathname:'/admin-product',params:{id:p.id,preview:'1'}});
        return <View style={ui.card}>
          <View style={ui.top}>
            <Pressable accessibilityRole="button" accessibilityLabel={'Ver '+p.name} onPress={preview} style={ui.thumb}>{source?<Image source={source} resizeMode="contain" style={ui.photo}/>:<StoreIcon name="package-variant" color={c.muted}/>}</Pressable>
            <View style={[s.flex,{gap:4}]}>
              <View style={ui.tags}><Text style={ui.sku}>SKU: {p.id}</Text><Text style={[ui.status,{color,backgroundColor:empty?c.dangerSoft:low?c.warningSoft:c.primarySoft}]}>● {empty?'Esgotado':low?'Estoque baixo':'Em estoque'}</Text></View>
              <Text onPress={preview} style={ui.name}>{p.name}</Text><Text numberOfLines={2} style={s.small}>{p.subcategory || p.category}</Text>
            </View>
            <Switch accessibilityLabel={'Publicar '+p.name} disabled={!!updating} value={p.published} trackColor={{true:c.action,false:c.border}} onValueChange={published=>void updateProduct(p,{published})}/>
          </View>
          <View style={ui.bottom}>
            <View style={{marginRight:'auto'}}><Text style={s.small}>Preço unitário</Text><Text style={ui.price}>{money(p.price)}</Text></View>
            <View style={ui.stepper}>{[-1,0,1].map(delta=>delta===0?<Text key={delta} style={[ui.action,{color}]}>{p.stock} un</Text>:<Pressable key={delta} accessibilityRole="button" accessibilityLabel={(delta<0?'Diminuir ':'Aumentar ')+p.name} disabled={!!updating || (empty && delta<0)} onPress={()=>void updateProduct(p,{stock:p.stock+delta})} style={ui.step}><Text style={ui.action}>{delta<0?'−':'+'}</Text></Pressable>)}</View>
            <Pressable accessibilityRole="button" onPress={()=>router.push({pathname:'/admin-product',params:{id:p.id}})} style={ui.edit}><StoreIcon name={empty?'cart-plus':'pencil-outline'} color={empty?c.primary:c.text} size={15}/><Text style={ui.action}>{empty?'Repor':'Editar'}</Text></Pressable>
          </View>
          {filtersOpen && <ProductAction danger label="Excluir peça" onPress={()=>{setError('');setSelected(p);}}/>}
        </View>;
      }}
      ListFooterComponent={<View style={s.card}><Text style={s.small}>VALOR DE VENDA DO ESTOQUE</Text><Text style={s.price}>{money(items.reduce((sum,p) => sum + p.stock*p.price, 0))}</Text><Text style={s.body}>{items.filter(p => p.published).length} publicados • {items.filter(p => p.stock <= p.minimum).length} precisam de reposição</Text></View>} />
    <Modal transparent visible={!!selected} onRequestClose={() => { if (!busy) setSelected(null); }}><View style={s.overlay}><View style={s.card}><Text style={s.title}>Excluir produto?</Text><Text style={s.body}>{selected?.name} será removido do catálogo. Pedidos anteriores continuarão preservados.</Text>{!!error && <Text style={s.error}>{error}</Text>}<ProductAction label="Cancelar" disabled={busy} onPress={() => setSelected(null)} /><ProductAction primary label={busy ? 'Excluindo…' : 'Confirmar exclusão'} disabled={busy} onPress={() => void archive()} /></View></View></Modal>
    <AdminNavigation current="/admin-products"/>
  </SafeAreaView>;
}

const catalogStyles=(c:ThemeColors)=>StyleSheet.create({
  header:{flexDirection:'row',alignItems:'center',gap:10,minHeight:64,paddingHorizontal:16,backgroundColor:c.panel,borderBottomWidth:1,borderColor:c.surfaceBorder},
  brand:{padding:8,borderRadius:9,backgroundColor:c.action},title:{fontFamily:fonts.bold,color:c.text,fontSize:16},
  icon:{padding:8,borderWidth:1,borderRadius:10,borderColor:c.border},
  list:{width:'100%',maxWidth:520,alignSelf:'center',padding:16,gap:14,paddingBottom:28},
  toolbar:{flexDirection:'row',alignItems:'center',gap:8},
  control:{flexDirection:'row',alignItems:'center',gap:5,minHeight:44,borderWidth:1,borderColor:c.border,backgroundColor:c.panel,borderRadius:15,paddingHorizontal:10},
  search:{flex:1,minWidth:0,color:c.text,fontFamily:fonts.regular,fontSize:13},primary:{backgroundColor:c.action,borderColor:c.action},
  action:{fontFamily:fonts.bold,fontSize:12,color:c.text},counter:{flexDirection:'row',gap:7,alignItems:'center',borderRadius:18,paddingHorizontal:12,paddingVertical:7,backgroundColor:c.panel,borderWidth:1,borderColor:c.surfaceBorder},
  card:{borderRadius:23,padding:16,gap:13,backgroundColor:c.panel,borderWidth:1,borderColor:c.surfaceBorder},
  top:{flexDirection:'row',gap:10,alignItems:'flex-start'},thumb:{width:56,height:58,alignSelf:'center',alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:c.input,overflow:'hidden'},photo:{width:'92%',height:'92%'},
  tags:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:4},sku:{fontFamily:fonts.bold,color:c.subtle,fontSize:10},status:{fontFamily:fonts.medium,fontSize:10,borderRadius:8,paddingHorizontal:6,paddingVertical:4},
  name:{fontFamily:fonts.bold,fontSize:15,lineHeight:19,color:c.text},bottom:{borderTopWidth:1,borderColor:c.surfaceBorder,paddingTop:10,flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:7},price:{fontFamily:fonts.heavy,fontSize:17,color:c.text},
  stepper:{flexDirection:'row',alignItems:'center',gap:5,padding:3,borderWidth:1,borderColor:c.border,borderRadius:9},step:{width:26,height:30,alignItems:'center',justifyContent:'center',borderRadius:6,backgroundColor:c.input},
  edit:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5,paddingHorizontal:9,height:38,borderRadius:9,backgroundColor:c.elevated}
});
