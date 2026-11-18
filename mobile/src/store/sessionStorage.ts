import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';

const webSession = new Map<string, string>();
let writes = Promise.resolve();

export const sessionStorage: StateStorage = {
  async getItem(key) {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
        return webSession.get(key) ?? null;
      }
      const secured = await SecureStore.getItemAsync(key);
      const legacy = await AsyncStorage.getItem(key);
      if (legacy !== null) {
        if (secured === null) await SecureStore.setItemAsync(key, legacy);
        await AsyncStorage.removeItem(key);
      }
      return secured ?? legacy;
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    if (Platform.OS === 'web') {
      webSession.set(key, value);
      return;
    }
    writes = writes.then(() => SecureStore.setItemAsync(key, value)).catch(() => {
      // Keep the current session in memory if the device cannot persist it securely.
    });
    return writes;
  },
  removeItem(key) {
    if (Platform.OS === 'web') {
      webSession.delete(key);
      return;
    }
    writes = writes.then(() => SecureStore.deleteItemAsync(key)).catch(() => undefined);
    return writes;
  },
};
