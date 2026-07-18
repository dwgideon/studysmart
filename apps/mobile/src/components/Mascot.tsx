import { useCallback, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import type { Companion } from "@/lib/types";
import { colors, radii } from "@/theme";

export function Mascot({ companion, message, speechRate = 0.9, autoRead = false }: {
  companion: Companion;
  message: string;
  speechRate?: number;
  autoRead?: boolean;
}) {
  const speak = useCallback(async () => {
    await Haptics.selectionAsync().catch(() => undefined);
    Speech.stop();
    Speech.speak(message, { rate: Math.max(0.65, Math.min(1.1, speechRate)), pitch: 1.04 });
  }, [message, speechRate]);

  useEffect(() => {
    if (autoRead) {void speak();}
    return () => {Speech.stop();};
  }, [autoRead, speak]);

  return (
    <View style={styles.row}>
      <LinearGradient colors={[companion.accent, companion.color]} style={styles.orb}>
        <Text style={styles.emoji}>{companion.emoji}</Text>
      </LinearGradient>
      <View style={styles.bubble}>
        <Text style={styles.name}>{companion.name} the {companion.animal}</Text>
        <Text style={styles.message}>{message}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Hear ${companion.name} read this message`} onPress={speak} style={styles.listen}>
          <Text style={styles.listenText}>🔊 Hear the words</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  orb: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.55)" },
  emoji: { fontSize: 38 },
  bubble: { flex: 1, backgroundColor: "rgba(9,28,58,0.88)", borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, padding: 14 },
  name: { color: colors.cyan, fontWeight: "900", fontSize: 12, marginBottom: 5 },
  message: { color: colors.white, fontSize: 15, lineHeight: 21, fontWeight: "600" },
  listen: { marginTop: 10, alignSelf: "flex-start", paddingVertical: 7, paddingHorizontal: 10, backgroundColor: "rgba(38,217,243,0.12)", borderRadius: 12 },
  listenText: { color: colors.cyan, fontWeight: "800", fontSize: 12 },
});
