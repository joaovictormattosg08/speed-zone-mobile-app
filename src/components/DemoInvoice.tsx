import { ThemeColors , palette } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import type { Order } from '../data/orders';
import { statusLabels } from '../data/orderStatus';


const currency = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function DemoInvoice({ order, onClose }: { order: Order; onClose: () => void }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createS);

  const [error, setError] = useState('');
  const reference = `DEMO-${order.id}`;
  const date = new Date(order.createdAt).toLocaleDateString('pt-BR');
  const recipient = order.recipient || order.checkout?.recipient || 'Destinatário não informado';
  const totals: [string, number][] = [['Subtotal', order.subtotal], ['Desconto', -order.discount], ['Frete', order.shipping], ['Total', order.total]];
  async function share() {
    setError('');
    try {
      await Share.share({ title: `Nota fictícia ${reference}`, message: [
        'SPEEDZONE • NOTA FISCAL FICTÍCIA', 'SEM VALIDADE FISCAL • NÃO É DANFE',
        `Referência: ${reference}`, `Data do pedido: ${date}`, `Situação do pedido: ${statusLabels[order.status]}`,
        `Destinatário: ${recipient}`, `Endereço: ${order.address || 'Não informado'}`,
        ...order.items.map(item => `${item.name} (${item.id}) • ${item.quantity} un × ${currency(Math.round(item.price * 100))} = ${currency(Math.round(item.price * 100) * item.quantity)}`),
        ...totals.map(([label, value]) => `${label}: ${currency(value)}`),
        'Documento demonstrativo. Sem cobrança, emissão fiscal ou autorização da SEFAZ.',
      ].join('\n') });
    } catch { setError('Não foi possível compartilhar. Tente novamente.'); }
  }
  return <Modal visible animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={s.safe}>
      <View style={s.toolbar}><Text style={s.heading}>Nota fiscal fictícia</Text><Pressable accessibilityRole="button" onPress={onClose} style={s.button}><Text style={s.buttonText}>Fechar</Text></Pressable></View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.paper}>
          <Text style={s.brand}>SPEEDZONE</Text>
          <Text accessibilityRole="header" style={s.title}>NOTA FISCAL FICTÍCIA</Text>
          <View style={s.notice}><Text style={s.noticeText}>SEM VALIDADE FISCAL • NÃO É DANFE</Text></View>
          <Text selectable style={s.text}>Referência: {reference}</Text>
          <Text style={s.text}>Data do pedido: {date}</Text>
          <Text style={s.text}>Situação: {statusLabels[order.status]}</Text>
          {order.status === 'cancelled' && <Text style={s.warning}>PEDIDO CANCELADO • Somente consulta demonstrativa</Text>}
          <Text style={s.section}>DESTINATÁRIO</Text>
          <Text style={s.text}>{recipient}</Text>
          <Text style={s.text}>{order.address || 'Endereço não informado'}</Text>
          {!!order.delivery?.cep && <Text style={s.text}>CEP: {order.delivery.cep}</Text>}
          <Text style={s.section}>PRODUTOS</Text>
          {order.items.map(item => <View key={item.id} style={s.item}>
            <Text style={s.itemName}>{item.name}</Text><Text selectable style={s.text}>SKU: {item.id}</Text>
            <Text style={s.text}>{item.quantity} un × {currency(Math.round(item.price * 100))}</Text>
            <Text style={s.itemName}>{currency(Math.round(item.price * 100) * item.quantity)}</Text>
          </View>)}
          <Text style={s.section}>VALORES DA SIMULAÇÃO</Text>
          {totals.map(([label, value]) => <View key={label} style={s.row}><Text style={label === 'Total' ? s.itemName : s.text}>{label}</Text><Text style={label === 'Total' ? s.itemName : s.text}>{currency(value)}</Text></View>)}
          <Text style={s.section}>INFORMAÇÕES COMPLEMENTARES</Text>
          <Text style={s.text}>Documento demonstrativo gerado a partir dos dados do pedido. Sem cobrança, emissão fiscal ou autorização da SEFAZ. Tributos não calculados nesta simulação.</Text>
        </View>
        {!!error && <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text>}
        <Pressable accessibilityRole="button" onPress={() => void share()} style={s.share}><Text style={s.shareText}>Compartilhar nota fictícia (texto)</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

const createS = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  toolbar: { padding: 16, gap: 12, flexDirection: 'row', alignItems: 'center' },
  heading: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '600' },
  button: { padding: 14, minHeight: 48, backgroundColor: colors.elevated, borderRadius: 8 },
  buttonText: { color: colors.text, fontSize: 14 },
  content: { padding: 16, gap: 16, width: '100%', maxWidth: 640, alignSelf: 'center' },
  paper: { padding: 20, gap: 10, borderRadius: 10, backgroundColor: palette.offWhite },
  brand: { color: palette.deepGreen, fontSize: 26, fontWeight: '800' },
  title: { color: palette.carbonBlack, fontSize: 18, fontWeight: '700' },
  notice: { backgroundColor: palette.darkGreen, padding: 12, borderRadius: 6 },
  noticeText: { color: palette.pureWhite, fontSize: 13, fontWeight: '700' },
  text: { color: palette.carbonBlack, fontSize: 14, lineHeight: 21, flexShrink: 1 },
  section: { color: palette.deepGreen, fontSize: 13, fontWeight: '700', marginTop: 14 },
  item: {borderRadius: 24,  borderBottomWidth: 1, borderBottomColor: palette.lightGray, paddingVertical: 12, gap: 4 },
  itemName: { color: palette.carbonBlack, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  warning: { color: '#93000a', fontSize: 14, fontWeight: '700' },
  share: { padding: 16, minHeight: 48, backgroundColor: colors.primary, borderRadius: 8, alignItems: 'center' },
  shareText: { color: colors.onPrimary, fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
