import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { StoreIcon } from './StoreHeader';

export function AdminThemeToggle() {
  const { colors, mode, setPreference } = useTheme();
  const { user, getAdminOverview, listAdminTickets } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [counts, setCounts] = useState({ orders: 0, tickets: 0, stock: 0 });
  const total = counts.orders + counts.tickets + counts.stock;
  const alerts = [
    { label: 'Pedidos em preparação', detail: 'Acompanhar a expedição', icon: 'package-variant-closed', count: counts.orders, route: '/admin-orders' },
    { label: 'Chamados abertos', detail: 'Atender os pilotos', icon: 'headset', count: counts.tickets, route: '/admin-support' },
    { label: 'Estoque baixo', detail: 'Conferir peças para reposição', icon: 'archive-alert-outline', count: counts.stock, route: '/admin-products' },
  ] as const;

  useEffect(() => {
    let active = true;
    const load = user?.isAdmin
      ? getAdminOverview().then(data => ({ orders: data.processing, tickets: data.openTickets, stock: data.lowStockCount ?? 0 }))
      : listAdminTickets().then(tickets => ({ orders: 0, tickets: tickets.filter(ticket => ticket.status === 'open').length, stock: 0 }));
    void load.then(data => { if (active) setCounts(data); }).catch(() => {});
    return () => { active = false; };
  }, [user?.isAdmin, getAdminOverview, listAdminTickets]);

  async function showAlerts() {
    setVisible(true);
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      if (user?.isAdmin) {
        const data = await getAdminOverview();
        setCounts({ orders: data.processing, tickets: data.openTickets, stock: data.lowStockCount ?? 0 });
      } else {
        const tickets = await listAdminTickets();
        setCounts({ orders: 0, tickets: tickets.filter(ticket => ticket.status === 'open').length, stock: 0 });
      }
    } catch {
      setError('Não foi possível carregar os alertas.');
    } finally {
      setLoading(false);
    }
  }

  return <View style={styles.actions}>
    <Pressable accessibilityRole="button" accessibilityLabel={mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      onPress={() => setPreference(mode === 'dark' ? 'light' : 'dark')}
      style={({ pressed }) => [styles.button, { backgroundColor: pressed ? colors.elevated : colors.panel, borderColor: colors.surfaceBorder }]}>
      <StoreIcon name={mode === 'dark' ? 'white-balance-sunny' : 'moon-waning-crescent'} color={colors.text} />
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={total ? 'Alertas do admin: ' + total : 'Alertas do admin'}
      onPress={() => void showAlerts()}
      style={({ pressed }) => [styles.button, { backgroundColor: pressed ? colors.elevated : colors.panel, borderColor: colors.surfaceBorder }]}>
      <StoreIcon name="bell-outline" color={colors.text} />
      {total > 0 && <Text style={[styles.badge, { backgroundColor: colors.primary, color: colors.onPrimary }]}>{total > 99 ? '99+' : total}</Text>}
    </Pressable>
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar alertas" style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} />
        <View accessibilityViewIsModal style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.surfaceBorder }]}>
          <View style={styles.heading}>
            <View style={[styles.headingIcon, { backgroundColor: colors.primarySoft }]}><StoreIcon name="bell-ring-outline" size={24} /></View>
            <View style={styles.grow}>
              <Text style={[styles.title, { color: colors.text }]}>Alertas do admin</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>{loading ? 'Atualizando pendências…' : error ? 'Atualização indisponível' : total ? `${total} pendências para acompanhar` : 'Tudo em dia por aqui'}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar alertas" style={styles.close} onPress={() => setVisible(false)}><StoreIcon name="close" color={colors.muted} size={20} /></Pressable>
          </View>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {loading ? <View style={styles.empty}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.muted }}>Carregando alertas…</Text></View>
            : error ? <View style={styles.empty}><StoreIcon name="wifi-alert" color={colors.error} size={30} /><Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void showAlerts()} style={styles.close}><Text style={{color:colors.primary}}>Tentar novamente</Text></Pressable></View>
              : total === 0 ? <View style={styles.empty}><StoreIcon name="check-circle-outline" size={36} /><Text style={{ color: colors.muted }}>Nenhum alerta ativo.</Text></View>
                : alerts.filter(alert => alert.count > 0).map(alert => <Pressable key={alert.route}
                  accessibilityRole="button" accessibilityLabel={`${alert.label}, ${alert.count}. ${alert.detail}`}
                  style={({ pressed }) => [styles.alert, { backgroundColor: pressed ? colors.elevated : colors.input, borderColor: pressed ? colors.primary : colors.surfaceBorder }]} onPress={() => {
                    setVisible(false);
                    router.navigate(alert.route);
                  }}>
                  <View style={[styles.alertIcon, { backgroundColor: colors.primarySoft }]}><StoreIcon name={alert.icon} size={21} /></View>
                  <View style={styles.grow}><Text style={[styles.alertTitle, { color: colors.text }]}>{alert.label}</Text><Text style={[styles.subtitle, { color: colors.muted }]}>{alert.detail}</Text></View>
                  <Text style={[styles.count, { color: colors.primary, backgroundColor: colors.primarySoft }]}>{alert.count}</Text>
                  <StoreIcon name="chevron-right" color={colors.subtle} size={18} />
                </Pressable>)}
          </ScrollView>
          <Pressable accessibilityRole="button" style={({pressed}) => [styles.done, { backgroundColor: pressed ? colors.elevated : colors.input, borderColor: colors.border }]} onPress={() => setVisible(false)}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>Voltar ao painel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, alignItems: 'center', flexShrink: 0 },
  button: { width: 44, height: 46, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 0, right: 0, fontSize: 10, fontWeight: 'bold', borderRadius: 8, paddingHorizontal: 4 },
  overlay: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: '#000b' },
  panel: { width: '100%', maxWidth: 480, maxHeight: '90%', alignSelf: 'center', padding: 18, borderRadius: 24, gap: 20, borderWidth: 1 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headingIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontFamily: fonts.bold, fontSize: 19, letterSpacing: -0.5 },
  subtitle: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16 },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  list: { flexShrink: 1 },
  listContent: { gap: 10 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, minHeight: 78, borderRadius: 14, borderWidth: 1 },
  alertIcon: { width: 36, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  count: { fontFamily: fonts.bold, fontSize: 13, minWidth: 28, paddingVertical: 5, paddingHorizontal: 6, borderRadius: 8, textAlign: 'center' },
  empty: { alignItems: 'center', padding: 20, gap: 12 },
  done: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1 },
});
