import { ProductCard } from '../components/ProductCard';
import { GarageOverview } from '../components/GarageOverview';
import { ThemeColors , palette as speedPalette, fonts as f } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

import { CatalogStatus } from '../components/CatalogStatus';
import { Disclosure } from '../components/Disclosure';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoreHeader, StoreIcon } from '../components/StoreHeader';
import { useStore } from '../context/StoreContext';
import { matchesVehicle } from '../utils/vehicleCompatibility';
import { categories } from '../data/products';

const stages = ['TODOS', 'STAGE 1', 'STAGE 2+', 'STAGE 3', 'TRACK DAY'];
export default function HomeScreen({ catalog = false }: { catalog?: boolean }) {
  const { colors: c } = useTheme();
  const s = useThemedStyles(createS);

  const { products, loading: catalogLoading, error: catalogError } = useCatalog();
  const { user, update } = useAuth();
  const [garageBusy, setGarageBusy] = useState(false);
  const [garageError, setGarageError] = useState('');
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('TODOS');
  const [category, setCategory] = useState('');
  const [sheet, setSheet] = useState<'garage' | 'filter' | 'package' | null>(null);
  const [filterCarId, setFilterCarId] = useState<string | null>(null);
  const filterCar = catalog ? user?.cars.find(car => car.id === filterCarId) : undefined;
  const [sort, setSort] = useState(false);
  const [selectedParts, setSelectedParts] = useState(['Downpipe', 'Intake', 'Remap Stage 2']);
  const { vehicle, favorites } = useStore();
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const favoriteIds = new Set(favorites);
  const activeCategory = category || (catalog ? params.category : '') || '';
  const filtered = products.filter(p => (!favoritesOnly || favoriteIds.has(p.id)) && (!filterCar || matchesVehicle(p, filterCar)) && (!activeCategory || p.category === activeCategory) && (stage === 'TODOS' || p.stage === stage) && `${p.name} ${p.id}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR').trim()));
  if (sort) filtered.sort((a, b) => a.price - b.price);
  const power = 230 + selectedParts.reduce((sum, part) => sum + ({ Downpipe: 18, Intake: 10, 'Remap Stage 2': 60 }[part] ?? 0), 0);
  const visibleProducts = !catalog && !query.trim() && !activeCategory && stage === 'TODOS' ? filtered.slice(0, 4) : filtered;
  async function selectCar(id: string) {
    if (garageBusy) return; setGarageBusy(true); setGarageError('');
    try { await update({ activeCarId: id }); setSheet(null); }
    catch (e) { setGarageError((e as Error).message); } finally { setGarageBusy(false); }
  }
  const openCatalog = () => router.navigate('/(main)/catalog');
  function clear() { setFavoritesOnly(false); setFilterCarId(null); setQuery(''); setStage('TODOS'); setCategory(''); if (catalog) router.setParams({ category: '' }); }

  return <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}>
    <StoreHeader title={catalog ? 'Catálogo' : 'Início'} />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {!catalog && <GarageOverview />}
      {catalog && <View style={s.catalogHeading}><Text style={s.catalogTitle}>Catálogo de Peças</Text><Text style={s.body}>Encontre o próximo upgrade do seu projeto.</Text></View>}
      <CatalogStatus/>
      <View style={s.searchRow}><View style={s.search}><StoreIcon name="magnify" size={20} color={c.muted} /><TextInput accessibilityLabel="Buscar por peça, nome ou SKU" placeholder="Buscar por peça, nome ou SKU..." placeholderTextColor={c.muted} value={query} onChangeText={setQuery} style={s.searchInput} returnKeyType="search" />{query !== '' && <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setQuery('')} style={s.clear}><StoreIcon name="close" size={18} /></Pressable>}</View><Pressable accessibilityRole="button" accessibilityLabel="Filtros de produtos" onPress={() => setSheet('filter')} style={s.filter}><StoreIcon name="tune-variant" /></Pressable></View>
      <Pressable accessibilityRole="button" accessibilityLabel={catalog ? 'Escolher carro para filtrar o catálogo' : 'Trocar veículo da garagem'} onPress={() => setSheet('garage')} style={s.garage}><View style={s.dot} /><StoreIcon name="car-sports" size={23} /><Text numberOfLines={1} style={s.vehicle}>{catalog ? (filterCar ? `Peças para ${filterCar.model}` : 'Peças para meu carro') : vehicle}</Text><Text style={s.link}>{catalog && !filterCar ? 'Escolher' : 'Alterar'}</Text></Pressable>
      {catalog && <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: favoritesOnly }}
        onPress={() => setFavoritesOnly(value => !value)} style={s.selectedFilter}>
        <StoreIcon name={favoritesOnly ? 'heart' : 'heart-outline'} />
        <Text style={s.link}>Favoritas ({favorites.length})</Text>
      </Pressable>}
      <View style={s.sectionHeading}><View style={s.marker} /><Text style={s.sectionTitle}>Categorias</Text><Text style={s.micro}>{categories.length} LINHAS</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categories}>{categories.map(([name, icon]) => <Pressable key={name} accessibilityRole="button" accessibilityState={{ selected: activeCategory === name }} onPress={() => { setCategory(activeCategory === name ? '' : name); if (catalog) router.setParams({ category: '' }); }} style={[s.category, activeCategory === name && s.categorySelected]}><View style={s.categoryIcon}><StoreIcon name={icon} size={25} /></View><Text style={s.categoryText}>{name}</Text></Pressable>)}</ScrollView>
      <View style={s.sectionHeading}><View style={[s.marker, { backgroundColor: speedPalette.speedGreen }]} /><Text style={s.sectionTitle}>Por estágio</Text><Pressable accessibilityRole="button" onPress={clear} style={s.smallAction}><Text style={s.link}>Ver Todos</Text></Pressable></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{stages.map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: stage === value }} onPress={() => setStage(value)} style={[s.chip, stage === value && s.chipActive]}><Text style={[s.chipText, stage === value && { color: c.onPrimary }]}>{value}</Text></Pressable>)}</ScrollView>
      <View style={s.sectionHeading}><View style={[s.marker, { backgroundColor: '#ffb95f' }]} /><Text style={s.sectionTitle}>{catalog ? 'Catálogo de Performance' : 'Peças em destaque'}</Text><Text style={s.micro}>{filtered.length} PEÇAS</Text></View>
      {activeCategory !== '' && <Pressable accessibilityRole="button" onPress={clear} style={s.selectedFilter}><Text style={s.link}>{activeCategory} · Limpar filtro</Text><StoreIcon name="close" size={16} /></Pressable>}
      <View style={s.grid}>{visibleProducts.map(product => <ProductCard key={product.id} product={product} list={catalog} vehicleId={filterCar?.id} />)}</View>
      {!catalogLoading && !catalogError && filtered.length === 0 && <View style={s.empty}><StoreIcon name="magnify" size={32} /><Text style={s.sectionTitle}>Nenhuma peça encontrada</Text><Text style={s.body}>{favoritesOnly && favorites.length === 0 ? 'Toque no coração na ficha de uma peça para salvá-la aqui.' : filterCar ? 'Nenhuma aplicação correspondente aos filtros para este carro. Tente outro veículo ou veja todas as peças.' : 'Experimente outra busca ou categoria.'}</Text><Pressable accessibilityRole="button" onPress={clear} style={s.smallAction}><Text style={s.link}>Limpar filtros</Text></Pressable></View>}
      {!catalog && <>
        <Pressable accessibilityRole="button" onPress={openCatalog} style={[s.configure, s.catalogButton]}><Text style={s.link}>Ver catálogo completo →</Text></Pressable>
        <Disclosure title="Simular ganho de potência">
        <View style={s.calculator}><View style={s.calcHeading}><StoreIcon name="speedometer" /><Text style={s.calcTitle}>Calculadora de Ganho Dinamômetro</Text><View style={s.ecu}><Text style={s.micro}>LIVE{'\n'}ECU</Text></View></View><Text style={s.body}>Simule o ganho de potência estimado combinando <Text style={{ color: c.text }}>Downpipe + Intake + Remap Stage 2</Text> para o seu motor.</Text><View style={s.metrics}>{[{ label: 'ORIGINAL', value: '230', unit: 'cv', color: c.text }, { label: 'COM SPEEDZONE', value: String(power), unit: 'cv', color: c.primary }, { label: 'GANHO TORQUE', value: '+' + ((power - 230) * 12.4 / 88).toFixed(1), unit: 'kgfm', color: c.primary }].map(metric => <View key={metric.label} style={s.metric}><Text style={s.metricLabel}>{metric.label}</Text><Text style={[s.metricValue, { color: metric.color }]}>{metric.value}<Text style={s.unit}> {metric.unit}</Text></Text></View>)}</View><Pressable accessibilityRole="button" onPress={() => setSheet('package')} style={s.configure}><Text style={s.link}>Configurar Peças do Pacote</Text><StoreIcon name="chevron-right" size={18} /></Pressable></View>
        </Disclosure>
        <Disclosure title="Como funciona a SpeedZone"><View style={s.trust}>{([{ icon: 'truck-delivery-outline', title: 'Entrega simulada', text: 'Calcule uma estimativa no carrinho. Não há transportadora conectada.' }, { icon: 'check-decagram-outline', title: 'Catálogo de peças', text: 'Consulte as especificações e confirme a aplicação antes de comprar.' }, { icon: 'headset', title: 'Atendimento pelo app', text: 'Abra um chamado e acompanhe as respostas da equipe.' }] as const).map((item, index) => <View key={item.title} style={[s.trustRow, index > 0 && s.trustBorder]}><View style={s.trustIcon}><StoreIcon name={item.icon} /></View><View style={{ flex: 1 }}><Text style={s.trustTitle}>{item.title}</Text><Text style={s.body}>{item.text}</Text></View></View>)}</View></Disclosure>
      </>}
      <Text style={s.demo}>MODO DEMONSTRAÇÃO · CATÁLOGO ILUSTRATIVO</Text>
    </ScrollView>
    <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={() => setSheet(null)}><View style={s.overlay}><Pressable accessibilityRole="button" accessibilityLabel="Fechar painel" style={StyleSheet.absoluteFill} onPress={() => setSheet(null)} /><SafeAreaView edges={['bottom']} style={s.sheet}><View style={s.handle} /><View style={s.calcHeading}><Text style={s.calcTitle}>{sheet === 'garage' ? 'Sua garagem' : sheet === 'filter' ? 'Filtros de Performance' : 'Configure seu pacote'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar painel" onPress={() => setSheet(null)} style={s.smallAction}><StoreIcon name="close" /></Pressable></View>
      {sheet === 'garage' && <ScrollView style={s.carOptions} keyboardShouldPersistTaps="handled">
        {catalog && <Pressable accessibilityRole="radio" accessibilityState={{ checked: !filterCar }}
          onPress={() => { setFilterCarId(null); setSheet(null); }} style={s.option}>
          <StoreIcon name="view-grid-outline" />
          <Text style={s.optionText}>Todas as peças</Text>
          {!filterCar && <StoreIcon name="check" />}
        </Pressable>}
        {user?.cars.map(car => {
          const checked = car.id === (catalog ? filterCar?.id : user.activeCarId);
          return <Pressable key={car.id} accessibilityRole="radio" accessibilityState={{ checked }}
            disabled={garageBusy} style={s.option} onPress={() => {
              if (catalog) {
                setFilterCarId(car.id);
                setSheet(null);
              } else void selectCar(car.id);
            }}>
            <StoreIcon name="car-sports" />
            <View style={{ flex: 1 }}>
              <Text style={s.optionText}>{car.model}{car.id === user.activeCarId ? ' · Ativo' : ''}</Text>
              <Text style={s.body}>{[car.year, car.engine].filter(Boolean).join(' · ')}</Text>
            </View>
            {checked && <StoreIcon name="check" />}
          </Pressable>;
        })}
        {!user?.cars.length && <Text style={s.body}>Cadastre um veículo em Conta para escolher um carro.</Text>}
        {!!garageError && <Text accessibilityRole="alert" style={{ color: c.error }}>{garageError}</Text>}
        <Pressable accessibilityRole="button" disabled={garageBusy} onPress={() => {
          setSheet(null);
          router.navigate('/(main)/account');
        }} style={s.option}>
          <Text style={s.link}>Gerenciar minha garagem →</Text>
        </Pressable>
      </ScrollView>}
      {sheet === 'filter' && <><Text style={s.body}>Ordenação do catálogo</Text><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: sort }} onPress={() => setSort(!sort)} style={s.option}><StoreIcon name={sort ? 'checkbox-marked' : 'checkbox-blank-outline'} /><Text style={s.optionText}>Menor preço primeiro</Text></Pressable><Text style={s.body}>Combine com as categorias e os estágios na tela.</Text></>}
      {sheet === 'package' && <><Text style={s.body}>Simulação ilustrativa para o Golf GTI. O resultado real depende do motor, combustível e preparação.</Text>{['Downpipe', 'Intake', 'Remap Stage 2'].map(part => <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selectedParts.includes(part) }} key={part} style={s.option} onPress={() => setSelectedParts(old => old.includes(part) ? old.filter(p => p !== part) : [...old, part])}><StoreIcon name={selectedParts.includes(part) ? 'checkbox-marked' : 'checkbox-blank-outline'} /><Text style={s.optionText}>{part}</Text></Pressable>)}<Text style={s.price}>Potência estimada: {power} cv</Text></>}
      <Pressable accessibilityRole="button" onPress={() => setSheet(null)} style={s.cta}><Text style={s.ctaText}>Concluir</Text><StoreIcon name="check" color={c.onPrimary} /></Pressable>
    </SafeAreaView></View></Modal>
  </SafeAreaView>;
}

const createS = (c: ThemeColors) => StyleSheet.create({
  catalogHeading: { gap: 8, marginBottom: 22, marginTop: 8 }, catalogTitle: { color: c.text, fontFamily: f.bold, fontSize: 28, letterSpacing: -1 },
  catalogButton: { marginTop: 16, marginBottom: 8 },
  safe: { flex: 1, backgroundColor: c.background }, content: { padding: 20, paddingTop: 16, paddingBottom: 32, maxWidth: 600, width: '100%', alignSelf: 'center' },
  searchRow: { flexDirection: 'row', gap: 6 }, search: { borderWidth: 0, borderColor: c.border, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.panel, borderRadius: 18, paddingLeft: 13 }, searchInput: { flex: 1, minWidth: 0, minHeight: 54, color: c.text, fontFamily: f.regular, fontSize: 14, paddingRight: 8 }, clear: { width: 36, height: 48, alignItems: 'center', justifyContent: 'center' }, filter: { borderWidth: 0, borderColor: c.border, width: 54, height: 54, backgroundColor: c.panel, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  garage: { marginTop: 14, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.panel, borderRadius: 20, minHeight: 64, paddingHorizontal: 12 }, dot: { height: 7, width: 7, borderRadius: 4, backgroundColor: c.primary }, micro: { fontFamily: f.medium, fontSize: 9, color: c.subtle, letterSpacing: 0.6 }, vehicle: { fontFamily: f.medium, fontSize: 13, color: c.text, flex: 1 }, link: { fontFamily: f.medium, fontSize: 12, color: c.primary }, body: { fontFamily: f.regular, fontSize: 13, lineHeight: 20, color: c.muted }, cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 46, alignSelf: 'flex-start', paddingHorizontal: 20, backgroundColor: c.primary, borderRadius: 4, marginTop: 3, boxShadow: '0 3px 18px #00C85320' }, ctaText: { color: c.onPrimary, fontFamily: f.medium, fontSize: 13 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10, marginBottom: 14, minHeight: 30 }, marker: { width: 0, height: 15, borderRadius: 3, backgroundColor: c.primary }, sectionTitle: { fontFamily: f.bold, fontSize: 19, letterSpacing: -0.6, color: c.text, flex: 1 }, categories: { gap: 8, paddingBottom: 20 }, category: { width: 86, padding: 10, alignItems: 'center', gap: 7, borderRadius: 20, backgroundColor: c.panel, borderWidth: 1, borderColor: 'transparent' }, categorySelected: { borderColor: c.primary }, categoryIcon: { width: 44, height: 44, backgroundColor: c.input, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, categoryText: { color: c.text, fontFamily: f.medium, fontSize: 9 }, smallAction: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' }, chips: { gap: 8, paddingBottom: 20 }, chip: { borderWidth: 0, borderColor: c.border, minHeight: 44, paddingHorizontal: 16, backgroundColor: c.panel, borderRadius: 20, justifyContent: 'center' }, chipActive: { backgroundColor: c.primary }, chipText: { fontFamily: f.medium, color: c.muted, fontSize: 10, letterSpacing: 0.4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 }, price: { color: c.primary, fontFamily: f.bold, fontSize: 16 }, selectedFilter: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }, empty: {borderRadius: 24,  alignItems: 'center', gap: 12, padding: 24 },
  calculator: { backgroundColor: c.input, borderRadius: 8, padding: 16, marginTop: 16, gap: 12 }, calcHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, calcTitle: { flex: 1, fontFamily: f.medium, color: c.text, fontSize: 15, lineHeight: 21 }, ecu: { backgroundColor: c.elevated, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 2 }, metrics: { flexDirection: 'row', gap: 6 }, metric: { borderWidth: 1, borderColor: c.surfaceBorder, flex: 1, backgroundColor: c.panel, paddingVertical: 10, alignItems: 'center', borderRadius: 4 }, metricLabel: { fontSize: 8, fontFamily: f.regular, color: c.subtle }, metricValue: { fontFamily: f.bold, fontSize: 18, marginTop: 4 }, unit: { fontFamily: f.regular, fontSize: 9 }, configure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 6, backgroundColor: c.elevated, borderRadius: 4 }, trust: { marginTop: 20, borderRadius: 8, backgroundColor: c.deepest, paddingHorizontal: 16 }, trustRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }, trustBorder: { borderTopWidth: 1, borderTopColor: c.panel }, trustIcon: { height: 40, width: 40, backgroundColor: c.panel, alignItems: 'center', justifyContent: 'center', borderRadius: 4 }, trustTitle: { fontFamily: f.medium, fontSize: 12, color: c.text, marginBottom: 2 }, demo: { color: c.subtle, fontFamily: f.regular, fontSize: 8, letterSpacing: 1, textAlign: 'center', marginTop: 24 },
  carOptions: { maxHeight: 320 },
  overlay: { flex: 1, backgroundColor: '#000a', justifyContent: 'flex-end' }, sheet: { backgroundColor: c.panel, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, gap: 16, width: '100%', maxWidth: 600, alignSelf: 'center' }, handle: { alignSelf: 'center', width: 36, height: 4, backgroundColor: c.subtle, borderRadius: 4 }, option: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 48 }, optionText: { flex: 1, color: c.text, fontFamily: f.medium, fontSize: 14 },
});
