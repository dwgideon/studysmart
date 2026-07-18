import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { apiFetch } from "@/lib/api";
import { mobileConfig } from "@/lib/config";
import type { MultiplayerRoomState } from "@/lib/types";
import { useExperience } from "@/providers/ExperienceProvider";
import { Body, Eyebrow, GlassCard, Heading, Metric, Pill, PrimaryButton, Screen, SecondaryButton } from "@/components/Ui";
import { colors, radii, spacing } from "@/theme";

export function MultiplayerScreen({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const { hub, elementary, refresh: refreshExperience } = useExperience();
  const [room, setRoom] = useState<MultiplayerRoomState | null>(null);
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clock, setClock] = useState(Date.now());
  const attemptedCode = useRef("");
  const spokenPrompt = room?.question?.prompt ?? "";
  const spokenChoices = room?.question?.options
    .map((option, index) => `Choice ${String.fromCharCode(65 + index)}, ${option}`)
    .join(". ") ?? "";

  const post = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    return apiFetch<MultiplayerRoomState>("/api/games/multiplayer", {
      method: "POST",
      body: { action, ...payload },
    });
  }, []);

  const act = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    setBusy(true); setError("");
    try {
      const next = await post(action, payload);
      setRoom(next); setCode(next.room.code);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The room could not continue.");
    } finally {setBusy(false);}
  }, [post]);

  const refreshRoom = useCallback(async () => {
    if (!room?.room.code) {return;}
    try {
      const next = await apiFetch<MultiplayerRoomState>(`/api/games/multiplayer?code=${encodeURIComponent(room.room.code)}`);
      setRoom(next);
    } catch { /* Keep the last good room state during short network interruptions. */ }
  }, [room?.room.code]);

  useEffect(() => {
    const normalized = initialCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (normalized.length !== 6 || room || attemptedCode.current === normalized) {return;}
    attemptedCode.current = normalized;
    void act("join", { code: normalized });
  }, [act, initialCode, room]);

  useEffect(() => {
    if (!room || ["FINISHED", "CLOSED"].includes(room.room.status)) {return;}
    const interval = setInterval(() => {void refreshRoom();}, 1_000);
    return () => clearInterval(interval);
  }, [refreshRoom, room]);

  useEffect(() => {
    const interval = setInterval(() => setClock(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!elementary || !hub?.experience.readAloud || !spokenPrompt || room?.room.phase !== "QUESTION") {return;}
    const speech = `${spokenPrompt}. ${spokenChoices}`;
    Speech.stop();
    Speech.speak(speech, { rate: hub.experience.speechRate });
    return () => {void Speech.stop();};
  }, [elementary, hub?.experience.readAloud, hub?.experience.speechRate, room?.room.currentQuestion, room?.room.phase, spokenChoices, spokenPrompt]);

  const roomAction = (action: string) => room && void act(action, { code: room.room.code });
  const answer = async (selectedIndex: number) => {
    if (!room) {return;}
    await act("answer", { code: room.room.code, selectedIndex });
    await Haptics.selectionAsync();
  };
  const leave = async () => {
    if (!room) {router.back(); return;}
    setBusy(true);
    try {await apiFetch("/api/games/multiplayer", { method: "POST", body: { action: "leave", code: room.room.code } });}
    finally {await refreshExperience(); router.replace("/(tabs)/games");}
  };
  const share = async () => {
    if (!room) {return;}
    const base = mobileConfig.webUrl || mobileConfig.apiUrl;
    const url = `${base}${room.room.sharePath}`;
    await Share.share({ message: `Join my StudySmart learning room with code ${room.room.code}\n${url}`, url, title: "StudySmart multiplayer room" });
  };

  const secondsLeft = room?.room.roundEndsAt
    ? Math.max(0, Math.ceil((new Date(room.room.roundEndsAt).getTime() - clock) / 1_000))
    : 0;

  if (!room) {
    return <Screen><Eyebrow>Live mastery arena</Eyebrow><Heading>Invite your crew.</Heading><Body muted>Create a safe private room from your flashcards, or enter a code from another student. Real names and open chat are never shown.</Body><GlassCard style={styles.launchCard}><View style={styles.icon}><Ionicons name="radio" color={colors.cyan} size={30} /></View><Heading compact>Host a room</Heading><Body muted>Receive a six-character code for up to 30 signed-in students.</Body><PrimaryButton disabled={busy} label={busy ? "Creating room…" : "Create my room"} onPress={() => void act("create")} /></GlassCard><GlassCard style={styles.launchCard}><View style={[styles.icon, { backgroundColor: "rgba(159,124,255,0.15)" }]}><Ionicons name="enter" color={colors.violet} size={30} /></View><Heading compact>Join classmates</Heading><Body muted>Enter the private code sent by the student host.</Body><TextInput accessibilityLabel="Six-character room code" autoCapitalize="characters" autoCorrect={false} maxLength={6} placeholder="ABC234" placeholderTextColor={colors.faint} value={code} onChangeText={(value) => setCode(value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} style={styles.codeInput} /><PrimaryButton disabled={busy || code.length !== 6} label={busy ? "Joining…" : "Join room"} onPress={() => void act("join", { code })} /></GlassCard>{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}</Screen>;
  }

  if (room.room.status === "LOBBY") {
    return <Screen><View style={styles.header}><View><Eyebrow>Room ready</Eyebrow><Heading compact>Invite your study crew</Heading></View><Pill tone="mint">Lobby live</Pill></View><GlassCard style={styles.codeCard}><Text style={styles.codeLabel}>ROOM CODE</Text><Text selectable style={styles.roomCode}>{room.room.code}</Text><Body>You are {room.me.alias}</Body><PrimaryButton label="Share code and link" icon={<Ionicons name="share-social" color={colors.white} size={20} />} onPress={() => void share()} /></GlassCard><PlayerList room={room} />{room.room.isHost ? <PrimaryButton disabled={busy} label="Start Knowledge Grid" onPress={() => roomAction("start")} /> : <GlassCard><Body>Waiting for the student host to start…</Body></GlassCard>}<SecondaryButton disabled={busy} label={room.room.isHost ? "Close room" : "Leave room"} onPress={() => void leave()} />{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}</Screen>;
  }

  if (room.room.status === "ACTIVE" && room.question) {
    const revealed = room.room.phase === "REVEAL";
    const answered = room.me.selectedIndex !== null;
    return <Screen><View style={styles.header}><View><Eyebrow>{room.question.category}</Eyebrow><Heading compact>Question {room.room.currentQuestion + 1} of {room.room.totalQuestions}</Heading></View><View style={[styles.timer, secondsLeft <= 5 && !revealed && styles.timerLow]}><Text style={styles.timerLabel}>{revealed ? "REVEAL" : "TIME"}</Text><Text style={styles.timerValue}>{revealed ? "✓" : secondsLeft}</Text></View></View><View style={styles.roundMeta}><Pill>{room.question.value} points</Pill><Body muted>{room.answeredCount}/{room.players.length} answered</Body></View><GlassCard style={styles.questionCard}><Text style={styles.question}>{room.question.prompt}</Text><View style={styles.answers}>{room.question.options.map((option, index) => {
      const selected = room.me.selectedIndex === index;
      const correct = revealed && room.question?.correctIndex === index;
      const count = room.distribution.find((item) => item.optionIndex === index)?.count ?? 0;
      return <Pressable key={`${option}-${index}`} disabled={busy || answered || revealed} accessibilityRole="button" accessibilityLabel={`Answer ${String.fromCharCode(65 + index)}: ${option}`} onPress={() => void answer(index)} style={({ pressed }) => [styles.answer, selected && styles.selectedAnswer, correct && styles.correctAnswer, pressed && { opacity: .75 }]}><Text style={styles.answerLetter}>{String.fromCharCode(65 + index)}</Text><Text style={styles.answerText}>{option}</Text>{revealed && <Text style={styles.answerCount}>{count}</Text>}</Pressable>;
    })}</View></GlassCard>{answered && !revealed ? <GlassCard><Body>Answer locked. Waiting for the reveal…</Body></GlassCard> : null}{revealed ? <GlassCard style={room.me.correct ? styles.goodFeedback : styles.reviewFeedback}><Heading compact>{room.me.correct ? "Great connection!" : "Lock in the correction."}</Heading><Body>Correct answer: {room.question.correctAnswer}</Body></GlassCard> : null}{room.room.isHost ? <PrimaryButton disabled={busy} label={revealed ? (room.room.currentQuestion + 1 === room.room.totalQuestions ? "Show final results" : "Next question") : "Reveal answer now"} onPress={() => roomAction(revealed ? "next" : "reveal")} /> : <Body muted>{revealed ? "Waiting for the host to continue…" : "The answer reveals when time ends."}</Body>}<PlayerList room={room} />{!room.me.rewardsEnabled ? <Body muted>Practice room: your score counts here, but today’s multiplayer reward limit is reached.</Body> : null}<SecondaryButton label="Exit room" onPress={() => void leave()} />{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}</Screen>;
  }

  const winner = room.players[0];
  return <Screen><View style={styles.results}><Ionicons name="sparkles" color={colors.cyan} size={42} /><Eyebrow>Mission complete</Eyebrow><Heading>{winner ? `${winner.alias} leads the room!` : "Room complete"}</Heading><Body muted>Your multiplayer learning and rewards are saved.</Body></View><View style={styles.metrics}><Metric value={room.me.score} label="points" /><Metric value={`${room.me.correctCount}/${room.room.totalQuestions}`} label="correct" accent={colors.mint} /><Metric value={`+${room.me.sparksEarned}`} label="Sparks" accent={colors.gold} /></View><PlayerList room={room} /><PrimaryButton label="Return to Game World" onPress={() => void leave()} /></Screen>;
}

function PlayerList({ room }: { room: MultiplayerRoomState }) {
  return <GlassCard style={styles.players}><View style={styles.header}><Heading compact>{room.room.status === "LOBBY" ? "Players connected" : "Leaderboard"}</Heading><Pill>{room.players.length}</Pill></View>{room.players.map((player) => <View key={player.alias} style={[styles.player, player.isMe && styles.me]}><Text style={styles.rank}>#{player.rank}</Text><View style={{ flex: 1 }}><Text style={styles.playerName}>{player.alias}</Text><Text style={styles.playerRole}>{player.isHost ? "Student host" : player.isMe ? "You" : "Player"}</Text></View><Text style={styles.score}>{player.score} pts</Text></View>)}</GlassCard>;
}

const styles = StyleSheet.create({
  launchCard: { gap: spacing.md }, icon: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(38,217,243,0.13)" },
  codeInput: { minHeight: 58, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.cyan, borderRadius: radii.medium, backgroundColor: "rgba(2,12,30,0.72)", color: colors.white, textAlign: "center", fontSize: 24, fontWeight: "900", letterSpacing: 5 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm }, codeCard: { gap: spacing.md, alignItems: "center", borderColor: "rgba(38,217,243,0.45)" }, codeLabel: { color: colors.muted, fontSize: 11, fontWeight: "900", letterSpacing: 2 }, roomCode: { color: colors.cyan, fontSize: 46, fontWeight: "900", letterSpacing: 7 },
  players: { gap: 6 }, player: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: "transparent", borderRadius: radii.small }, me: { borderColor: "rgba(38,217,243,0.4)", backgroundColor: "rgba(38,217,243,0.08)" }, rank: { color: colors.cyan, width: 35, fontWeight: "900" }, playerName: { color: colors.white, fontWeight: "900" }, playerRole: { color: colors.faint, fontSize: 11, marginTop: 2 }, score: { color: colors.gold, fontWeight: "900" },
  timer: { minWidth: 72, padding: 9, borderWidth: 1, borderColor: colors.cyan, borderRadius: radii.medium, alignItems: "center", backgroundColor: "rgba(38,217,243,0.09)" }, timerLow: { borderColor: colors.danger, backgroundColor: "rgba(255,107,138,0.12)" }, timerLabel: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1 }, timerValue: { color: colors.cyan, fontSize: 25, fontWeight: "900" }, roundMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, questionCard: { gap: spacing.lg }, question: { color: colors.white, fontSize: 24, lineHeight: 33, fontWeight: "900" }, answers: { gap: spacing.sm }, answer: { minHeight: 64, padding: 12, borderRadius: radii.medium, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(2,12,30,0.65)" }, selectedAnswer: { borderColor: colors.gold, backgroundColor: "rgba(255,214,107,0.09)" }, correctAnswer: { borderColor: colors.mint, backgroundColor: "rgba(90,242,194,0.1)" }, answerLetter: { width: 34, height: 34, paddingTop: 7, borderRadius: 10, textAlign: "center", color: colors.cyan, backgroundColor: "rgba(40,124,255,0.28)", fontWeight: "900" }, answerText: { color: colors.white, flex: 1, fontWeight: "800", lineHeight: 21 }, answerCount: { color: colors.muted, fontWeight: "900" },
  goodFeedback: { gap: spacing.sm, borderColor: "rgba(90,242,194,0.45)" }, reviewFeedback: { gap: spacing.sm, borderColor: "rgba(255,214,107,0.45)" }, results: { alignItems: "center", gap: spacing.sm }, metrics: { flexDirection: "row", gap: spacing.sm }, error: { color: colors.danger, lineHeight: 20, fontWeight: "700" },
});
