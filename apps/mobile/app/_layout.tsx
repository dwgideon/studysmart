import "react-native-gesture-handler";
import "react-native-reanimated";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/providers/AuthProvider";
import { ExperienceProvider } from "@/providers/ExperienceProvider";
import { colors } from "@/theme";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function NavigationEvents() {
  const router = useRouter();
  useEffect(() => {
    const openRoute = (route: unknown) => {
      if (route === "/safety-alerts") {router.push("/safety-alerts");}
      else if (route === "/study") {router.push("/(tabs)/study");}
    };
    Notifications.getLastNotificationResponseAsync().then((response) => {
      openRoute(response?.notification.request.content.data?.route);
      if (response) {return Notifications.clearLastNotificationResponseAsync();}
    }).catch(() => undefined);
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openRoute(response.notification.request.content.data?.route);
    });
    return () => subscription.remove();
  }, [router]);
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ink }}>
      <AuthProvider>
        <ExperienceProvider>
          <StatusBar style="light" />
          <NavigationEvents />
          <Stack screenOptions={{
          headerStyle: { backgroundColor: colors.deep },
          headerTintColor: colors.white,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.ink },
          animation: "slide_from_right",
        }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="upload" options={{ title: "Add study material", presentation: "modal" }} />
          <Stack.Screen name="game" options={{ title: "Learning mission", presentation: "fullScreenModal" }} />
          <Stack.Screen name="multiplayer" options={{ title: "Live mastery arena", presentation: "fullScreenModal" }} />
          <Stack.Screen name="safety-alerts" options={{ title: "Safety alerts" }} />
          </Stack>
        </ExperienceProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
