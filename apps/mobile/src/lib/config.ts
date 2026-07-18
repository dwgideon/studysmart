import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as {
  apiUrl?: string;
  webUrl?: string;
  eas?: { projectId?: string };
} | undefined;

export const mobileConfig = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? extra?.apiUrl ?? "").replace(/\/$/, ""),
  webUrl: (process.env.EXPO_PUBLIC_WEB_URL ?? extra?.webUrl ?? "").replace(/\/$/, ""),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? extra?.eas?.projectId ?? "",
};

export const mobileConfigReady = Boolean(
  mobileConfig.apiUrl && mobileConfig.supabaseUrl && mobileConfig.supabaseAnonKey
);
