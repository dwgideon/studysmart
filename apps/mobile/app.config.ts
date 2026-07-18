import type { ConfigContext, ExpoConfig } from "expo/config";

const buildExpoConfig = ({ config }: ConfigContext): ExpoConfig => {
  const domain = process.env.EXPO_PUBLIC_APP_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  return {
    ...config,
    name: "StudySmart",
    slug: "studysmart",
    owner: process.env.EXPO_OWNER,
    version: "1.0.0",
    orientation: "default",
    userInterfaceStyle: "dark",
    scheme: "studysmart",
    icon: "../../public/studysmart-logo.png",
    plugins: [
      "expo-router",
      "expo-font",
      ["expo-splash-screen", {
        image: "../../public/studysmart-logo.png",
        imageWidth: 240,
        resizeMode: "contain",
        backgroundColor: "#020817",
      }],
      ["expo-secure-store", { configureAndroidBackup: true }],
      ["expo-notifications", { defaultChannel: "learning" }],
      ["expo-image-picker", {
        cameraPermission: "StudySmart uses the camera only when you choose to photograph study material.",
        photosPermission: "StudySmart accesses only the study material you choose to upload.",
        microphonePermission: false,
      }],
      "expo-sqlite",
      "expo-status-bar",
    ],
    experiments: { typedRoutes: true },
    ios: {
      bundleIdentifier: "com.studysmart.learning",
      supportsTablet: true,
      associatedDomains: domain ? [`applinks:${domain}`] : [],
      infoPlist: {
        NSCameraUsageDescription: "StudySmart uses the camera only when you choose to add study material.",
        NSPhotoLibraryUsageDescription: "StudySmart accesses only the study material you choose to upload.",
        UIFileSharingEnabled: false,
      },
    },
    android: {
      package: "com.studysmart.learning",
      permissions: ["POST_NOTIFICATIONS"],
      adaptiveIcon: {
        foregroundImage: "../../public/studysmart-logo.png",
        backgroundColor: "#020817",
      },
      intentFilters: domain ? [{
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "https", host: domain, pathPrefix: "/" }],
        category: ["BROWSABLE", "DEFAULT"],
      }] : [],
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      webUrl: process.env.EXPO_PUBLIC_WEB_URL,
      eas: projectId ? { projectId } : undefined,
    },
  };
};

export default buildExpoConfig;
