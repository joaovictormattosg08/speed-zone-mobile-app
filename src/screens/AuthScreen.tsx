import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { ComponentProps, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthField } from '../components/AuthField';
import { colors, fonts } from '../theme/tokens';

type Mode = 'login' | 'register' | 'recovery';
type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

function Icon({ name, size = 20, color = colors.primary }: { name: IconName; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const register = mode === 'register';
  const recovery = mode === 'recovery';

  function changeMode(next: Mode) { setMode(next); setMessage(''); setPassword(''); setConfirmation(''); }
  function notice(text: string, error = false) { setIsError(error); setMessage(text); }
  function submit() {
    // Temporary preview access: replace with the real session flow when auth is connected.
    if (mode === 'login') { router.replace('/(main)/home'); return; }
    if (register && (!name.trim() || !surname.trim())) return notice('Preencha seu nome e sobrenome para continuar.', true);
    if (!validEmail(email)) return notice('Informe um e-mail válido para continuar.', true);
    if (!recovery && password.length < 8) return notice('Sua senha deve ter pelo menos 8 caracteres.', true);
    if (register && password !== confirmation) return notice('As senhas precisam ser iguais.', true);
    notice(recovery ? 'A recuperação de senha estará disponível em breve. Nenhum e-mail foi enviado.' : register ? 'Cadastro disponível em breve. Nenhuma conta foi criada.' : 'Sua garagem está quase pronta. O acesso à conta estará disponível em breve.');
  }

  return <SafeAreaView style={s.safe}>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          <View style={s.header}>
            <View style={s.telemetry}><Icon name="speedometer" size={18} /><Text style={s.telemetryText}>SPEEDZONE ACCESS // PILOT ID</Text><View style={s.smallDot} /></View>
            <View style={s.brand}><Icon name="cube-outline" size={29} /><Text style={s.brandText}>SPEEDZONE</Text><View style={s.pro}><Text style={s.proText}>PRO</Text></View></View>
            <Text style={s.subtitle}>Acesso seguro à telemetria de pedidos, peças forjadas e setup da sua garagem.</Text>
          </View>

          <View style={s.tabs} accessibilityRole="tablist">
            {([{ key: 'login', label: 'Entrar', icon: 'key-outline' }, { key: 'register', label: 'Novo Piloto', icon: 'badge-account-outline' }] as const).map(tab => <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: register ? tab.key === 'register' : tab.key === 'login' }} onPress={() => changeMode(tab.key)} style={({ pressed }) => [s.tab, (register ? tab.key === 'register' : tab.key === 'login') && s.activeTab, pressed && s.pressed]}><Icon name={tab.icon} color={(register ? tab.key === 'register' : tab.key === 'login') ? colors.primary : colors.muted} /><Text style={[s.tabText, (register ? tab.key === 'register' : tab.key === 'login') && s.green]}>{tab.label}</Text></Pressable>)}
          </View>

          <View style={s.panel}>
            <View style={s.panelHeading}><View style={s.titleGroup}><View style={s.dot} /><Text style={s.panelTitle}>{recovery ? 'Recuperar acesso' : register ? 'Cadastro do Piloto' : 'Credenciais do Piloto'}</Text></View><Text style={s.stage}>{recovery ? 'PIT STOP' : register ? 'STAGE-0' : 'STAGE-1 AUTH'}</Text></View>
            {recovery && <Text style={s.description}>Informe o e-mail da sua conta para recuperar a chave da sua garagem.</Text>}
            {register && <View style={s.names}><View style={s.flex}><AuthField label="Primeiro Nome" icon="account-outline" placeholder="Lucas" value={name} onChangeText={setName} autoComplete="given-name" /></View><View style={s.flex}><AuthField label="Sobrenome" icon="account-outline" placeholder="Silveira" value={surname} onChangeText={setSurname} autoComplete="family-name" /></View></View>}
            <AuthField label={register ? 'E-mail Principal' : 'E-mail Registrado'} icon="at" placeholder="piloto@speedzone.com.br" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" returnKeyType="next" />
            {!recovery && <AuthField label={register ? 'Criar Senha' : 'Senha de Acesso'} hint="8+ CARACTERES" icon="lock-outline" placeholder="••••••••••••" value={password} onChangeText={setPassword} password autoCapitalize="none" autoCorrect={false} autoComplete={register ? 'new-password' : 'current-password'} returnKeyType="go" onSubmitEditing={submit} />}
            {register && <AuthField label="Confirmar Senha" icon="shield-check-outline" placeholder="Repita sua senha" value={confirmation} onChangeText={setConfirmation} password autoCapitalize="none" autoCorrect={false} autoComplete="new-password" onSubmitEditing={submit} />}
            {!register && !recovery && <View style={s.utilities}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: remember }} accessibilityLabel="Lembrar dispositivo" onPress={() => setRemember(!remember)} style={s.remember}><View style={[s.checkbox, remember && s.checked]}>{remember && <Icon name="check-bold" size={15} color={colors.onPrimary} />}</View><Text style={s.utilityText}>Lembrar dispositivo</Text></Pressable><Pressable accessibilityRole="button" onPress={() => changeMode('recovery')} style={s.forgot}><Text style={s.link}>Esqueceu a chave?</Text></Pressable></View>}
            <Pressable accessibilityRole="button" onPress={submit} style={({ pressed }) => [s.primaryButton, pressed && s.pressed]}><Icon name={recovery ? 'email-fast-outline' : register ? 'account-plus-outline' : 'power'} size={22} color={colors.onPrimary} /><Text style={s.primaryText}>{recovery ? 'Recuperar minha chave' : register ? 'Criar Minha Conta de Piloto' : 'Acessar Garagem SpeedZone'}</Text><Icon name="arrow-right" size={20} color={colors.onPrimary} /></Pressable>
            {message !== '' && <View accessibilityLiveRegion="polite" style={s.notice}><Icon name={isError ? 'alert-circle-outline' : 'information-outline'} color={isError ? colors.error : colors.primary} size={18} /><Text style={[s.noticeText, isError && { color: colors.error }]}>{message}</Text></View>}
            {recovery && <Pressable accessibilityRole="button" onPress={() => changeMode('login')} style={s.back}><Text style={s.link}>Voltar para entrar</Text></Pressable>}
          </View>

          {!register && !recovery && <View style={s.alternatives}>
            <Pressable accessibilityRole="button" onPress={() => notice('O acesso por biometria estará disponível após a ativação da sua conta.')} style={({ pressed }) => [s.biometric, pressed && s.pressed]}><Icon name="fingerprint" size={24} /><Text style={s.biometricText}>Entrar com Biometria / Face ID</Text><View style={s.instant}><Text style={s.instantText}>INSTANTÂNEO</Text></View></Pressable>
            <View style={s.socialRow}>{([{ label: 'Google', icon: 'google' }, { label: 'Apple ID', icon: 'apple' }] as const).map(provider => <Pressable key={provider.label} accessibilityRole="button" accessibilityLabel={'Entrar com ' + provider.label} onPress={() => notice('O acesso com ' + provider.label + ' estará disponível em breve.')} style={({ pressed }) => [s.social, pressed && s.pressed]}><Icon name={provider.icon} size={22} color={colors.text} /><Text style={s.socialText}>{provider.label}</Text></Pressable>)}</View>
          </View>}

          <View style={s.footer}><View style={s.trustRow}><View style={s.trustItem}><Icon name="check-decagram-outline" size={18} /><Text style={s.trustText}>ACESSO PROTEGIDO</Text></View><View style={s.separator} /><View style={s.trustItem}><Icon name="shield-half-full" size={18} /><Text style={s.trustText}>PRIVACIDADE</Text></View></View><Text style={s.footerText}>Sua paixão por performance merece uma garagem à altura. Bem-vindo à SpeedZone Motorsport.</Text></View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 }, content: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  header: { alignItems: 'center', paddingBottom: 25 }, telemetry: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, paddingVertical: 6, backgroundColor: colors.elevated, borderRadius: 30, marginBottom: 15 },
  telemetryText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.6, color: colors.primary }, smallDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 }, brandText: { fontFamily: fonts.bold, fontSize: 26, letterSpacing: -0.8, color: colors.text },
  pro: { paddingHorizontal: 7, paddingVertical: 3, backgroundColor: colors.action, borderRadius: 2 }, proText: { color: colors.onPrimary, fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1 },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.muted, textAlign: 'center', maxWidth: 320 },
  tabs: { flexDirection: 'row', padding: 4, borderRadius: 9, backgroundColor: colors.deepest, marginBottom: 24 }, tab: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 10, borderRadius: 5 }, activeTab: { backgroundColor: colors.elevated }, tabText: { fontFamily: fonts.medium, fontSize: 15, color: colors.muted, letterSpacing: 0.3 }, green: { color: colors.primary },
  panel: { padding: 20, gap: 18, borderRadius: 9, backgroundColor: colors.panel }, panelHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }, titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }, panelTitle: { fontFamily: fonts.medium, color: colors.text, fontSize: 16, letterSpacing: -0.4 }, stage: { fontFamily: fonts.medium, color: colors.muted, fontSize: 11 }, names: { flexDirection: 'row', gap: 10 },
  description: { fontFamily: fonts.regular, color: colors.muted, fontSize: 13, lineHeight: 20 }, utilities: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', columnGap: 8, marginVertical: -6 }, remember: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }, checkbox: { width: 17, height: 17, borderWidth: 1, borderColor: colors.subtle, borderRadius: 2, justifyContent: 'center', alignItems: 'center' }, checked: { backgroundColor: colors.primary, borderColor: colors.primary }, utilityText: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted }, forgot: { minHeight: 44, justifyContent: 'center' }, link: { fontFamily: fonts.medium, color: colors.primary, fontSize: 12 },
  primaryButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 12, paddingVertical: 13, backgroundColor: colors.action, borderRadius: 5, boxShadow: '0 7px 18px rgba(16,185,129,0.16)' }, primaryText: { fontFamily: fonts.bold, fontSize: 14, color: colors.onPrimary, textAlign: 'center', flexShrink: 1 }, pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, backgroundColor: colors.input, borderRadius: 4 }, noticeText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.muted }, back: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  alternatives: { gap: 12, marginTop: 16 }, biometric: { minHeight: 50, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 10, paddingVertical: 12, backgroundColor: colors.elevated, borderRadius: 5 }, biometricText: { color: colors.text, fontFamily: fonts.medium, fontSize: 12 }, instant: { paddingHorizontal: 6, paddingVertical: 3, backgroundColor: colors.panel, borderRadius: 2 }, instantText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 10 }, socialRow: { flexDirection: 'row', gap: 12 }, social: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.elevated, borderRadius: 5 }, socialText: { color: colors.text, fontFamily: fonts.medium, fontSize: 13 },
  footer: { alignItems: 'center', marginTop: 32, gap: 14 }, trustRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 14 }, trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 }, trustText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 10 }, separator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3c4a42' }, footerText: { maxWidth: 320, textAlign: 'center', fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.subtle },
});

