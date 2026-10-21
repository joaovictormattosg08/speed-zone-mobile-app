import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { DeliveryAddress, addressError } from '../utils/address';
import { CheckoutButton, CheckoutHeader, checkoutStyles as s } from '../components/CheckoutUI';
const fields: [keyof DeliveryAddress, string, number][] = [['recipient', 'Destinatário', 140], ['phone', 'Telefone com DDD (opcional)', 20], ['street', 'Rua / Avenida', 120], ['number', 'Número (ou S/N)', 20], ['complement', 'Complemento (opcional)', 80], ['district', 'Bairro', 80], ['city', 'Cidade', 80], ['state', 'UF', 2], ['reference', 'Referência (opcional)', 150]];
export default function AddressScreen() {
  const { user, update } = useAuth();
  const [draft, setDraft] = useState<DeliveryAddress>(user?.deliveryAddress || { recipient: `${user?.name || ''} ${user?.surname || ''}`.trim(), phone: user?.phone || '', cep: '', street: '', number: '', complement: '', district: '', city: '', state: '', reference: '' });
  const [querying, setQuerying] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const controller = useRef<AbortController | null>(null), version = useRef(0), saving = useRef(false);
  useEffect(() => () => { version.current++; controller.current?.abort(); }, []);
  async function lookup() {
    if (!/^\d{8}$/.test(draft.cep)) { setError('Informe um CEP com 8 dígitos.'); return; }
    controller.current?.abort(); const request = new AbortController(); controller.current = request; const current = ++version.current;
    setQuerying(true); setError(''); setNotice('');
    const timer = setTimeout(() => request.abort(), 10000);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${draft.cep}/json/`, { signal: request.signal });
      if (!response.ok) throw new Error('Consulta indisponível. Tente novamente ou preencha o endereço manualmente.');
      const data = await response.json();
      if (data.erro) throw new Error('CEP não encontrado. Confira os números digitados.');
      if (typeof data.localidade !== 'string' || typeof data.uf !== 'string') throw new Error('Resposta de CEP inválida. Tente novamente.');
      if (current !== version.current) return;
      setDraft(previous => ({ ...previous, street: data.logradouro || '', district: data.bairro || '', city: data.localidade, state: data.uf }));
      setNotice('Endereço encontrado. Confira os dados e informe o número e complemento.');
    } catch (cause) { if (current === version.current) setError(request.signal.aborted ? 'A consulta demorou. Tente novamente ou preencha manualmente.' : (cause as Error).message); }
    finally { clearTimeout(timer); if (current === version.current) setQuerying(false); }
  }
  async function save() {
    if (saving.current) return;
    const clean = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim()])) as DeliveryAddress;
    const message = addressError(clean); if (message) { setError(message); return; }
    saving.current = true; setBusy(true); setError('');
    try { await update({ deliveryAddress: clean }); if (router.canGoBack()) router.back(); else router.replace('/(main)/account'); }
    catch (cause) { setError((cause as Error).message); }
    finally { saving.current = false; setBusy(false); }
  }
  return <SafeAreaView style={s.safe}><CheckoutHeader title="ENDEREÇO DE ENTREGA" onBack={() => { if (!busy) { if (router.canGoBack()) router.back(); else router.replace('/(main)/account'); } }} /><KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}><Text style={s.title}>Destino da sua garagem</Text><Text style={s.body}>Salve uma vez para usar nas próximas compras.</Text>{!user?.deliveryAddress && !!user?.address && <View style={s.card}><Text style={s.label}>ENDEREÇO CADASTRADO ANTERIORMENTE</Text><Text style={s.body}>{user.address}</Text><Text style={s.note}>Complete os campos abaixo para reutilizar também o CEP.</Text></View>}<View style={s.card}><Text style={s.label}>CEP</Text><TextInput accessibilityLabel="CEP do endereço" editable={!busy} value={draft.cep.length > 5 ? draft.cep.slice(0, 5) + '-' + draft.cep.slice(5) : draft.cep} maxLength={9} keyboardType="number-pad" onChangeText={value => { version.current++; controller.current?.abort(); setQuerying(false); setNotice(''); setDraft(previous => ({ ...previous, cep: value.replace(/\D/g, '').slice(0, 8) })); }} style={s.input} /><CheckoutButton label={querying ? 'CONSULTANDO...' : 'BUSCAR CEP'} disabled={querying || busy} onPress={() => void lookup()} /><Text style={s.note}>Consulta de rua, bairro, cidade e UF pelo ViaCEP.</Text>{!!notice && <Text accessibilityLiveRegion="polite" style={s.green}>{notice}</Text>}{fields.map(([key, label, limit]) => <View key={key} style={{ gap: 8 }}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={draft[key]} maxLength={limit} editable={!busy && !querying} keyboardType={key === 'phone' ? 'phone-pad' : 'default'} autoCapitalize={key === 'state' ? 'characters' : 'words'} onChangeText={value => setDraft(previous => ({ ...previous, [key]: key === 'state' ? value.toUpperCase() : value }))} style={s.input} /></View>)}</View>{!!error && <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>}<CheckoutButton label={busy ? 'SALVANDO...' : 'SALVAR ENDEREÇO'} disabled={busy || querying} onPress={() => void save()} /></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
