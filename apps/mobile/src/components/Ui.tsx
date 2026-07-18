import type { PropsWithChildren, ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing } from "@/theme";

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const content = <View style={styles.content}>{children}</View>;
  return (
    <LinearGradient colors={[colors.ink, "#041733", "#061e3f"]} style={styles.background}>
      <View pointerEvents="none" style={styles.orbOne} />
      <View pointerEvents="none" style={styles.orbTwo} />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        {scroll ? <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
      </SafeAreaView>
    </LinearGradient>
  );
}

export function GlassCard({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Heading({ children, compact = false }: PropsWithChildren<{ compact?: boolean }>) {
  return <Text style={[styles.heading, compact && styles.headingCompact]}>{children}</Text>;
}

export function Body({ children, muted = false }: PropsWithChildren<{ muted?: boolean }>) {
  return <Text style={[styles.body, muted && styles.bodyMuted]}>{children}</Text>;
}

export function Pill({ children, tone = "blue" }: PropsWithChildren<{ tone?: "blue" | "mint" | "gold" | "violet" }>) {
  const tones = { blue: colors.blueBright, mint: colors.mint, gold: colors.gold, violet: colors.violet };
  return <View style={[styles.pill, { borderColor: `${tones[tone]}66`, backgroundColor: `${tones[tone]}16` }]}><Text style={[styles.pillText, { color: tones[tone] }]}>{children}</Text></View>;
}

export function PrimaryButton({ label, onPress, disabled, icon, accessibilityLabel }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.buttonWrap, pressed && styles.pressed, disabled && styles.disabled]}>
      <LinearGradient colors={[colors.blue, colors.blueBright, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
        {disabled ? <ActivityIndicator color={colors.white} /> : icon}
        <Text style={styles.buttonText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.secondary, pressed && styles.pressed, disabled && styles.disabled]}><Text style={styles.secondaryText}>{label}</Text></Pressable>;
}

export function Metric({ value, label, accent = colors.cyan }: { value: string | number; label: string; accent?: string }) {
  return <View style={styles.metric}><Text style={[styles.metricValue, { color: accent }]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

export function LoadingState({ label = "Synchronizing your learning world…" }: { label?: string }) {
  return <View style={styles.state}><ActivityIndicator color={colors.cyan} size="large" /><Text style={styles.stateText}>{label}</Text></View>;
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <GlassCard style={styles.errorCard}><Text style={styles.errorTitle}>Let’s reconnect</Text><Text style={styles.errorText}>{message}</Text>{retry && <SecondaryButton label="Try again" onPress={retry} />}</GlassCard>;
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing.md, paddingBottom: 120, gap: spacing.md },
  orbOne: { position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: "rgba(38,217,243,0.08)", top: -80, right: -90 },
  orbTwo: { position: "absolute", width: 320, height: 320, borderRadius: 160, backgroundColor: "rgba(40,124,255,0.08)", bottom: 80, left: -180 },
  card: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: radii.large, padding: spacing.lg, overflow: "hidden" },
  eyebrow: { color: colors.cyan, fontSize: 12, fontWeight: "800", letterSpacing: 1.8, textTransform: "uppercase" },
  heading: { color: colors.white, fontSize: 34, lineHeight: 39, fontWeight: "900", letterSpacing: -1.2 },
  headingCompact: { fontSize: 26, lineHeight: 31 },
  body: { color: colors.white, fontSize: 16, lineHeight: 24 },
  bodyMuted: { color: colors.muted },
  pill: { alignSelf: "flex-start", borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 11, paddingVertical: 6 },
  pillText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  buttonWrap: { borderRadius: radii.medium, overflow: "hidden" },
  button: { minHeight: 56, paddingHorizontal: 20, paddingVertical: 15, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, borderRadius: radii.medium },
  buttonText: { color: colors.white, fontWeight: "900", fontSize: 16 },
  secondary: { minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(22,66,120,0.38)" },
  secondaryText: { color: colors.white, fontWeight: "800", fontSize: 15 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
  metric: { flex: 1, minWidth: 82, padding: 14, borderRadius: radii.medium, backgroundColor: "rgba(5,20,45,0.52)", borderWidth: 1, borderColor: "rgba(120,190,255,0.14)" },
  metricValue: { fontSize: 25, fontWeight: "900" },
  metricLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 3 },
  state: { flex: 1, minHeight: 360, alignItems: "center", justifyContent: "center", gap: 16 },
  stateText: { color: colors.muted, fontSize: 15, textAlign: "center" },
  errorCard: { borderColor: "rgba(255,107,138,0.38)", gap: 10 },
  errorTitle: { color: colors.danger, fontSize: 20, fontWeight: "900" },
  errorText: { color: colors.white, lineHeight: 22 },
});
