import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { apiFetch } from "@/lib/api";
import type { GameAnswer, GameRun } from "@/lib/types";
import { useExperience } from "@/providers/ExperienceProvider";
import { Body, Eyebrow, GlassCard, Heading, LoadingState, Metric, Pill, PrimaryButton, Screen } from "@/components/Ui";
import { colors, radii, spacing } from "@/theme";

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; project?: string }>();
  const { hub, elementary, refresh } = useExperience();
  const [run, setRun] = useState<GameRun | null>(null);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<GameAnswer | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [materials, setMaterials] = useState<Record<string, number>>({});

  useEffect(() => {
    apiFetch<GameRun>("/api/games/run", { method: "POST", body: { action: "start", mode: params.mode === "BUILD" ? "BUILD" : "GRID", project: params.project } })
      .then((value) => setRun(value)).catch((cause) => setError(cause instanceof Error ? cause.message : "The mission could not start."))
      .finally(() => setBusy(false));
  }, [params.mode, params.project]);

  const question = run?.questions[index];
  useEffect(() => {
    if (question && elementary && hub?.experience.readAloud) {
      Speech.stop(); Speech.speak(question.prompt, { rate: hub.experience.speechRate });
    }
    return () => {void Speech.stop();};
  }, [elementary, hub?.experience.readAloud, hub?.experience.speechRate, question]);

  const answer = async (selectedIndex: number) => {
    if (!run || !question || result) {return;}
    setBusy(true); setError("");
    try {
      const value = await apiFetch<GameAnswer>("/api/games/run", { method: "POST", body: { action: "answer", runId: run.runId, questionIndex: index, selectedIndex } });
      setResult(value);
      if (value.material) {setMaterials((current) => ({ ...current, [value.material!]: (current[value.material!] ?? 0) + 1 }));}
      await Haptics.notificationAsync(value.correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
      if (elementary && hub?.experience.readAloud) {Speech.speak(value.correct ? "Amazing! You earned a reward." : `Nice try. The answer is ${value.correctAnswer}.`, { rate: hub.experience.speechRate });}
    } catch (cause) {setError(cause instanceof Error ? cause.message : "That answer could not be saved.");}
    finally {setBusy(false);}
  };

  const continueGame = async () => {
    if (!result) {return;}
    if (result.finished) {await refresh(); Alert.alert("Mission complete", `You earned ${result.xpEarned} XP and ${result.sparksEarned} Sparks.`, [{ text: "Back to arcade", onPress: () => router.back() }]); return;}
    setIndex((value) => value + 1); setResult(null);
  };

  if (busy && !run) {return <Screen><LoadingState label="Generating a mission from your study cards…" /></Screen>;}
  if (error && !run) {return <Screen><Heading compact>Mission unavailable</Heading><Body>{error}</Body><PrimaryButton label="Back to arcade" onPress={() => router.back()} /></Screen>;}
  if (!run || !question) {return null;}
  const progress = Math.round(((index + (result ? 1 : 0)) / run.questions.length) * 100);

  return (
    <Screen>
      <View style={styles.header}><View><Eyebrow>{run.mode === "BUILD" ? run.project : "Future quiz arena"}</Eyebrow><Heading compact>{question.category}</Heading></View><Pill tone="gold">{question.value} pts</Pill></View>
      <View style={styles.progressTrack}><View style={[styles.progress, { width: `${progress}%` }]} /></View>
      <View style={styles.meta}><Text style={styles.metaText}>Question {index + 1} of {run.questions.length}</Text>{!run.rewardsEnabled && <Pill tone="violet">Practice-only run</Pill>}</View>
      {run.mode === "BUILD" && <GlassCard style={styles.materials}><Ionicons name="construct" color={colors.mint} size={22} /><View style={{ flex: 1 }}><Text style={styles.materialTitle}>Build inventory</Text><Text style={styles.materialText}>{Object.entries(materials).length ? Object.entries(materials).map(([name, count]) => `${name} ×${count}`).join("  ·  ") : "Answer correctly to collect your first material."}</Text></View></GlassCard>}
      <GlassCard style={styles.questionCard}><Text style={styles.question}>{question.prompt}</Text><View style={styles.answers}>{question.options.map((option, optionIndex) => {
        const correct = result && optionIndex === result.correctIndex;
        return <Pressable key={`${option}-${optionIndex}`} disabled={busy || Boolean(result)} onPress={() => answer(optionIndex)} accessibilityRole="button" accessibilityLabel={`Answer ${String.fromCharCode(65 + optionIndex)}: ${option}`} style={({ pressed }) => [styles.answer, correct && styles.correctAnswer, pressed && { opacity: 0.75 }]}><View style={[styles.answerLetter, correct && { backgroundColor: colors.mint }]}><Text style={[styles.answerLetterText, correct && { color: colors.ink }]}>{String.fromCharCode(65 + optionIndex)}</Text></View><Text style={styles.answerText}>{option}</Text></Pressable>;
      })}</View></GlassCard>
      {result && <GlassCard style={[styles.result, { borderColor: result.correct ? "rgba(90,242,194,0.5)" : "rgba(255,214,107,0.5)" }]}><Text style={[styles.resultTitle, { color: result.correct ? colors.mint : colors.gold }]}>{result.correct ? "Brilliant connection!" : "Good try—now lock it in."}</Text><Body>{result.correct ? "Your learning and rewards were saved." : `Correct answer: ${result.correctAnswer}`}</Body>{run.rewardsEnabled && result.correct && <View style={styles.rewardRow}><Metric value={`+${result.reward.xp}`} label="XP" /><Metric value={`+${result.reward.sparks}`} label="Sparks" accent={colors.gold} />{result.material && <Metric value={`+1`} label={result.material} accent={colors.mint} />}</View>}<PrimaryButton label={result.finished ? "Finish mission" : "Next challenge"} onPress={continueGame} /></GlassCard>}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm }, progressTrack: { height: 8, borderRadius: 4, backgroundColor: "rgba(120,190,255,0.12)", overflow: "hidden" }, progress: { height: 8, borderRadius: 4, backgroundColor: colors.cyan }, meta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, metaText: { color: colors.muted, fontWeight: "800" },
  materials: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }, materialTitle: { color: colors.mint, fontWeight: "900" }, materialText: { color: colors.muted, marginTop: 3, fontSize: 12 },
  questionCard: { gap: spacing.lg }, question: { color: colors.white, fontSize: 24, lineHeight: 33, fontWeight: "900" }, answers: { gap: spacing.sm }, answer: { minHeight: 64, padding: 12, borderRadius: radii.medium, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(2,12,30,0.65)" }, correctAnswer: { borderColor: colors.mint, backgroundColor: "rgba(90,242,194,0.1)" }, answerLetter: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(40,124,255,0.28)" }, answerLetterText: { color: colors.cyan, fontWeight: "900" }, answerText: { color: colors.white, fontSize: 16, lineHeight: 22, fontWeight: "700", flex: 1 },
  result: { gap: spacing.md }, resultTitle: { fontSize: 21, fontWeight: "900" }, rewardRow: { flexDirection: "row", gap: spacing.sm }, error: { color: colors.danger, lineHeight: 20 },
});
