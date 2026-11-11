import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoreIcon } from '../components/StoreHeader';
import { useAuth } from '../context/AuthContext';
import { LegalDocument, legalDocuments, legalUpdatedAt } from '../data/legal';
import { colors as c, fonts as f } from '../theme/tokens';

export default function LegalScreen({ document }: { document: LegalDocument }) {
  const { user } = useAuth();
  const content = legalDocuments[document];
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(user ? '/(main)/account' : '/');
  }
  return <SafeAreaView style={s.safe}>
    <View style={s.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={goBack} style={s.back}><StoreIcon name="arrow-left" /></Pressable>
      <Text style={s.brand}>SPEEDZONE</Text>
    </View>
    <ScrollView contentContainerStyle={s.content}>
      <Text accessibilityRole="header" style={s.title}>{content.title}</Text>
      <Text style={s.body}>{content.description}</Text>
      <Text style={s.date}>Atualizado em {legalUpdatedAt}</Text>
      {content.sections.map(section => <View key={section.title} style={s.card}>
        <Text accessibilityRole="header" style={s.heading}>{section.title}</Text>
        <Text selectable style={s.body}>{section.text}</Text>
      </View>)}
      {user && <Pressable accessibilityRole="button" onPress={() => router.push('/support')} style={s.support}><StoreIcon name="headset" /><Text style={s.link}>Falar com o suporte</Text></Pressable>}
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 12, minHeight: 60 },
  back: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  brand: { color: c.primary, fontFamily: f.bold, fontSize: 14, letterSpacing: 1 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: 20, paddingBottom: 40, gap: 14 },
  title: { color: c.text, fontFamily: f.bold, fontSize: 28 },
  body: { color: c.muted, fontFamily: f.regular, fontSize: 14, lineHeight: 23 },
  date: { color: c.subtle, fontFamily: f.regular, fontSize: 12, marginBottom: 8 },
  card: { backgroundColor: c.panel, borderWidth: 1, borderColor: c.surfaceBorder, borderRadius: 10, padding: 16, gap: 10 },
  heading: { color: c.text, fontFamily: f.bold, fontSize: 16 },
  support: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  link: { color: c.primary, fontFamily: f.medium, fontSize: 14 },
});
