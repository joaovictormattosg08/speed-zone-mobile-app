export type DeliveryAddress = { recipient: string; phone: string; cep: string; street: string; number: string; complement: string; district: string; city: string; state: string; reference: string };
export const brazilStates = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
export function addressError(a: DeliveryAddress): string | null {
  if (!a || typeof a !== 'object') return 'Endereço inválido.';
  const limits: Record<keyof DeliveryAddress, number> = { recipient: 140, phone: 20, cep: 8, street: 120, number: 20, complement: 80, district: 80, city: 80, state: 2, reference: 150 };
  for (const key of Object.keys(limits) as (keyof DeliveryAddress)[]) if (typeof a[key] !== 'string' || a[key].length > limits[key]) return 'Confira os campos do endereço.';
  if (a.recipient.trim().length < 3 || !/^\d{8}$/.test(a.cep) || /^(\d)\1{7}$/.test(a.cep)) return 'Informe o destinatário e um CEP válido com 8 dígitos.';
  if (![a.street, a.number, a.district, a.city].every(value => value.trim()) || !brazilStates.includes(a.state)) return 'Preencha rua, número (ou S/N), bairro, cidade e UF.';
  if (a.phone && !/^\d{10,11}$/.test(a.phone.replace(/\D/g, ''))) return 'Informe telefone com DDD (10 ou 11 dígitos).';
  return null;
}
export function formatAddress(a: DeliveryAddress) { return `${a.street}, ${a.number}${a.complement ? ' • ' + a.complement : ''} • ${a.district}, ${a.city} - ${a.state} • CEP ${a.cep.slice(0, 5)}-${a.cep.slice(5)}`; }
