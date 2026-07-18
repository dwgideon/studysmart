import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, type ColorValue } from "react-native";
import { LoadingState } from "@/components/Ui";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/theme";

function icon(name: keyof typeof Ionicons.glyphMap) {
  return function TabBarIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color} size={size} />;
  };
}

export default function TabLayout() {
  const { session, loading } = useAuth();
  if (loading) {return <View style={{ flex: 1, backgroundColor: colors.ink }}><LoadingState /></View>;}
  if (!session) {return <Redirect href="/(auth)/sign-in" />;}
  return (
    <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { position: "absolute", height: 84, paddingTop: 8, paddingBottom: 18, backgroundColor: "rgba(2,12,30,0.96)", borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "800" },
      }}>
        <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("sparkles-outline") }} />
        <Tabs.Screen name="study" options={{ title: "Study", tabBarIcon: icon("layers-outline") }} />
        <Tabs.Screen name="tutor" options={{ title: "Tutor", tabBarIcon: icon("chatbubble-ellipses-outline") }} />
        <Tabs.Screen name="games" options={{ title: "Games", tabBarIcon: icon("game-controller-outline") }} />
        <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("person-circle-outline") }} />
    </Tabs>
  );
}
