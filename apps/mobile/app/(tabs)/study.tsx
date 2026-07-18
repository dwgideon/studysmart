import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { apiFetch, ApiError } from "@/lib/api";
import { cacheStudySession, clearCachedStudySession, flushSyncQueue, queueApiMutation, queuedMutationCount, queueStudyReview, readCachedStudySession } from "@/lib/offline";
import type { ReviewQueue, StudySession } from "@/lib/types";
import { scheduleReviewReminder } from "@/lib/device";
import { useExperience } from "@/providers/ExperienceProvider";
import { Body, ErrorState, Eyebrow, GlassCard, Heading, LoadingState, Metric, Pill, PrimaryButton, Screen, SecondaryButton } from "@/components/Ui";
import { Mascot } from "@/components/Mascot";
import { colors, radii, spacing } from "@/theme";

const ratings = [
  { value: 1, label: "Again", color: colors.danger },
  { value: 2, label: "Hard", color: colors.gold },
  { value: 3, label: "Good", color: colors.mint },
  { value: 4, label: "Easy", color: colors.cyan },
] as const;

export default function StudyScreen() {
  const { hub, elementary, refresh: refreshExperience } = useExperience();
  const [session, setSession] = useState<StudySession | null>(null);
  const [queue, setQueue] = useState<ReviewQueue | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);
  const [complete, setComplete] = useState<{ xp: number; offline: boolean } | null>(null);
  const shownAt = useRef(Date.now());

  const loadQueue = useCallback(async () => {
    try {
      const result = await apiFetch<ReviewQueue>("/api/review-queue");
      setQueue(result);
      await scheduleReviewReminder(result.nextReviewAt).catch(() => false);
    } catch { /* queue is supplementary */ }
  }, []);

  useFocusEffect(useCallback(() => {
    void Promise.all([loadQueue(), queuedMutationCount().then(setPending)]);
  }, [loadQueue]));

  useEffect(() => {setLoading(false);}, []);

  const start = async () => {
    setBusy(true); setError(""); setComplete(null);
    try {
      await flushSyncQueue();
      const next = await apiFetch<StudySession>("/api/study/start", { method: "POST", body: {} });
      await cacheStudySession(next);
      setSession(next); setIndex(0); setRevealed(false); setOffline(false); shownAt.current = Date.now();
    } catch (cause) {
      const permanent = cause instanceof ApiError && cause.status >= 400 && cause.status < 500 && cause.status !== 408;
      if (permanent) {
        setError(cause.message);
        setBusy(false); setLoading(false);
        return;
      }
      const cached = await readCachedStudySession();
      if (cached?.cards.length) {
        setSession(cached); setIndex(0); setRevealed(false); setOffline(true); shownAt.current = Date.now();
      } else {
        setError(cause instanceof Error ? cause.message : "No review session is available yet.");
      }
    } finally {setBusy(false); setLoading(false);}
  };

  const finish = async (active: StudySession) => {
    let earned = 0;
    let savedOffline = false;
    try {
      const result = await apiFetch<{ xpEarned: number }>("/api/study/complete", { method: "POST", body: { sessionId: active.sessionId } });
      earned = result.xpEarned;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status >= 400 && cause.status < 500 && cause.status !== 408) {throw cause;}
      await queueApiMutation("/api/study/complete", "POST", { sessionId: active.sessionId }, `complete_${active.sessionId}`);
      savedOffline = true;
    }
    setComplete({ xp: earned, offline: savedOffline });
    await clearCachedStudySession();
    setSession(null);
    setPending(await queuedMutationCount());
    await Promise.all([loadQueue(), refreshExperience()]);
  };

  const rate = async (rating: 1 | 2 | 3 | 4) => {
    if (!session) {return;}
    const card = session.cards[index];
    if (!card) {setError("This study card is unavailable."); return;}
    setBusy(true); setError("");
    const payload = { cardId: card.id, sessionId: session.sessionId, correct: rating > 1, rating, responseTimeMs: Date.now() - shownAt.current, hintCount: 0 };
    try {
      try {
        await apiFetch("/api/study/review", { method: "POST", body: payload });
      } catch (cause) {
        if (cause instanceof ApiError && cause.status >= 400 && cause.status < 500 && cause.status !== 408) {throw cause;}
        await queueStudyReview(payload);
        setOffline(true);
      }
      await Haptics.notificationAsync(rating > 1 ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
      if (index + 1 >= session.cards.length) {await finish(session);}
      else {setIndex((value) => value + 1); setRevealed(false); shownAt.current = Date.now();}
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Your answer could not be saved.";
      setError(message);
      Alert.alert("Study paused", message);
    } finally {setBusy(false);}
  };

  if (loading) {return <Screen><LoadingState label="Preparing your review path…" /></Screen>;}
  const card = session?.cards[index];
  const mascotMessage = card ? (revealed ? `The answer is: ${card.answer}` : card.question) : "When you are ready, I’ll guide you through the cards that will help your learning stick.";

  return (
    <Screen>
      <View style={styles.topline}><View><Eyebrow>Memory lab</Eyebrow><Heading compact>Smart review</Heading></View>{pending > 0 && <Pill tone="gold">{pending} waiting to sync</Pill>}</View>
      {hub && elementary && <Mascot companion={hub.experience.companion} message={mascotMessage} speechRate={hub.experience.speechRate} autoRead={Boolean(card && hub.experience.readAloud)} />}
      {!session && !complete && <>
        <GlassCard style={styles.metrics}><Metric value={queue?.dueNow ?? "—"} label="Due now" /><Metric value={queue?.dueTomorrow ?? "—"} label="Due tomorrow" accent={colors.violet} /><Metric value={queue?.dailyLimit ?? 20} label="Daily target" accent={colors.gold} /></GlassCard>
        {error && <ErrorState message={error} retry={start} />}
        <GlassCard style={styles.launch}><Ionicons name="layers" color={colors.cyan} size={42} /><Heading compact>{queue?.dueNow ? `${queue.dueNow} memories are ready` : "Strengthen what you know"}</Heading><Body muted>Review timing adapts after every answer. Downloaded cards remain available if your connection drops.</Body><PrimaryButton label={busy ? "Preparing…" : "Start smart review"} disabled={busy} onPress={start} icon={<Ionicons name="play" color={colors.white} size={18} />} /></GlassCard>
      </>}
      {complete && <GlassCard style={styles.complete}><Text style={styles.completeIcon}>✦</Text><Heading compact>Learning locked in</Heading><Body>{complete.offline ? "Your work is saved on this device and will sync automatically." : `Your progress is synced${complete.xp ? `, with ${complete.xp} XP earned` : ""}.`}</Body><PrimaryButton label="Review another set" onPress={start} /><SecondaryButton label="I’m done for now" onPress={() => setComplete(null)} /></GlassCard>}
      {session && card && <GlassCard style={styles.card}>
        <View style={styles.cardMeta}><Pill tone={offline ? "gold" : "blue"}>{offline ? "Offline-ready" : "Connected"}</Pill><Text style={styles.counter}>{index + 1} / {session.cards.length}</Text></View>
        <Text style={styles.question}>{card.question}</Text>
        {!revealed ? <PrimaryButton label="Reveal answer" onPress={() => {setRevealed(true); void Haptics.selectionAsync();}} /> : <>
          <View style={styles.answer}><Text style={styles.answerLabel}>Answer</Text><Text style={styles.answerText}>{card.answer}</Text></View>
          <Text style={styles.ratePrompt}>How well did you remember it?</Text>
          <View style={styles.ratings}>{ratings.map((item) => <Pressable key={item.value} disabled={busy} accessibilityRole="button" accessibilityLabel={`Rate ${item.label}`} onPress={() => rate(item.value)} style={({ pressed }) => [styles.rating, { borderColor: `${item.color}88` }, pressed && { opacity: 0.7 }]}><Text style={[styles.ratingText, { color: item.color }]}>{item.label}</Text></Pressable>)}</View>
        </>}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      </GlassCard>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topline: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm },
  metrics: { flexDirection: "row", gap: spacing.sm, padding: spacing.sm },
  launch: { gap: spacing.md, paddingVertical: spacing.xl },
  card: { gap: spacing.lg, minHeight: 430, justifyContent: "center" },
  cardMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  counter: { color: colors.muted, fontWeight: "800" },
  question: { color: colors.white, fontWeight: "900", fontSize: 25, lineHeight: 34 },
  answer: { padding: spacing.lg, borderRadius: radii.medium, backgroundColor: "rgba(90,242,194,0.08)", borderWidth: 1, borderColor: "rgba(90,242,194,0.35)", gap: 8 },
  answerLabel: { color: colors.mint, fontSize: 11, textTransform: "uppercase", fontWeight: "900", letterSpacing: 1 },
  answerText: { color: colors.white, fontSize: 20, lineHeight: 29, fontWeight: "700" },
  ratePrompt: { color: colors.muted, textAlign: "center", fontWeight: "700" },
  ratings: { flexDirection: "row", gap: 8 },
  rating: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: radii.medium, backgroundColor: "rgba(2,12,30,0.68)" },
  ratingText: { fontWeight: "900", fontSize: 13 },
  complete: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl },
  completeIcon: { fontSize: 54, color: colors.gold },
  error: { color: colors.danger, lineHeight: 20 },
});
