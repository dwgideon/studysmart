import { useCallback, useEffect, useState } from "react";
import { Alert, AppState, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";
import type { SafetyAlert } from "@/lib/types";
import { Body, ErrorState, Eyebrow, GlassCard, Heading, LoadingState, Pill, PrimaryButton, Screen, SecondaryButton } from "@/components/Ui";
import { colors, spacing } from "@/theme";

export default function SafetyAlertsScreen() {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exact, setExact] = useState<{ id: string; content: string } | null>(null);
  const load = useCallback(async () => {
    setError("");
    try {const data = await apiFetch<{ alerts: SafetyAlert[]; unreadCount: number }>("/api/safety/notifications"); setAlerts(data.alerts); setUnread(data.unreadCount);}
    catch (cause) {setError(cause instanceof Error ? cause.message : "Safety alerts could not load.");}
    finally {setLoading(false);}
  }, []);
  useEffect(() => {void load(); return () => setExact(null);}, [load]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {setExact(null);}
    });
    return () => subscription.remove();
  }, []);

  const action = async (notificationId: string, nextAction: "mark-reviewed" | "acknowledge-response" | "reveal") => {
    try {
      const result = await apiFetch<{ exactAttempt?: string }>("/api/safety/notifications", { method: "POST", body: { notificationId, action: nextAction } });
      if (nextAction === "reveal" && result.exactAttempt) {setExact({ id: notificationId, content: result.exactAttempt });}
      else {await load();}
    } catch (cause) {Alert.alert("Protected alert", cause instanceof Error ? cause.message : "This action could not be completed.");}
  };

  if (loading) {return <Screen><LoadingState label="Loading protected safety alerts…" /></Screen>;}
  return (
    <Screen>
      <View style={styles.header}><View><Eyebrow>Protected adult view</Eyebrow><Heading compact>Safety alerts</Heading></View>{unread > 0 && <Pill tone="gold">{unread} unread</Pill>}</View>
      <GlassCard style={styles.privacy}><Ionicons name="lock-closed" color={colors.mint} size={25} /><View style={{ flex: 1 }}><Text style={styles.privacyTitle}>Sensitive by design</Text><Body muted>Push notifications contain only generic wording. Exact learner text is revealed here only after a recent sign-in and is never cached on this device.</Body></View></GlassCard>
      {error && <ErrorState message={error} retry={load} />}
      {!error && alerts.length === 0 && <GlassCard><Heading compact>No alerts to review</Heading><Body muted>New safety notifications for learners connected to this verified adult account will appear here.</Body></GlassCard>}
      {alerts.map((item) => {
        const crisis = item.category === "SELF_HARM" || item.category === "SUICIDE";
        return <GlassCard key={item.id} style={[styles.alert, crisis && styles.crisis]}><View style={styles.alertTop}><Pill tone={crisis ? "gold" : "violet"}>{item.category.replaceAll("_", " ")}</Pill><Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text></View><Text style={styles.learner}>{item.learner.name || "Connected learner"}</Text><Body>Attempt {item.attemptNumber} · {item.source.replaceAll("_", " ").toLowerCase()}</Body>{crisis && <Text style={styles.crisisText}>Treat self-harm alerts as urgent. Contact the learner and a qualified professional or emergency service if danger may be immediate.</Text>}{item.lockedUntil && <Text style={styles.locked}>Learning locked until {new Date(item.lockedUntil).toLocaleDateString()}</Text>}{exact?.id === item.id && <View style={styles.exact}><Text style={styles.exactLabel}>Exact attempted content</Text><Text selectable style={styles.exactText}>{exact.content}</Text><SecondaryButton label="Hide sensitive detail" onPress={() => setExact(null)} /></View>}<View style={styles.actions}><SecondaryButton label={item.readAt ? "Reviewed" : "Mark reviewed"} disabled={Boolean(item.readAt)} onPress={() => action(item.id, "mark-reviewed")} /><SecondaryButton label={item.acknowledgedAt ? "Response acknowledged" : "Acknowledge response"} disabled={Boolean(item.acknowledgedAt)} onPress={() => action(item.id, "acknowledge-response")} /><PrimaryButton label="Reveal exact attempt" onPress={() => action(item.id, "reveal")} /></View></GlassCard>;
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm }, privacy: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderColor: "rgba(90,242,194,0.35)" }, privacyTitle: { color: colors.mint, fontWeight: "900", fontSize: 17, marginBottom: 4 }, alert: { gap: spacing.sm }, crisis: { borderColor: "rgba(255,214,107,0.5)" }, alertTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }, date: { color: colors.faint, fontSize: 11 }, learner: { color: colors.white, fontWeight: "900", fontSize: 21 }, crisisText: { color: colors.gold, lineHeight: 20, fontWeight: "700" }, locked: { color: colors.danger, fontWeight: "800" }, actions: { gap: 8, marginTop: 5 }, exact: { padding: 14, gap: 8, backgroundColor: "rgba(255,107,138,0.08)", borderWidth: 1, borderColor: "rgba(255,107,138,0.38)", borderRadius: 14 }, exactLabel: { color: colors.danger, fontWeight: "900", textTransform: "uppercase", fontSize: 11 }, exactText: { color: colors.white, lineHeight: 21 },
});
