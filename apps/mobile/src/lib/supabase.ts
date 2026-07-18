import "react-native-url-polyfill/auto";
import { AppState, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createClient, processLock } from "@supabase/supabase-js";
import { mobileConfig } from "./config";

const webStorage = {
  getItem: async (key: string) => typeof localStorage === "undefined" ? null : localStorage.getItem(key),
  setItem: async (key: string, value: string) => { if (typeof localStorage !== "undefined") {localStorage.setItem(key, value);} },
  removeItem: async (key: string) => { if (typeof localStorage !== "undefined") {localStorage.removeItem(key);} },
};

const nativeStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  }),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  mobileConfig.supabaseUrl || "https://configuration-required.invalid",
  mobileConfig.supabaseAnonKey || "configuration-required",
  {
    auth: {
      storage: Platform.OS === "web" ? webStorage : nativeStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  }
);

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {supabase.auth.startAutoRefresh();}
    else {supabase.auth.stopAutoRefresh();}
  });
}
