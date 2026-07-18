import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Body, ErrorState, Eyebrow, GlassCard, Heading, LoadingState, Metric, Pill, PrimaryButton, Screen } from "@/components/Ui";
import { Mascot } from "@/components/Mascot";
import { apiFetch } from "@/lib/api";
import { cacheJson, queuedMutationCount, readCachedJson, flushSyncQueue } from "@/lib/offline";
import type { ProfileStats, Recommendation, ReviewQueue } from "@/lib/types";
import { useExperience } from "@/providers/ExperienceProvider";
import { colors, radii, spacing } from "@/theme";

type Dashboard = { stats: ProfileStats; reviews: ReviewQueue; next: Recommendation };

export default function Home() {
  const { hub, loading: experienceLoading, elementary, refresh: refreshExperience } = useExperience();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [queued, setQueued] = useState(0);

  const load = useCallback(async () => {
    setError("");
    try {
      await flushSyncQueue();
      const [stats, reviews, next] = await Promise.all([
        apiFetch<ProfileStats>("/api/profile/stats"),
        apiFetch<ReviewQueue>("/api/review-queue"),
        apiFetch<Recommendation>("/api/learning/next"),
      ]);
      const dashboard = { stats, reviews, next };
      setData(dashboard);
      await cacheJson("dashboard", dashboard);
      await refreshExperience();
    } catch (cause) {
      const cached = await readCachedJson<Dashboard>("dashboard");
      if (cached) {setData(cached); setError("Showing your last synchronized progress.");}
      else {setError(cause instanceof Error ? cause.message : "Could not load your dashboard.");}
    } finally {
      setQueued(await queuedMutationCount());
      setLoading(false);
    }
  }, [refreshExperience]);

  useEffect(() => {load();}, [load]);
  useFocusEffect(useCallback(() => {queuedMutationCount().then(setQueued);}, []));

  if ((loading || experienceLoading) && !data) {return <Screen scroll={false}><LoadingState /></Screen>;}
  if (!data || !hub) {return <Screen><ErrorState message={error || "Your learning profile is not ready yet."} retry={load} /></Screen>;}
  const greeting = elementary
    ? `Hi ${hub.player.name}! I found ${data.reviews.dueNow} learning cards ready for us. We can read every word together.`
    : `${data.reviews.dueNow} reviews are ready. Your highest-value next move is ${data.next.recommendation.title.toLowerCase()}.`;

  return (
    <Screen>
      <View style={styles.topline}><View><Eyebrow>Learning command center</Eyebrow><Heading compact>Welcome back, {hub.player.name}.</Heading></View><Pill tone="mint">LEVEL {hub.player.level}</Pill></View>
      {elementary ? <Mascot companion={hub.experience.companion} message={greeting} speechRate={hub.experience.speechRate} autoRead={hub.experience.readAloud} /> : <GlassCard style={styles.signalCard}><Ionicons name="pulse" size={28} color={colors.cyan} /><View style={{ flex: 1 }}><Text style={styles.signalTitle}>Your next best move</Text><Text style={styles.signalBody}>{greeting}</Text></View></GlassCard>}
      {error ? <Text style={styles.offline}>{error}</Text> : null}
      {queued > 0 ? <View style={styles.sync}><Ionicons name="cloud-upload-outline" color={colors.gold} size={18} /><Text>{queued} offline answer{queued === 1 ? "" : "s"} waiting to synchronize</Text></View> : null}
      <View style={styles.metrics}><Metric value={data.reviews.dueNow} label="Ready now" /><Metric value={`${data.stats.mastery}%`} label="Mastery" accent={colors.mint} /><Metric value={data.stats.streak.currentStreak} label="Day streak" accent={colors.gold} /></View>
      <GlassCard style={styles.nextCard}>
        <View style={styles.nextHeader}><Pill>{data.next.recommendation.mode.replaceAll("_", " ")}</Pill><Text style={styles.confidence}>{data.next.recommendation.confidence ? `${data.next.recommendation.confidence}% confidence` : "Adaptive path"}</Text></View>
        <Text style={styles.nextTitle}>{data.next.recommendation.title}</Text>
        <Body muted>{data.next.recommendation.reason}</Body>
        <PrimaryButton label={data.reviews.dueNow ? `Review ${Math.min(data.reviews.dueNow, data.reviews.dailyLimit)} cards` : data.next.recommendation.actionLabel} onPress={() => router.push(data.reviews.dueNow ? "/(tabs)/study" : "/upload")} />
      </GlassCard>
      <View style={styles.actions}>
        <QuickAction icon="document-attach-outline" label="Add material" detail="Camera, files, notes" onPress={() => router.push("/upload")} />
        <QuickAction icon="chatbubble-ellipses-outline" label="Ask the tutor" detail="Grounded answers" onPress={() => router.push("/(tabs)/tutor")} />
        <QuickAction icon="game-controller-outline" label="Play & build" detail={`Earn Sparks · ${hub.player.sparks} saved`} onPress={() => router.push("/(tabs)/games")} />
      </View>
      <GlassCard>
        <View style={styles.progressHeader}><View><Eyebrow>Momentum</Eyebrow><Text style={styles.sectionTitle}>Your learning system</Text></View><Text style={styles.xp}>{data.stats.xp} XP</Text></View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${data.stats.xp % 100}%` }]} /></View>
        <View style={styles.smallMetrics}><Text>{data.stats.sessions} sessions</Text><Text>{data.stats.flashcards} cards</Text><Text>{data.stats.quizzes} quizzes</Text></View>
      </GlassCard>
    </Screen>
  );
}

function QuickAction({ icon, label, detail, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; detail: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quick, pressed && { opacity: 0.72 }]}><View style={styles.quickIcon}><Ionicons name={icon} size={23} color={colors.cyan} /></View><View style={{ flex: 1 }}><Text style={styles.quickLabel}>{label}</Text><Text style={styles.quickDetail}>{detail}</Text></View><Ionicons name="chevron-forward" color={colors.faint} size={20} /></Pressable>;
}

const styles = StyleSheet.create({
  topline: { marginTop: 8, gap: 12 },
  signalCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  signalTitle: { color: colors.cyan, fontWeight: "900", fontSize: 13 },
  signalBody: { color: colors.white, lineHeight: 21, marginTop: 3 },
  offline: { color: colors.gold, fontSize: 12, textAlign: "center" },
  sync: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 10, borderRadius: radii.medium, backgroundColor: "rgba(255,214,107,0.1)" },
  metrics: { flexDirection: "row", gap: 9 },
  nextCard: { gap: spacing.md, borderColor: "rgba(38,217,243,0.34)" },
  nextHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  confidence: { color: colors.faint, fontSize: 11, fontWeight: "700" },
  nextTitle: { color: colors.white, fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  actions: { gap: 9 },
  quick: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 13, padding: 13, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(8,31,68,0.7)" },
  quickIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(38,217,243,0.1)" },
  quickLabel: { color: colors.white, fontWeight: "900", fontSize: 16 },
  quickDetail: { color: colors.muted, fontSize: 12, marginTop: 3 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: colors.white, fontSize: 20, fontWeight: "900", marginTop: 3 },
  xp: { color: colors.gold, fontWeight: "900", fontSize: 17 },
  progressTrack: { height: 9, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 15, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 9, backgroundColor: colors.cyan },
  smallMetrics: { flexDirection: "row", justifyContent: "space-between" },
});
