import { ThemePicker } from '../components/ThemePicker';
import { ThemeColors , palette as speedPalette, fonts as f } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

import { useLoyalty } from '../hooks/useLoyalty';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { PilotCar, useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { PilotAvatar } from '../components/PilotAvatar';
import { StoreHeader, StoreIcon } from '../components/StoreHeader';
import { searchVehiclePresets, VehiclePreset } from '../data/vehicles';

type Editor = 'profile' | 'car' | 'address' | null;
const blankCar = { model: '', engine: '', year: '', color: '', power: '', exhaust: '' };
export default function PilotScreen() {
  const { colors: c } = useTheme();
  const s = useThemedStyles(createS);

  const loyalty = useLoyalty();
  const { user, update, logout } = useAuth();
  const { setVehicle } = useStore();
  const [editor, setEditor] = useState<Editor>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [vehicleSelected, setVehicleSelected] = useState(false);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [garagePage, setGaragePage] = useState(0);
  if (!user) return null;
  function openEditor(type: Editor, car?: PilotCar) {
    if (!user) return;
    setError(''); setFeedback(''); setVehicleSelected(false);
    setEditingCarId(type === 'car' && car ? car.id : null);
    setDraft(type === 'profile' ? { name: user.name, surname: user.surname, email: user.email, phone: user.phone } : type === 'address' ? { address: user.address } : type === 'car' && car ? { model: car.model, engine: car.engine, year: car.year, color: car.color, power: car.power, exhaust: car.exhaust } : { ...blankCar });
    setEditor(type);
  }
  async function action(work: () => Promise<void>, success = '') {
    if (busy) return;
    setBusy(true); setError(''); setFeedback('');
    try { await work(); setFeedback(success); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  async function pickPhoto(source: 'camera' | 'gallery') {
    if (busy) return;
    setError(''); setFeedback('');
    try {
      if (source === 'camera' && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError('Permita o acesso à câmera nos ajustes do aparelho ou escolha uma foto da galeria.');
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true,
      };
      // On web both pickers must open directly from the button press.
      const result = await (source === 'camera'
        ? ImagePicker.launchCameraAsync(options)
        : ImagePicker.launchImageLibraryAsync(options));
      if (result.canceled) return;
      const photo = result.assets[0];
      if (!photo.base64) throw new Error('Não foi possível ler a foto. Escolha outro arquivo.');
      if ((photo.fileSize || photo.base64.length * 0.75) > 5 * 1024 * 1024) throw new Error('Escolha uma foto de até 5 MB.');
      // Native editing and renamed desktop files can differ from the original MIME type.
      const mime = photo.base64.startsWith('/9j/') ? 'image/jpeg' : photo.base64.startsWith('iVBORw0KGgo') ? 'image/png' : photo.base64.startsWith('UklGR') ? 'image/webp' : photo.mimeType;
      if (!mime || !['image/png', 'image/jpeg', 'image/webp'].includes(mime)) throw new Error('Escolha uma foto PNG, JPEG ou WebP.');
      await action(() => update({ photo: `data:${mime};base64,${photo.base64}` }), 'Foto de perfil atualizada.');
    } catch (cause) { setError((cause as Error).message); }
  }
  async function save() {
    if (!user) return;
    await action(async () => {
      if (editor === 'car') {
        if (!draft.model?.trim()) throw new Error('Informe o modelo do carro.');
        const car: PilotCar = { ...blankCar, ...draft, id: editingCarId || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}` };
        if (editingCarId) {
          await update({ cars: user.cars.map(item => item.id === editingCarId ? car : item) });
          if (user.activeCarId === editingCarId) setVehicle(car.model);
        } else {
          if (user.cars.length >= 15) throw new Error('Sua garagem já está completa.');
          await update({ cars: [...user.cars, car], activeCarId: car.id });
          setVehicle(car.model);
          setGaragePage(Math.floor(user.cars.length / 3));
        }
      } else await update(draft);
      setEditor(null);
    }, 'Dados salvos na sua conta.');
  }
  const carSuggestions = editor === 'car' && !vehicleSelected ? searchVehiclePresets(draft.model || '', 8) : [];
  function selectVehicle(vehicle: VehiclePreset) {
    setDraft(previous => ({ ...previous, model: [vehicle.brand, vehicle.model, vehicle.generation].filter(Boolean).join(' '), engine: vehicle.engine, year: vehicle.years, power: vehicle.stockPower, exhaust: previous.exhaust || 'Original' }));
    setVehicleSelected(true);
  }
  function deleteCar(car: PilotCar) {
    if (!user) return;
    const currentUser = user;
    const confirmDeletion = async () => {
      const cars = currentUser.cars.filter(item => item.id !== car.id);
      const nextActive = currentUser.activeCarId === car.id ? cars[0]?.id || null : currentUser.activeCarId;
      await action(async () => {
        await update({ cars, activeCarId: nextActive });
        if (currentUser.activeCarId === car.id) setVehicle(cars[0]?.model || '');
        setGaragePage(Math.min(garagePage, Math.max(0, Math.ceil(cars.length / 3) - 1)));
      }, 'Carro removido da garagem.');
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm(`Excluir ${car.model} da garagem?`)) void confirmDeletion();
      return;
    }
    Alert.alert('Excluir carro', `Deseja remover ${car.model} da sua garagem?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => void confirmDeletion() }]);
  }
  const menu = [
    { icon: 'truck-outline' as const, title: 'Meus Pedidos & Entregas', description: 'Acompanhe seus pedidos', onPress: () => router.navigate('/(main)/orders'), color: c.primary },
    { icon: 'map-marker-outline' as const, title: 'Endereço de Entrega', description: user.address || 'Cadastre seu endereço principal', onPress: () => router.push('/address'), color: c.primary },
    { icon: 'headset' as const, title: 'Central de Suporte', description: 'Chamados, garantia e dúvidas técnicas', onPress: () => router.push('/support'), color: c.primary },
    { icon: 'file-document-outline' as const, title: 'Termos de Uso', description: 'Regras de uso do aplicativo', onPress: () => router.push('/terms'), color: c.muted },
    { icon: 'shield-half-full' as const, title: 'Política de Privacidade', description: 'Seus dados e suas solicitações', onPress: () => router.push('/privacy'), color: c.muted },
    { icon: 'information-outline' as const, title: 'Sobre a SpeedZone', description: 'Conheça o app e esta versão', onPress: () => router.push('/about'), color: c.muted },
  ];
  const fields = editor === 'profile' ? [['name', 'Nome'], ['surname', 'Sobrenome'], ['email', 'E-mail'], ['phone', 'Telefone (opcional)']] : editor === 'address' ? [['address', 'Endereço completo']] : [['model', 'Modelo do carro *'], ['engine', 'Motorização'], ['year', 'Ano'], ['color', 'Cor'], ['power', 'Potência (CV)'], ['exhaust', 'Escape']];
  const garagePages = Math.max(1, Math.ceil(user.cars.length / 3));
  const currentGaragePage = Math.min(garagePage, garagePages - 1);
  const visibleCars = user.cars.slice(currentGaragePage * 3, currentGaragePage * 3 + 3);
  return <SafeAreaView edges={['top']} style={s.safe}>
    <StoreHeader title="Perfil & Garagem" />
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.profile}>
        <View style={s.row}>
          <Pressable accessibilityRole="button" accessibilityLabel="Tirar foto de perfil" disabled={busy} onPress={() => void pickPhoto('camera')} style={s.photo}><PilotAvatar size={82} /><View style={s.camera}><StoreIcon name="camera-plus-outline" size={17} color={c.onPrimary} /></View></Pressable>
          <View style={s.grow}><View style={s.badge}><StoreIcon name="speedometer" size={13} /><Text style={s.badgeText}>PILOTO SPEEDZONE • DEMO</Text></View><Text style={s.name}>{user.name} {user.surname}</Text><Text style={s.secondary}>{user.email}</Text><View style={[s.row, { gap: 5, marginTop: 8 }]}><StoreIcon name="phone-outline" size={14} color={c.subtle} /><Text style={s.secondary}>{user.phone || 'Adicione seu telefone'}</Text></View></View>
        </View>
        <View style={s.photoActions}>
          {busy ? <Text style={s.secondary}>Salvando...</Text> : <>
            <Pressable accessibilityRole="button" onPress={() => void pickPhoto('camera')} style={s.textButton}>
              <Text style={s.link}>Tirar foto</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => void pickPhoto('gallery')} style={s.textButton}>
              <Text style={s.link}>Escolher da galeria</Text>
            </Pressable>
          </>}{user.photo && <Pressable accessibilityRole="button" disabled={busy} onPress={() => action(() => update({ photo: null }), 'Foto removida.')} style={s.textButton}><Text style={s.subtle}>Remover foto</Text></Pressable>}<Text style={s.tiny}>PNG, JPG ou WebP • até 5 MB</Text></View>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => openEditor('profile')} style={s.button}><StoreIcon name="account-edit-outline" size={18} /><Text style={s.buttonText}>Editar Dados Pessoais</Text></Pressable>
      </View>
      {(error || feedback) !== '' && <Text accessibilityLiveRegion="polite" style={[s.feedback, error ? { color: c.error } : undefined]}>{error || feedback}</Text>}
      <View style={s.sectionHeading}><View style={s.row}><StoreIcon name="garage-variant" size={20} /><Text style={s.sectionTitle}>MINHA GARAGEM</Text></View><Text style={s.tiny}>{user.cars.length} / 15 CARROS</Text></View>
      {visibleCars.map(car => <View key={car.id} style={s.card}>
        <View style={s.sectionHeading}><View style={[s.badge, car.id === user.activeCarId && { backgroundColor: c.primary }]}><Text style={[s.badgeText, car.id === user.activeCarId && { color: c.onPrimary }]}>{car.id === user.activeCarId ? '● PROJETO ATIVO' : 'PROJETO NA GARAGEM'}</Text></View>{car.id !== user.activeCarId && <Pressable accessibilityRole="button" disabled={busy} onPress={() => action(async () => { await update({ activeCarId: car.id }); setVehicle(car.model); })} style={s.textButton}><Text style={s.link}>Ativar</Text></Pressable>}</View>
        <Text style={s.carName}>{car.model}</Text><Text style={s.secondary}>{[car.engine, car.year && `(${car.year})`, car.color].filter(Boolean).join(' • ') || 'Seu projeto começa aqui'}</Text>
        <View style={s.specGrid}>{([{ label: 'POTÊNCIA', value: car.power ? `${car.power} CV` : 'A definir', icon: 'lightning-bolt-outline' }, { label: 'ESCAPE', value: car.exhaust || 'Original', icon: 'air-filter' }] as const).map(spec => <View key={spec.label} style={s.spec}><StoreIcon name={spec.icon} size={20} color={c.primary} /><View style={s.grow}><Text style={s.tiny}>{spec.label}</Text><Text style={s.specValue}>{spec.value}</Text></View></View>)}</View>
        <View style={s.carActions}><Pressable accessibilityRole="button" disabled={busy} onPress={() => openEditor('car', car)} style={s.carAction}><StoreIcon name="pencil-outline" size={17} color={c.primary} /><Text style={s.link}>Editar</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} onPress={() => deleteCar(car)} style={s.carAction}><StoreIcon name="delete-outline" size={17} color={c.error} /><Text style={s.dangerLink}>Excluir</Text></Pressable></View>
      </View>)}
      {user.cars.length > 3 && <View style={s.pagination}><Pressable accessibilityRole="button" accessibilityLabel="Página anterior" disabled={currentGaragePage === 0} onPress={() => setGaragePage(page => Math.max(0, page - 1))} style={[s.pageButton, currentGaragePage === 0 && s.pageDisabled]}><StoreIcon name="chevron-left" size={18} /></Pressable>{Array.from({ length: garagePages }, (_, index) => <Pressable key={index} accessibilityRole="button" accessibilityLabel={`Página ${index + 1}`} accessibilityState={{ selected: currentGaragePage === index }} onPress={() => setGaragePage(index)} style={[s.pageButton, currentGaragePage === index && s.pageSelected]}><Text style={[s.pageText, currentGaragePage === index && { color: c.onPrimary }]}>{index + 1}</Text></Pressable>)}<Pressable accessibilityRole="button" accessibilityLabel="Próxima página" disabled={currentGaragePage === garagePages - 1} onPress={() => setGaragePage(page => Math.min(garagePages - 1, page + 1))} style={[s.pageButton, currentGaragePage === garagePages - 1 && s.pageDisabled]}><StoreIcon name="chevron-right" size={18} /></Pressable></View>}
      <View style={s.card}>{user.cars.length === 0 && <View style={s.empty}><StoreIcon name="car-sports" size={40} /><Text style={s.carName}>Sua garagem está pronta</Text><Text style={[s.secondary, { textAlign: 'center' }]}>Adicione seu primeiro carro e registre o setup do seu projeto.</Text></View>}<Pressable accessibilityRole="button" disabled={busy || user.cars.length >= 15} onPress={() => openEditor('car')} style={[s.button, user.cars.length >= 15 && { opacity: 0.5 }]}><StoreIcon name="plus-circle-outline" size={19} /><Text style={[s.buttonText, s.green]}>{user.cars.length >= 15 ? 'Garagem completa' : 'Adicionar Novo Carro / Projeto'}</Text></Pressable></View>
      <View style={[s.card, { marginTop: 6 }]}><View style={s.sectionHeading}><View style={s.row}><StoreIcon name="star-circle-outline" size={20} /><Text style={s.clubTitle}>SPEEDPOINTS CLUB</Text></View><Pressable accessibilityRole="button" onPress={() => router.push('/loyalty')} style={s.textButton}><Text style={s.link}>RESGATAR ›</Text></Pressable></View><View style={[s.row, { marginVertical: 12, alignItems: 'baseline' }]}><Text style={s.points}>{loyalty.data ? loyalty.data.balance.toLocaleString('pt-BR') : '—'}</Text><Text style={s.secondary}>pts disponíveis</Text></View><View style={s.sectionHeading}><Text style={s.tiny}>R$ 1 em produtos = 1 ponto</Text><Text style={[s.tiny, s.green]}>STAGE 0</Text></View><View style={s.progress} /><Text style={[s.subtle, { textAlign: 'right' }]}>Resgates a partir de 5.000 pontos.</Text></View>
      {user.canSupport && !user.isAdmin && <Pressable accessibilityRole="button" onPress={() => router.push('/admin-support')} style={s.menu}><StoreIcon name="headset" size={30}/><Text style={s.menuTitle}>Painel de Atendimento</Text></Pressable>}{user.isAdmin && <Pressable accessibilityRole="button" accessibilityLabel="Painel Administrativo" onPress={() => router.push('/admin')} style={s.menu}><StoreIcon name="shield-account-outline" size={30} /><View style={{ flex: 1 }}><Text style={s.menuTitle}>Painel Administrativo</Text><Text style={s.secondary}>Visão geral da operação SpeedZone</Text></View><StoreIcon name="chevron-right" /></Pressable>}<Text style={s.operations}>GERENCIAMENTO & OPERAÇÕES</Text>
      {menu.map(item => <Pressable accessibilityRole="button" key={item.title} onPress={item.onPress} style={({ pressed }) => [s.menu, pressed && { opacity: 0.7 }]}><View style={s.menuIcon}><StoreIcon name={item.icon} color={item.color} size={23} /></View><View style={s.grow}><Text style={s.menuTitle}>{item.title}</Text><Text numberOfLines={2} style={s.secondary}>{item.description}</Text></View><StoreIcon name="chevron-right" color={c.subtle} size={20} /></Pressable>)}
      <ThemePicker />
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => action(logout)} style={s.logout}><StoreIcon name="logout" color={c.error} size={21} /><Text style={[s.buttonText, { color: c.error }]}>{busy ? 'Aguarde...' : 'Sair da Conta'}</Text></Pressable>
      <View style={s.footer}><Text style={s.operations}>SPEEDZONE MOTORSPORT OPERATIONS</Text><Text style={s.subtle}>SpeedZone • Conta local no seu computador</Text></View>
    </ScrollView>
    <Modal visible={editor !== null} transparent animationType="fade" onRequestClose={() => !busy && setEditor(null)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <View style={s.dialog}>
          <View style={s.sectionHeading}><Text style={s.dialogTitle}>{editor === 'profile' ? 'Dados do Piloto' : editor === 'car' ? editingCarId ? 'Editar carro' : 'Novo projeto' : 'Endereço de Entrega'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar edição" disabled={busy} onPress={() => setEditor(null)} style={s.close}><StoreIcon name="close" color={c.muted} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14, paddingBottom: 12 }}>
            {editor === 'car' && <View style={s.catalogHint}><StoreIcon name="auto-fix" size={19} color={c.primary}/><View style={s.grow}><Text style={s.fieldLabel}>GARAGEM INTELIGENTE</Text><Text style={s.secondary}>Digite marca, modelo ou geração. Escolha uma versão para preencher os dados originais.</Text></View></View>}
            {fields.map(([key, label]) => <View key={key} style={{ gap: 7 }}>
              <Text style={s.fieldLabel}>{label}</Text>
              <TextInput accessibilityLabel={label} value={draft[key] || ''} editable={!busy} onChangeText={value => { setDraft(previous => ({ ...previous, [key]: value })); if (key === 'model') setVehicleSelected(false); }} style={s.input} autoCapitalize={key === 'email' ? 'none' : 'sentences'} keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : ['year', 'power'].includes(key) ? 'numeric' : 'default'} maxLength={key === 'address' ? 300 : 100} multiline={key === 'address'} />
              {key === 'model' && carSuggestions.length > 0 && <View style={s.suggestions}>{carSuggestions.map(vehicle => <Pressable key={vehicle.id} accessibilityRole="button" accessibilityLabel={`Selecionar ${[vehicle.brand, vehicle.model, vehicle.generation, vehicle.years].filter(Boolean).join(' ')}`} onPress={() => selectVehicle(vehicle)} style={s.suggestion}><View style={s.grow}><Text style={s.suggestionTitle}>{vehicle.brand} {vehicle.model}</Text><Text style={s.secondary}>{[vehicle.generation, vehicle.years, vehicle.engine].filter(Boolean).join(' · ')}</Text></View>{vehicle.stockPower !== '' && <Text style={s.powerBadge}>{vehicle.stockPower} CV</Text>}</Pressable>)}</View>}
            </View>)}
            {error !== '' && <Text accessibilityLiveRegion="polite" style={{ color: c.error }}>{error}</Text>}
          </ScrollView>
          <Pressable accessibilityRole="button" disabled={busy} onPress={save} style={s.save}><Text style={[s.buttonText, { color: c.onPrimary }]}>{busy ? 'Salvando...' : 'Salvar alterações'}</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </SafeAreaView>;
}

