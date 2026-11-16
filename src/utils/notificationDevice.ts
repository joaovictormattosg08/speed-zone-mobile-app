import AsyncStorage from '@react-native-async-storage/async-storage';
let pending: Promise<string> | undefined;
// An installation identifier, never an authentication credential.
export function notificationDevice(): Promise<string> {
  if (!pending) pending = (async () => {
    const key = 'speedzone.notification-device';
    const saved = await AsyncStorage.getItem(key);
    if (saved) return saved;
    const id = 'device-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    await AsyncStorage.setItem(key, id);
    return id;
  })().catch(error => { pending = undefined; throw error; });
  return pending;
}
