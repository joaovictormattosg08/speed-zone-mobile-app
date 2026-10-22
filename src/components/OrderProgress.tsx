import { StyleSheet, Text, View } from 'react-native';
import { OrderStatus, orderProgress, orderStages, statusLabels } from '../data/orderStatus';
import { colors as c, fonts as f } from '../theme/tokens';
export function OrderProgress({ status, expanded = false }: { status: OrderStatus; expanded?: boolean }) {
  const progress = orderProgress(status);
  if (progress.cancelled) return <Text accessibilityLiveRegion="polite" style={s.cancelled}>Pedido cancelado • acompanhamento encerrado</Text>;
  return <View style={s.container}>
    <View style={s.labels}>{orderStages.map((stage, index) => <Text key={stage} style={[s.label, index <= progress.index && s.green]}>{statusLabels[stage]}</Text>)}</View>
    <View accessibilityRole="progressbar" accessibilityLabel="Etapa do pedido" accessibilityValue={{ min: 0, max: 5, now: progress.completed, text: statusLabels[status] }} style={s.track}><View style={[s.fill, { width: `${progress.percent}%` }]} /></View>
    {expanded && <View style={s.events}>{orderStages.map((stage,index) => <View key={stage} style={s.row}><Text style={[s.marker,index <= progress.index && s.green]}>{index < progress.index ? '✓' : index === progress.index ? '●' : '○'}</Text><Text style={[s.title,index === progress.index && s.green]}>{statusLabels[stage]}</Text><Text style={s.note}>{index < progress.index ? 'Concluído' : index === progress.index ? 'Atual' : 'Aguardando'}</Text></View>)}</View>}
  </View>;
}
const s = StyleSheet.create({ container:{gap:10,marginVertical:6},labels:{flexDirection:'row',justifyContent:'space-between',gap:4},label:{fontFamily:f.medium,fontSize:9,color:c.subtle},green:{color:c.primary},track:{height:5,backgroundColor:c.elevated,borderRadius:4,overflow:'hidden'},fill:{height:'100%',backgroundColor:c.primary,borderRadius:4},events:{gap:14,marginTop:12},row:{flexDirection:'row',alignItems:'center',gap:10},marker:{color:c.subtle,fontSize:18,width:22},title:{flex:1,color:c.text,fontFamily:f.medium,fontSize:13},note:{color:c.subtle,fontFamily:f.regular,fontSize:11},cancelled:{color:c.error,fontFamily:f.medium,fontSize:13,lineHeight:20} });
