import AsyncStorage from '@react-native-async-storage/async-storage';

export type SavedStore = { cart: Record<string, number>; favorites: string[] };
const pending = new Map<string, Promise<void>>();
const storageKey = (userId: string) => `speedzone.store.v1.${encodeURIComponent(userId)}`;

export async function loadStore(userId: string): Promise<SavedStore> {
  await pending.get(userId);
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) return { cart: {}, favorites: [] };
  const data = JSON.parse(raw);
  const cart = Object.fromEntries(Object.entries(data?.cart || {}).filter(([id, quantity]) => id && Number.isSafeInteger(quantity) && (quantity as number) > 0)) as Record<string, number>;
  const favorites = Array.isArray(data?.favorites) ? [...new Set<string>(data.favorites.filter((id: unknown) => typeof id === 'string' && id.length > 0))] : [];
  return { cart, favorites };
}

export function saveStore(userId: string, state: SavedStore): Promise<void> {
  // Serialize writes, including when the same account logs back in immediately.
  const write = (pending.get(userId) || Promise.resolve()).then(() => AsyncStorage.setItem(storageKey(userId), JSON.stringify(state)));
  const settled = write.catch(() => {});
  pending.set(userId, settled);
  void settled.then(() => { if (pending.get(userId) === settled) pending.delete(userId); });
  return write;
}
