import { palette as speedPalette } from '../theme/tokens';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AdminDetail, DetailSection } from '../components/AdminDetailUI';
import { ProductAction, ps as s } from '../components/AdminProductUI';
import { useAuth } from '../context/AuthContext';
import { ManagedUser, UserDraft, UserRole, roleLabels } from '../data/users';
import { money } from '../data/products';

export default function AdminUserFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, listUsers, saveUser, userLogs } = useAuth();
  const [record, setRecord] = useState<ManagedUser | null>(null), [draft, setDraft] = useState<UserDraft | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [retry, setRetry] = useState(0);
  const [logs, setLogs] = useState<string[] | null>(null);
  const lock = useRef(false);
  useEffect(() => { let alive = true; listUsers().then(all => { const found = all.find(u => u.id === id); if (!found) throw new Error('Usuário não encontrado.'); if (alive) { setRecord(found); setDraft({ ...found }); setError(''); } }).catch(e => { if (alive) setError(e.message); }).finally(() => { if (alive) setLoading(false); }); return () => { alive = false; }; }, [id, listUsers, retry]);
  const own = record?.id === user?.id;
  function change<K extends keyof UserDraft>(key: K, value: UserDraft[K]) { setDraft(p => p && ({ ...p, [key]: value })); setNotice(''); }
  async function save() {
    if (!draft || !record || lock.current) return; lock.current = true; setBusy(true); setError('');
    try { const saved = await saveUser(record.id, draft); setRecord(saved); setDraft({ ...saved }); setNotice('Cadastro e permissões salvos.'); setLogs(null); } catch (e) { setError((e as Error).message); } finally { lock.current = false; setBusy(false); }
  }
  async function history() {
    if (!record || lock.current) return; lock.current = true; setBusy(true);
    try { const entries = await userLogs(record.id); setLogs(entries.map(e => `${new Date(e.createdAt).toLocaleString('pt-BR')} · ${e.action}`)); } catch (e) { setError((e as Error).message); } finally { lock.current = false; setBusy(false); }
  }
  return <AdminDetail title="Editar Usuário & Permissões" back="/admin-users" busy={busy} footer={<View style={s.row}><View style={s.flex}><ProductAction label="Cancelar" disabled={busy} onPress={() => router.replace('/admin-users')} /></View><View style={{ flex: 2 }}><ProductAction primary label={busy ? 'Salvando…' : '✓ Salvar Alterações'} disabled={busy || loading || !draft} onPress={() => void save()} /></View></View>}>
    {loading && <ActivityIndicator color={speedPalette.speedGreen} />}{!!error && <View style={s.card}><Text accessibilityRole="alert" style={s.error}>{error}</Text><ProductAction label="Recarregar cadastro" disabled={busy} onPress={() => { setLoading(true); setRetry(v => v + 1); }} /></View>}{!!notice && <Text accessibilityLiveRegion="polite" style={s.green}>{notice}</Text>}
    {record && draft && !loading && <>
      <Text style={s.eyebrow}>VOLTAR P/ USUÁRIOS · ID #{record.id}</Text>
      <View style={s.row}>{record.photo ? <Image source={{ uri: record.photo }} style={{ width: 76, height: 82, borderRadius: 6 }} /> : <View style={[s.chip, { width: 66, height: 76, justifyContent: 'center', alignItems: 'center' }]}><Text style={s.price}>{record.name[0]}{record.surname[0]}</Text></View>}<View style={s.flex}><Text style={s.title}>{record.name} {record.surname}</Text><Text style={s.body}>{record.email}</Text><Text style={s.eyebrow}>{record.archived ? 'DESATIVADO' : record.blocked ? 'BLOQUEADO' : '● ATIVO'} · {roleLabels[record.role]}</Text></View></View>
      <View style={[s.card, s.row]}><View style={s.flex}><Text style={s.small}>CADASTRO</Text><Text style={s.body}>{record.createdAt ? new Date(record.createdAt).toLocaleDateString('pt-BR') : 'Não registrado'}</Text></View><View style={s.flex}><Text style={s.small}>HISTÓRICO FATURADO</Text><Text style={s.green}>{money(record.spent / 100)} ({record.orders} ped.)</Text></View></View>
      <DetailSection title="01 // Informações Cadastrais">{(['name', 'surname', 'email', 'phone'] as const).map((key, i) => <View key={key}><Text style={s.label}>{['Nome', 'Sobrenome', 'E-mail de notificações', 'Telefone / WhatsApp'][i]}</Text><TextInput accessibilityLabel={['Nome', 'Sobrenome', 'E-mail', 'Telefone'][i]} value={draft[key]} editable={!busy} onChangeText={v => change(key, v)} keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'} autoCapitalize={key === 'email' ? 'none' : 'words'} style={s.input} /></View>)}</DetailSection>
      <DetailSection title="02 // Nível de Acesso"><Text style={s.label}>Hierarquia operacional</Text><View style={s.row}>{(['customer', 'technician', 'admin'] as UserRole[]).map((role, i) => <View key={role} style={s.flex}><ProductAction label={['PILOTO', 'BOX', 'ADMIN'][i]} primary={draft.role === role} disabled={busy || own} onPress={() => change('role', role)} /></View>)}</View><Text style={s.body}>{draft.role === 'customer' ? 'Cliente: loja, garagem, pedidos e chamados próprios.' : draft.role === 'technician' ? 'Operador: atendimento técnico e respostas aos chamados.' : 'Administrador: acesso completo à operação e gestão de usuários.'}</Text><Text style={s.label}>Status da conta</Text>{(['active', 'blocked', 'archived'] as const).map((status, i) => <ProductAction key={status} label={['● Ativo', '● Bloqueado', '● Desativado'][i]} primary={status === 'archived' ? draft.archived : status === 'blocked' ? draft.blocked && !draft.archived : !draft.blocked && !draft.archived} disabled={busy || own} onPress={() => setDraft(p => p && ({ ...p, blocked: status === 'blocked', archived: status === 'archived' }))} />)}{(draft.blocked || draft.archived) && <View><Text style={s.label}>Motivo da restrição</Text><TextInput accessibilityLabel="Motivo da restrição" editable={!busy} multiline maxLength={500} value={draft.reason} onChangeText={v => change('reason', v)} style={[s.input, { minHeight: 88 }]} /></View>}{own && <Text style={s.small}>Você não pode alterar seu próprio nível de acesso ou bloquear sua conta.</Text>}</DetailSection>
      <DetailSection title="03 // Garagem Ativa do Piloto"><Text style={s.title}>{record.vehicle || 'Nenhum veículo cadastrado'}</Text><Text style={s.body}>{record.address || 'Endereço não informado'}</Text><Text style={s.small}>{record.orders} pedidos entregues</Text></DetailSection>
      <DetailSection collapsible title="04 // Segurança & Histórico"><Text style={s.body}>Alterar permissões, bloquear ou desativar encerra as sessões do usuário. Pedidos e chamados são preservados.</Text><ProductAction label="Ver histórico de gestão" disabled={busy} onPress={() => void history()} />{logs && (logs.length ? logs.map((entry, i) => <Text key={i} style={s.body}>{entry}</Text>) : <Text style={s.small}>Nenhuma alteração administrativa registrada.</Text>)}</DetailSection>
    </>}
  </AdminDetail>;
}
