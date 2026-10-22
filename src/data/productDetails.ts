import { ImageSourcePropType } from 'react-native';
import { Product } from './products';
export type ProductDetails = {
  gallery: { image: ImageSourcePropType; label: string }[];
  seal: string; stage: string; description: string; applications: string[];
  metrics: { label: string; value: string }[];
  specs: [string, string][];
};
const g25: ProductDetails = {
  gallery: [
    { image: require('../../assets/products/g25-main.png'), label: 'Vista principal do Garrett G25-660' },
    { image: require('../../assets/products/g25-front.png'), label: 'Vista frontal do compressor' },
    { image: require('../../assets/products/g25-rear.png'), label: 'Carcaça da turbina' },
    { image: require('../../assets/products/g25-exploded.png'), label: 'Vista explodida do conjunto' },
    { image: require('../../assets/products/g25-engine.png'), label: 'Instalação no motor' },
  ],
  seal: '100% ORIGINAL GARRETT', stage: 'STAGE 3 / RACE READY',
  description: 'O conjunto rotativo Garrett G-Series G25-660 Super Core incorpora a mais avançada termodinâmica aerodinâmica de fluxo reverso da Garrett Motorsport. Projetado com rotor forjado usinado CNC em liga aeroespacial e turbina de Mar-M resistente a até 1050°C.',
  applications: ['VAG 2.0 TSI / TFSI (Gen 2 e Gen 3 EA888)', 'Honda K-Series (K20A / K24A VTEC Turbo)', 'VW / Audi 1.8T 20V Longitudinal & Transversal', 'BMW B48 / B58 Custom Twin Scroll Manifolds'],
  metrics: [{ label: 'POTÊNCIA SUPORTADA', value: '350 – 660 CV' }, { label: 'CILINDRADA IDEAL', value: '1.4L – 3.0L' }],
  specs: [['Rotor Compressor (Inducer/Exducer)', '54mm / 67mm'], ['Trim do Compressor', '65 Trim'], ['Rotor da Turbina (Exducer)', '49mm / 54mm (Mar-M)'], ['Carcaça de Escape (A/R)', '0.82 A/R Twin Scroll T4'], ['Mancal / Refrigeração', 'Ceramic Dual Ball Bearing']],
};
// Technical copy supplied by the design reference; this catalog is a local demo.
export function getProductDetails(product: Product): ProductDetails {
  if (product.images?.length || product.description || product.power || product.material || product.platforms?.length) return {
    gallery: product.images?.length ? product.images.map((uri, index) => ({ image: { uri }, label: `${product.name} • Foto ${index + 1}` })) : [{ image: product.image, label: product.name }],
    seal: 'SPEEDZONE / PERFORMANCE', stage: product.stage,
    description: product.description || product.name,
    applications: product.platforms?.length ? product.platforms : [product.fit],
    metrics: [{ label: 'POTÊNCIA SUPORTADA', value: product.power || 'Consulte' }, { label: 'CATEGORIA', value: product.category }],
    specs: [['Código da peça', product.id], ['Diâmetro', product.diameter || 'Não informado'], ['Material', product.material || 'Não informado']],
  };
  if (product.id === 'SZ-TUR-660-TS') return g25;
  return {
    gallery: [{ image: product.image, label: product.name }], seal: 'SPEEDZONE / PERFORMANCE', stage: product.stage,
    description: `${product.name}. Peça da linha ${product.category} do catálogo SpeedZone. Consulte a aplicação e confirme as especificações de montagem com seu preparador.`,
    applications: [product.fit], metrics: [{ label: 'CATEGORIA', value: product.category }, { label: 'PROJETO', value: product.stage }],
    specs: [['Código da peça', product.id], ['Aplicação informada', product.fit], ['Linha', product.category], ['Ficha completa', 'Em breve']],
  };
}
