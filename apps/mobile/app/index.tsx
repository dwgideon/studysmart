import { Redirect } from "expo-router";
import { View } from "react-native";
import { LoadingState } from "@/components/Ui";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/theme";

export default function Index() {
  const { session, loading } = useAuth();
  if (loading) {return <View style={{ flex: 1, backgroundColor: colors.ink }}><LoadingState /></View>;}
  return <Redirect href={session ? "/(tabs)" : "/(auth)/sign-in"} />;
}
