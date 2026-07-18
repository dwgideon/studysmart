import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const INSTALLATION_KEY = "studysmart.installation-id";
let inMemoryId: string | null = null;

export async function getInstallationId() {
  if (inMemoryId) {return inMemoryId;}
  if (Platform.OS === "web") {
    const stored = typeof localStorage === "undefined" ? null : localStorage.getItem(INSTALLATION_KEY);
    inMemoryId = stored ?? `web_${Crypto.randomUUID().replaceAll("-", "")}`;
    if (typeof localStorage !== "undefined") {localStorage.setItem(INSTALLATION_KEY, inMemoryId);}
    return inMemoryId;
  }
  const stored = await SecureStore.getItemAsync(INSTALLATION_KEY);
  inMemoryId = stored ?? `device_${Crypto.randomUUID().replaceAll("-", "")}`;
  if (!stored) {
    await SecureStore.setItemAsync(INSTALLATION_KEY, inMemoryId, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  return inMemoryId;
}
