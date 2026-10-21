import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { PilotCar, useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { PilotAvatar } from '../components/PilotAvatar';
import { StoreHeader, StoreIcon } from '../components/StoreHeader';
import { colors as c, fonts as f } from '../theme/tokens';

type Editor = 'profile' | 'car' | 'address' | null;
const blankCar = { model: '', engine: '', year: '', color: '', power: '', tune: '', exhaust: '', ignition: '' };
export default function PilotScreen() {
  const { user, update, logout } = useAuth();
  const { setVehicle } = useStore();
  const [editor, setEditor] = useState<Editor>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState<{ title: string; text: string } | null>(null);
  if (!user) return null;
  function openEditor(type: Editor) {
    if (!user) return;
    setError(''); setFeedback('');
    setDraft(type === 'profile' ? { name: user.name, surname: user.surname, email: user.email, phone: user.phone } : type === 'address' ? { address: user.address } : { ...blankCar });
    setEditor(type);
  }
  async function action(work: () => Promise<void>, success = '') {
    if (busy) return;
    setBusy(true); setError(''); setFeedback('');
    try { await work(); setFeedback(success); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  async function pickPhoto() {
    // Invoke directly from the press event so browsers can open the file chooser.
    if (busy) return;
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true });
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
        const car: PilotCar = { ...blankCar, ...draft, id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}` };
        await update({ cars: [...user.cars, car], activeCarId: car.id }); setVehicle(car.model);
      } else await update(draft);
      setEditor(null);
    }, 'Dados salvos na sua conta.');
  }
  const showInfo = (title: string, text: string) => setInfo({ title, text });
  const menu = [
    { icon: 'truck-outline' as const, title: 'Meus Pedidos & Entregas', description: 'Acompanhe seus pedidos', onPress: () => router.navigate('/(main)/orders'), color: c.primary },
    { icon: 'map-marker-outline' as const, title: 'Endereço de Entrega', description: user.address || 'Cadastre seu endereço principal', onPress: () => openEditor('address'), color: '#7bd0ff' },
    { icon: 'credit-card-outline' as const, title: 'Formas de Pagamento', description: 'Pagamentos disponíveis em breve', onPress: () => showInfo('Formas de Pagamento', 'O processamento de pagamentos ainda não está conectado. Nenhum cartão é armazenado nesta versão.'), color: c.primary },
    { icon: 'bell-ring-outline' as const, title: 'Alertas de Estoque & Peças', description: 'Seu próximo upgrade, no radar', onPress: () => showInfo('Alertas de Estoque', 'Os avisos estarão disponíveis quando o estoque e as notificações forem conectados.'), color: '#ffb95f' },
    { icon: 'headset' as const, title: 'Central de Suporte', description: 'Chamados, garantia e dúvidas técnicas', onPress: () => router.push('/support'), color: c.primary },
    { icon: 'shield-half-full' as const, title: 'Privacidade & Termos de Uso', description: 'Como seus dados são armazenados', onPress: () => showInfo('Privacidade nesta versão local', 'Sua conta, foto e garagem ficam no banco de dados deste computador. A senha é armazenada como hash. Use Sair da Conta para encerrar a sessão. Esta versão não possui serviço de e-mail, pagamento ou sincronização em nuvem. Os termos definitivos serão disponibilizados antes da publicação.'), color: c.muted },
  ];
  const fields = editor === 'profile' ? [['name', 'Nome'], ['surname', 'Sobrenome'], ['email', 'E-mail'], ['phone', 'Telefone (opcional)']] : editor === 'address' ? [['address', 'Endereço completo']] : [['model', 'Modelo do carro *'], ['engine', 'Motorização'], ['year', 'Ano'], ['color', 'Cor'], ['power', 'Potência (CV)'], ['tune', 'Calibração'], ['exhaust', 'Escape'], ['ignition', 'Ignição']];
  return <SafeAreaView edges={['top']} style={s.safe}>
    <StoreHeader title="CONTA" />
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.profile}>
        <View style={s.row}>
          <Pressable accessibilityRole="button" accessibilityLabel="Alterar foto de perfil" disabled={busy} onPress={pickPhoto} style={s.photo}><PilotAvatar size={82} /><View style={s.camera}><StoreIcon name="camera-plus-outline" size={17} color={c.onPrimary} /></View></Pressable>
          <View style={s.grow}><View style={s.badge}><StoreIcon name="speedometer" size={13} /><Text style={s.badgeText}>PILOTO SPEEDZONE • STAGE 0</Text></View><Text style={s.name}>{user.name} {user.surname}</Text><Text style={s.secondary}>{user.email}</Text><View style={[s.row, { gap: 5, marginTop: 8 }]}><StoreIcon name="phone-outline" size={14} color={c.subtle} /><Text style={s.secondary}>{user.phone || 'Adicione seu telefone'}</Text></View></View>
        </View>
        <View style={s.photoActions}><Pressable accessibilityRole="button" accessibilityLabel="Escolher foto do computador" disabled={busy} onPress={pickPhoto} style={s.textButton}><Text style={s.link}>{busy ? 'Salvando...' : 'Escolher foto'}</Text></Pressable>{user.photo && <Pressable accessibilityRole="button" disabled={busy} onPress={() => action(() => update({ photo: null }), 'Foto removida.')} style={s.textButton}><Text style={s.subtle}>Remover foto</Text></Pressable>}<Text style={s.tiny}>PNG, JPG ou WebP • até 5 MB</Text></View>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => openEditor('profile')} style={s.button}><StoreIcon name="account-edit-outline" size={18} /><Text style={s.buttonText}>Editar Dados Pessoais</Text></Pressable>
      </View>
      {(error || feedback) !== '' && <Text accessibilityLiveRegion="polite" style={[s.feedback, error ? { color: c.error } : undefined]}>{error || feedback}</Text>}
      <View style={s.sectionHeading}><View style={s.row}><StoreIcon name="garage-variant" size={20} /><Text style={s.sectionTitle}>MINHA GARAGEM</Text></View><Text style={s.tiny}>{user.cars.length} / 3 CARROS</Text></View>
      {user.cars.map(car => <View key={car.id} style={s.card}>
        <View style={s.sectionHeading}><View style={[s.badge, car.id === user.activeCarId && { backgroundColor: c.primary }]}><Text style={[s.badgeText, car.id === user.activeCarId && { color: c.onPrimary }]}>{car.id === user.activeCarId ? '● PROJETO ATIVO' : 'PROJETO NA GARAGEM'}</Text></View>{car.id !== user.activeCarId && <Pressable accessibilityRole="button" disabled={busy} onPress={() => action(async () => { await update({ activeCarId: car.id }); setVehicle(car.model); })} style={s.textButton}><Text style={s.link}>Ativar</Text></Pressable>}</View>
        <Text style={s.carName}>{car.model}</Text><Text style={s.secondary}>{[car.engine, car.year && `(${car.year})`, car.color].filter(Boolean).join(' • ') || 'Seu projeto começa aqui'}</Text>
        <View style={s.specGrid}>{([{ label: 'POTÊNCIA', value: car.power ? `${car.power} CV` : 'A definir', icon: 'lightning-bolt-outline' }, { label: 'CALIBRAÇÃO', value: car.tune || 'Original', icon: 'tune' }, { label: 'ESCAPE', value: car.exhaust || 'Original', icon: 'air-filter' }, { label: 'IGNIÇÃO', value: car.ignition || 'Original', icon: 'engine-outline' }] as const).map((spec, index) => <View key={spec.label} style={s.spec}><StoreIcon name={spec.icon} size={20} color={index === 1 ? '#7bd0ff' : index === 2 ? '#ffb95f' : c.primary} /><View style={s.grow}><Text style={s.tiny}>{spec.label}</Text><Text style={s.specValue}>{spec.value}</Text></View></View>)}</View>
      </View>)}
      <View style={s.card}>{user.cars.length === 0 && <View style={s.empty}><StoreIcon name="car-sports" size={40} /><Text style={s.carName}>Sua garagem está pronta</Text><Text style={[s.secondary, { textAlign: 'center' }]}>Adicione seu primeiro carro e registre o setup do seu projeto.</Text></View>}<Pressable accessibilityRole="button" disabled={busy || user.cars.length >= 3} onPress={() => openEditor('car')} style={[s.button, user.cars.length >= 3 && { opacity: 0.5 }]}><StoreIcon name="plus-circle-outline" size={19} /><Text style={[s.buttonText, s.green]}>{user.cars.length >= 3 ? 'Garagem completa' : 'Adicionar Novo Carro / Projeto'}</Text></Pressable></View>
      <View style={[s.card, { marginTop: 6 }]}><View style={s.sectionHeading}><View style={s.row}><StoreIcon name="star-circle-outline" size={20} /><Text style={s.clubTitle}>SPEEDPOINTS CLUB</Text></View><Pressable accessibilityRole="button" onPress={() => showInfo('Histórico de SpeedPoints', 'Você ainda não acumulou pontos. O programa será ativado junto aos pedidos reais.')} style={s.textButton}><Text style={s.link}>HISTÓRICO ›</Text></Pressable></View><View style={[s.row, { marginVertical: 12, alignItems: 'baseline' }]}><Text style={s.points}>0</Text><Text style={s.secondary}>pts acumulados</Text></View><View style={s.sectionHeading}><Text style={s.tiny}>Tier Atual: Piloto Iniciante</Text><Text style={[s.tiny, s.green]}>STAGE 0</Text></View><View style={s.progress} /><Text style={[s.subtle, { textAlign: 'right' }]}>Seu próximo projeto começa aqui.</Text></View>
      <Text style={s.operations}>GERENCIAMENTO & OPERAÇÕES</Text>
      {menu.map(item => <Pressable accessibilityRole="button" key={item.title} onPress={item.onPress} style={({ pressed }) => [s.menu, pressed && { opacity: 0.7 }]}><View style={s.menuIcon}><StoreIcon name={item.icon} color={item.color} size={23} /></View><View style={s.grow}><Text style={s.menuTitle}>{item.title}</Text><Text numberOfLines={2} style={s.secondary}>{item.description}</Text></View><StoreIcon name="chevron-right" color={c.subtle} size={20} /></Pressable>)}
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => action(logout)} style={s.logout}><StoreIcon name="logout" color={c.error} size={21} /><Text style={[s.buttonText, { color: c.error }]}>{busy ? 'Aguarde...' : 'Sair da Conta'}</Text></Pressable>
      <View style={s.footer}><Text style={s.operations}>SPEEDZONE MOTORSPORT OPERATIONS</Text><Text style={s.subtle}>SpeedZone • Conta local no seu computador</Text></View>
    </ScrollView>
    <Modal visible={editor !== null} transparent animationType="fade" onRequestClose={() => !busy && setEditor(null)}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}><View style={s.dialog}><View style={s.sectionHeading}><Text style={s.dialogTitle}>{editor === 'profile' ? 'Dados do Piloto' : editor === 'car' ? 'Novo projeto' : 'Endereço de Entrega'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar edição" disabled={busy} onPress={() => setEditor(null)} style={s.close}><StoreIcon name="close" color={c.muted} /></Pressable></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14, paddingBottom: 12 }}>{fields.map(([key, label]) => <View key={key} style={{ gap: 7 }}><Text style={s.fieldLabel}>{label}</Text><TextInput accessibilityLabel={label} value={draft[key] || ''} editable={!busy} onChangeText={value => setDraft(previous => ({ ...previous, [key]: value }))} style={s.input} autoCapitalize={key === 'email' ? 'none' : 'sentences'} keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : ['year', 'power'].includes(key) ? 'numeric' : 'default'} maxLength={key === 'address' ? 300 : 100} multiline={key === 'address'} /></View>)}{error !== '' && <Text accessibilityLiveRegion="polite" style={{ color: c.error }}>{error}</Text>}</ScrollView><Pressable accessibilityRole="button" disabled={busy} onPress={save} style={s.save}><Text style={[s.buttonText, { color: c.onPrimary }]}>{busy ? 'Salvando...' : 'Salvar alterações'}</Text></Pressable></View></KeyboardAvoidingView></Modal>
    <Modal visible={info !== null} transparent animationType="fade" onRequestClose={() => setInfo(null)}><View style={s.overlay}><View style={s.dialog}><Text style={s.dialogTitle}>{info?.title}</Text><Text style={[s.secondary, { lineHeight: 23, marginVertical: 20 }]}>{info?.text}</Text><Pressable accessibilityRole="button" onPress={() => setInfo(null)} style={s.button}><Text style={s.buttonText}>Entendi</Text></Pressable></View></View></Modal>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background }, content: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 16, paddingBottom: 36, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, grow: { flex: 1, minWidth: 0 }, profile: { padding: 16, borderRadius: 10, backgroundColor: c.panel, marginBottom: 12, borderTopWidth: 1, borderTopColor: '#294439' }, photo: { alignSelf: 'flex-start' }, camera: { position: 'absolute', right: -4, bottom: -4, backgroundColor: c.primary, borderRadius: 12, padding: 4, borderWidth: 2, borderColor: c.panel }, photoActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginVertical: 8 }, badge: { backgroundColor: '#234437', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 2, flexDirection: 'row', alignItems: 'center', gap: 4 }, badgeText: { color: c.primary, fontSize: 9, letterSpacing: 0.6, fontFamily: f.bold }, name: { color: c.text, fontFamily: f.bold, fontSize: 20, marginTop: 7 }, secondary: { color: c.muted, fontFamily: f.regular, fontSize: 12, lineHeight: 18 }, tiny: { color: c.muted, fontFamily: f.medium, fontSize: 10, letterSpacing: 0.3 }, subtle: { color: c.subtle, fontFamily: f.regular, fontSize: 11 }, green: { color: c.primary }, link: { color: c.primary, fontFamily: f.bold, fontSize: 11 }, textButton: { minHeight: 40, justifyContent: 'center' }, button: { minHeight: 46, padding: 10, backgroundColor: c.elevated, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 3 }, buttonText: { color: c.text, fontFamily: f.medium, fontSize: 13, flexShrink: 1, textAlign: 'center' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, sectionTitle: { color: c.text, fontFamily: f.bold, fontSize: 14 }, card: { padding: 16, borderRadius: 9, backgroundColor: c.panel, gap: 8 }, carName: { color: c.text, fontFamily: f.bold, fontSize: 19 }, specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }, spec: { width: '48%', flexGrow: 1, backgroundColor: c.deepest, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 65 }, specValue: { color: c.text, fontFamily: f.bold, fontSize: 13, marginTop: 2 }, empty: { alignItems: 'center', gap: 10, paddingVertical: 14 }, clubTitle: { fontFamily: f.bold, color: c.text, fontSize: 12, letterSpacing: 0.4 }, points: { fontFamily: f.heavy, fontSize: 34, color: c.primary, letterSpacing: -1 }, progress: { height: 7, borderRadius: 3, backgroundColor: c.deepest }, operations: { color: c.subtle, fontFamily: f.bold, fontSize: 10, letterSpacing: 1, marginTop: 12 }, menu: { padding: 16, backgroundColor: c.panel, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 78 }, menuIcon: { width: 42, height: 42, borderRadius: 3, backgroundColor: c.deepest, alignItems: 'center', justifyContent: 'center' }, menuTitle: { color: c.text, fontFamily: f.medium, fontSize: 16, marginBottom: 3 }, logout: { minHeight: 52, backgroundColor: '#2b1318', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12, borderRadius: 5 }, footer: { alignItems: 'center', gap: 4, paddingBottom: 16 }, feedback: { fontFamily: f.medium, color: c.primary, fontSize: 13, padding: 10, lineHeight: 19 },
  overlay: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000bb' }, dialog: { width: '100%', maxWidth: 480, maxHeight: '90%', borderRadius: 14, padding: 20, backgroundColor: c.panel }, dialogTitle: { color: c.text, fontFamily: f.bold, fontSize: 20, flexShrink: 1 }, close: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }, fieldLabel: { color: c.muted, fontFamily: f.medium, fontSize: 12 }, input: { minHeight: 48, backgroundColor: c.deepest, color: c.text, padding: 13, borderRadius: 5, fontFamily: f.regular, fontSize: 15, borderWidth: 1, borderColor: '#334239' }, save: { minHeight: 48, marginTop: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: c.primary, borderRadius: 6 },
});
