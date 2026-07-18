import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { apiFetch } from "./api";
import { getInstallationId } from "./installation";
import { mobileConfig } from "./config";

export async function registerMobileDevice(requestPush: boolean) {
  if (Platform.OS === "web") {return { pushEnabled: false };}
  let pushToken: string | null | undefined;
  if (requestPush && Device.isDevice) {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("learning", {
        name: "Learning and safety",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
      await Notifications.setNotificationChannelAsync("safety", {
        name: "Urgent safety alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 150, 300],
      });
    }
    const current = await Notifications.getPermissionsAsync();
    const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
    if (permission.granted && mobileConfig.easProjectId) {
      pushToken = (await Notifications.getExpoPushTokenAsync({ projectId: mobileConfig.easProjectId })).data;
    }
  }
  return apiFetch<{ ok: true; device: { pushEnabled: boolean } }>("/api/mobile/device", {
    method: "POST",
    body: {
      installationId: await getInstallationId(),
      platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
      ...(requestPush ? { pushToken: pushToken ?? null } : {}),
      appVersion: Constants.expoConfig?.version ?? "development",
    },
  });
}

export async function revokeMobileDevice() {
  if (Platform.OS === "web") {return;}
  return apiFetch("/api/mobile/device", { method: "DELETE" });
}

export async function scheduleReviewReminder(nextReviewAt: string | null) {
  if (Platform.OS === "web") {return false;}
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(existing
    .filter((item) => item.content.data?.route === "/study")
    .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
  if (!nextReviewAt) {return false;}
  const date = new Date(nextReviewAt);
  if (date.getTime() <= Date.now() + 60_000) {return false;}
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) {return false;}
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Your next StudySmart review is ready",
      body: "A short practice session can help this learning stick.",
      data: { route: "/study" },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
  return true;
}
