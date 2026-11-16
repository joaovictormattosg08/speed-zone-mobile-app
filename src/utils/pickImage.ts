import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
export async function pickImage(source: 'camera' | 'library', profile = false) {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.8, allowsEditing: profile, ...(profile ? { aspect: [1, 1] as [number, number] } : {}) };
  if (source === 'library') return ImagePicker.launchImageLibraryAsync(options);
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error(permission.canAskAgain ? 'Autorize o acesso à câmera para tirar uma foto.' : 'A câmera está bloqueada. Autorize o acesso nas configurações do dispositivo ou escolha uma foto da galeria.');
  }
  return ImagePicker.launchCameraAsync(options);
}
