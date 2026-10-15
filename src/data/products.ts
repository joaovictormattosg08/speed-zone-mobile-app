import { ImageSourcePropType } from 'react-native';
export type Product = { id: string; name: string; price: number; oldPrice?: number; image: ImageSourcePropType; category: string; stage: string; badge: string; tone: string; fit: string };
export const products: Product[] = [
  { id: 'SZ-TUR-660-TS', name: 'Turbocompressor Billet Garrett G25-660 Twin Scroll T4 .82 A/R', price: 7890, image: require('../../assets/products/g25-main.png'), category: 'Turbo', stage: 'STAGE 3', badge: 'RACE READY', tone: '#164535', fit: 'Projetos customizados' },
  { id: 'SZ-TUR-042', name: 'Turbocompressor Garrett GT2871R Ball Bearing', price: 4850, image: require('../../assets/store/turbo.png'), category: 'Turbo', stage: 'STAGE 2+', badge: 'MAIS VENDIDO', tone: '#e29100', fit: 'Compatível EA888' },
  { id: 'SZ-INT-108', name: 'Kit Intercooler Frontal Alumínio Billet Racing', price: 2390, image: require('../../assets/store/intercooler.png'), category: 'Cooling', stage: 'STAGE 2+', badge: 'PRONTA ENTREGA', tone: '#164535', fit: 'Universal Fit' },
  { id: 'SZ-ELT-220', name: 'Bobinas de Ignição R8 Red Edition (4 un)', price: 799, oldPrice: 890, image: require('../../assets/store/coils.png'), category: 'Eletrônica', stage: 'STAGE 1', badge: '-10% OFF', tone: '#93000a', fit: 'TSI / TFSI 2.0' },
  { id: 'SZ-BRK-512', name: 'Kit Freios Big Brake 6 Pistões 355mm', price: 6200, image: require('../../assets/store/brakes.png'), category: 'Freios', stage: 'TRACK DAY', badge: 'TRACK SPEC', tone: '#00a6e0', fit: 'Furação 5x112' },
  { id: 'SZ-ACC-015', name: 'Mangote Pressurização 3"', price: 145, image: require('../../assets/store/coupler.png'), category: 'Admissão', stage: 'STAGE 2+', badge: 'SILICONE', tone: '#323538', fit: 'Silicone · 4 camadas' },
];
export const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const categories = [
  ['Motor', 'engine-outline'], ['Turbo', 'fan'], ['Admissão', 'gas-station-outline'], ['Escape', 'weather-windy'],
  ['Eletrônica', 'memory'], ['Câmbio', 'car-shift-pattern'], ['Suspensão', 'arrow-expand-vertical'], ['Freios', 'disc'],
  ['Cooling', 'snowflake'], ['Rodas/Pneus', 'tire'], ['Iluminação', 'lightbulb-outline'], ['Kits Stage', 'tools'],
] as const;


