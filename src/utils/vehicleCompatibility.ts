import type { PilotCar } from '../context/AuthContext';
import type { Product } from '../data/products';

const normalize = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ');

export function matchesVehicle(product: Product, car: PilotCar): boolean {
  const model = normalize(car.model);
  const engine = normalize(car.engine);
  const modelAndYear = car.year.trim() ? normalize(`${car.model} ${car.year}`) : '';
  const applications = product.platforms?.map(normalize).filter(Boolean) ?? [];
  if (applications.length) {
    return applications.some(application => [model, modelAndYear, engine].includes(application));
  }

  // The demo catalog already declares these two engine applications.
  if (product.id === 'SZ-TUR-042') return /\bea888\b/.test(engine);
  if (product.id === 'SZ-ELT-220') return /^2[.,]0\s+t(?:f)?si\b/.test(engine);
  return false;
}
