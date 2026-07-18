import { useLocalSearchParams } from "expo-router";
import { MultiplayerScreen } from "@/screens/MultiplayerScreen";

export default function MultiplayerCodeRoute() {
  const params = useLocalSearchParams<{ code?: string }>();
  return <MultiplayerScreen initialCode={params.code ?? ""} />;
}
