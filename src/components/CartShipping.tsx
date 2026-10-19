import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ShippingChoice, shippingOptions } from '../utils/cartPricing';
import { StoreIcon } from './StoreHeader';
import { money } from '../data/products';
import { colors as c, fonts as f } from '../theme/tokens';

export function CartShipping({ subtotal, selected, onSelect }: { subtotal: number; selected: ShippingChoice | null; onSelect: (value: ShippingChoice | null) => void }) {
  const [cep, setCep] = useState(selected?.cep || '');
  const [calculated, setCalculated] = useState(selected?.cep || '');
  const [error, setError] = useState('');
  const options = shippingOptions(calculated, subtotal);
  function calculate() {
    if (!shippingOptions(cep, subtotal).length) { setError('Informe um CEP com 8 dígitos válidos.'); return; }
    setCalculated(cep); setError('');
  }
  return <View style={s.panel}>
    <View style={s.heading}><StoreIcon name="truck-delivery-outline" size={22} /><Text style={s.title}>Calcular Frete e Prazo</Text><Text style={s.badge}>SIMULAÇÃO</Text></View>
    <Text style={s.body}>Informe seu CEP e escolha como receber as peças.</Text>
    <View style={s.row}><TextInput accessibilityLabel="CEP para calcular frete" placeholder="00000-000" placeholderTextColor={c.subtle} value={cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep} onChangeText={value => { setCep(value.replace(/\D/g, '').slice(0, 8)); setCalculated(''); setError(''); onSelect(null); }} keyboardType="number-pad" maxLength={9} style={s.input} returnKeyType="done" onSubmitEditing={calculate} /><Pressable accessibilityRole="button" onPress={calculate} style={s.calculate}><Text style={s.calculateText}>CALCULAR</Text></Pressable></View>
    {error !== '' && <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>}
    {options.length > 0 && <><Text accessibilityLiveRegion="polite" style={s.body}>Opções para {calculated.slice(0, 5)}-{calculated.slice(5)}</Text><View accessibilityRole="radiogroup" accessibilityLabel="Opções de entrega" style={{ gap: 8 }}>{options.map(option => {
      const checked = selected?.service === option.service && selected.cep === option.cep;
      return <Pressable key={option.service} accessibilityRole="radio" accessibilityLabel={`${option.label}, ${option.days}, ${option.price ? money(option.price / 100) : 'grátis'}`} accessibilityState={{ checked }} onPress={() => onSelect({ cep: option.cep, service: option.service })} style={[s.option, checked && s.selected]}><StoreIcon name={checked ? 'radiobox-marked' : 'radiobox-blank'} color={checked ? c.primary : c.subtle} /><View style={{ flex: 1 }}><Text style={s.optionTitle}>{option.label}</Text><Text style={s.body}>{option.days}</Text></View><Text style={s.price}>{option.price ? money(option.price / 100) : 'GRÁTIS'}</Text></Pressable>;
    })}</View>{!selected && <Text style={s.body}>Selecione uma opção para atualizar o total.</Text>}</>}
    <Text style={s.note}>Valores e prazos ilustrativos por faixa de CEP. A existência do CEP e a cobertura de entrega não são consultadas. Frete grátis a partir de R$ 6.500 em produtos.</Text>
  </View>;
}
const s = StyleSheet.create({ panel: { backgroundColor: c.input, padding: 14, borderRadius: 9, gap: 12 }, heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 }, title: { color: c.text, fontFamily: f.medium, fontSize: 15, flexGrow: 1 }, badge: { color: c.primary, fontFamily: f.bold, fontSize: 9, backgroundColor: '#203b32', padding: 4, borderRadius: 3 }, body: { color: c.muted, fontFamily: f.regular, fontSize: 12, lineHeight: 18 }, row: { flexDirection: 'row', gap: 8 }, input: { minWidth: 0, flex: 1, height: 48, borderRadius: 4, backgroundColor: c.elevated, color: c.text, fontFamily: f.medium, paddingHorizontal: 12, fontSize: 15 }, calculate: { backgroundColor: c.primary, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 4, minHeight: 48 }, calculateText: { color: c.onPrimary, fontFamily: f.bold, fontSize: 12 }, option: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: c.elevated, backgroundColor: c.panel, padding: 12, borderRadius: 6, minHeight: 76 }, selected: { borderColor: c.primary, backgroundColor: '#172d25' }, optionTitle: { color: c.text, fontFamily: f.medium, fontSize: 13 }, price: { color: c.primary, fontFamily: f.bold, fontSize: 14 }, note: { color: c.subtle, fontFamily: f.regular, fontSize: 10, lineHeight: 15 }, error: { color: c.error, fontFamily: f.regular, fontSize: 12 } });