const createS = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background }, content: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 20, paddingBottom: 36, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, grow: { flex: 1, minWidth: 0 }, profile: { padding: 20, borderRadius: 28, backgroundColor: c.panel, marginBottom: 12, borderTopWidth: 0, borderTopColor: speedPalette.deepGreen }, photo: { alignSelf: 'flex-start' }, camera: { position: 'absolute', right: -4, bottom: -4, backgroundColor: c.primary, borderRadius: 12, padding: 4, borderWidth: 2, borderColor: c.panel }, photoActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginVertical: 8 }, badge: { backgroundColor: c.primarySoft, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }, badgeText: { color: c.primary, fontSize: 9, letterSpacing: 0.6, fontFamily: f.bold }, name: { color: c.text, fontFamily: f.bold, fontSize: 20, marginTop: 7 }, secondary: { color: c.muted, fontFamily: f.regular, fontSize: 12, lineHeight: 18 }, tiny: { color: c.muted, fontFamily: f.medium, fontSize: 10, letterSpacing: 0.3 }, subtle: { color: c.subtle, fontFamily: f.regular, fontSize: 11 }, green: { color: c.primary }, link: { color: c.primary, fontFamily: f.bold, fontSize: 11 }, textButton: { minHeight: 40, justifyContent: 'center' }, button: { borderWidth: 1, borderColor: c.border, minHeight: 50, padding: 10, backgroundColor: c.elevated, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16 }, buttonText: { color: c.text, fontFamily: f.medium, fontSize: 13, flexShrink: 1, textAlign: 'center' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, sectionTitle: { color: c.text, fontFamily: f.bold, fontSize: 14 }, card: { borderWidth: 1, borderColor: c.surfaceBorder, padding: 16, borderRadius: 24, backgroundColor: c.panel, gap: 8 }, carName: { color: c.text, fontFamily: f.bold, fontSize: 19 }, specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }, spec: {borderRadius: 16,  width: '48%', flexGrow: 1, backgroundColor: c.deepest, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 65 }, specValue: { color: c.text, fontFamily: f.bold, fontSize: 13, marginTop: 2 }, carActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border, paddingTop: 8 }, carAction: { minHeight: 40, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }, dangerLink: { color: c.error, fontFamily: f.bold, fontSize: 11 }, pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 7 }, pageButton: { minWidth: 38, height: 38, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center' }, pageSelected: { backgroundColor: c.primary, borderColor: c.primary }, pageDisabled: { opacity: 0.35 }, pageText: { color: c.text, fontFamily: f.bold, fontSize: 12 }, empty: {borderRadius: 24,  alignItems: 'center', gap: 10, paddingVertical: 14 }, clubTitle: { fontFamily: f.bold, color: c.text, fontSize: 12, letterSpacing: 0.4 }, points: { fontFamily: f.heavy, fontSize: 34, color: c.primary, letterSpacing: -1 }, progress: { height: 7, borderRadius: 3, backgroundColor: c.deepest }, operations: { color: c.subtle, fontFamily: f.bold, fontSize: 10, letterSpacing: 1, marginTop: 12 }, menu: { padding: 16, backgroundColor: c.panel, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 78 }, menuIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: c.deepest, alignItems: 'center', justifyContent: 'center' }, menuTitle: { color: c.text, fontFamily: f.medium, fontSize: 16, marginBottom: 3 }, logout: { minHeight: 52, backgroundColor: c.dangerSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12, borderRadius: 18 }, footer: { alignItems: 'center', gap: 4, paddingBottom: 16 }, feedback: { fontFamily: f.medium, color: c.primary, fontSize: 13, padding: 10, lineHeight: 19 },
  overlay: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000bb' }, dialog: { width: '100%', maxWidth: 480, maxHeight: '90%', borderRadius: 24, padding: 20, backgroundColor: c.panel }, dialogTitle: { color: c.text, fontFamily: f.bold, fontSize: 20, flexShrink: 1 }, close: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }, fieldLabel: { color: c.muted, fontFamily: f.medium, fontSize: 12 }, input: { minHeight: 48, backgroundColor: c.deepest, color: c.text, padding: 13, borderRadius: 5, fontFamily: f.regular, fontSize: 15, borderWidth: 1, borderColor: speedPalette.steelGray }, catalogHint: { flexDirection:'row',alignItems:'flex-start',gap:10,padding:12,borderRadius:14,backgroundColor:c.primarySoft }, suggestions: { borderWidth:1,borderColor:c.border,borderRadius:14,overflow:'hidden',backgroundColor:c.deepest }, suggestion: { minHeight:62,padding:11,flexDirection:'row',alignItems:'center',gap:8,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:c.border }, suggestionTitle: { color:c.text,fontFamily:f.bold,fontSize:13 }, powerBadge: { color:c.primary,fontFamily:f.bold,fontSize:11,paddingHorizontal:7,paddingVertical:5,borderRadius:8,backgroundColor:c.primarySoft }, stageOptions: { flexDirection:'row',flexWrap:'wrap',gap:7 }, stageOption: { minHeight:38,paddingHorizontal:12,alignItems:'center',justifyContent:'center',borderRadius:12,backgroundColor:c.elevated,borderWidth:1,borderColor:c.border }, stageSelected: { backgroundColor:c.action,borderColor:c.action }, stageText: { color:c.text,fontFamily:f.medium,fontSize:12 }, save: { minHeight:48,marginTop:12,justifyContent:'center',alignItems:'center',backgroundColor:c.primary,borderRadius:6 },
});
