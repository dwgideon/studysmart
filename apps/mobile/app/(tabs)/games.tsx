import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";
import type { GameHub } from "@/lib/types";
import { useExperience } from "@/providers/ExperienceProvider";
import { Mascot } from "@/components/Mascot";
import { Body, Eyebrow, GlassCard, Heading, LoadingState, Metric, Pill, PrimaryButton, Screen, SecondaryButton } from "@/components/Ui";
import { colors, radii, spacing } from "@/theme";

export default function GamesScreen() {
  const router = useRouter();
  const { hub, loading, refresh, elementary } = useExperience();
  const [busyItem, setBusyItem] = useState("");
  useFocusEffect(useCallback(() => {void refresh();}, [refresh]));
  if (loading && !hub) {return <Screen><LoadingState label="Opening your learning arcade…" /></Screen>;}
  if (!hub) {return <Screen><Heading compact>Games are reconnecting</Heading><PrimaryButton label="Try again" onPress={refresh} /></Screen>;}

  const avatarAction = async (item: GameHub["catalog"][number]) => {
    const owned = hub.owned.includes(item.id);
    setBusyItem(item.id);
    try {
      await apiFetch("/api/games/avatar", { method: "POST", body: { action: owned ? "equip" : "buy", itemId: item.id } });
      await refresh();
      if (!owned) {Alert.alert("Unlocked!", `${item.name} is now in your avatar closet.`);}
    } catch (cause) {Alert.alert("Not yet", cause instanceof Error ? cause.message : "That item could not be updated.");}
    finally {setBusyItem("");}
  };

  const missionMessage = elementary
    ? `Welcome to the learning arcade! Answer questions to earn Sparks and help me build amazing things.`
    : "Choose a mission. Every reward is earned by learning, and your XP always syncs back to your profile.";

  return (
    <Screen>
      <View style={styles.header}><View><Eyebrow>Learning arcade</Eyebrow><Heading compact>Missions that build mastery</Heading></View><Pill tone="gold">{hub.player.sparks} ✦</Pill></View>
      {elementary && <Mascot companion={hub.experience.companion} message={missionMessage} speechRate={hub.experience.speechRate} autoRead={hub.experience.readAloud} />}
      <GlassCard style={styles.player}><View style={styles.avatar}><Text style={styles.avatarFace}>🙂</Text><Text style={styles.avatarExtra}>{hub.catalog.find((item) => item.id === hub.avatar.extra)?.icon ?? "✦"}</Text></View><View style={styles.playerCopy}><Text style={styles.playerName}>{hub.player.name}</Text><Text style={styles.playerLevel}>Level {hub.player.level} explorer</Text></View><Metric value={hub.player.xp} label="XP" /></GlassCard>
      <View style={styles.missions}>
        <GlassCard style={styles.liveMission}><View style={[styles.missionIcon, { backgroundColor: "rgba(159,124,255,0.14)" }]}><Ionicons name="radio" color={colors.violet} size={30} /></View><Pill tone="violet">Live multiplayer</Pill><Heading compact>Create a room. Invite your crew.</Heading><Body muted>Host a private Knowledge Grid, receive a code, and share it with up to 30 signed-in students.</Body><PrimaryButton label="Create or join a room" onPress={() => router.push("/multiplayer" as Href)} /></GlassCard>
        <GlassCard style={styles.gridMission}><View style={styles.missionIcon}><Ionicons name="grid" color={colors.cyan} size={30} /></View><Pill>Knowledge grid</Pill><Heading compact>Future Quiz Arena</Heading><Body muted>Choose categories and values in a polished, strategy-first challenge inspired by classroom quiz boards.</Body><PrimaryButton label="Enter the arena" onPress={() => router.push({ pathname: "/game", params: { mode: "GRID" } })} /></GlassCard>
        <GlassCard style={styles.buildMission}><View style={[styles.missionIcon, { backgroundColor: "rgba(90,242,194,0.13)" }]}><Ionicons name="construct" color={colors.mint} size={30} /></View><Pill tone="mint">Build quest</Pill><Heading compact>Create while you learn</Heading><Body muted>Correct answers earn Timber, Alloy, Energy, and Glass for a project you choose.</Body><PrimaryButton label="Start building" onPress={() => router.push({ pathname: "/game", params: { mode: "BUILD", project: "Sky Station" } })} /></GlassCard>
      </View>
      <View style={styles.sectionTitle}><Heading compact>Avatar lab</Heading><Pill tone="violet">Learning-earned only</Pill></View>
      <Body muted>Sparks cannot be bought with money. Students earn them only through safe learning activities.</Body>
      <View style={styles.shop}>{hub.catalog.slice(0, 8).map((item) => {
        const owned = hub.owned.includes(item.id);
        const equipped = Object.values(hub.avatar).includes(item.id);
        return <GlassCard key={item.id} style={styles.item}><View style={[styles.itemIcon, { backgroundColor: `${item.color}22`, borderColor: `${item.color}66` }]}><Text style={styles.itemEmoji}>{item.icon}</Text></View><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemDescription}>{item.description}</Text><SecondaryButton disabled={busyItem === item.id || equipped} label={equipped ? "Equipped" : owned ? "Equip" : `${item.price} ✦`} onPress={() => avatarAction(item)} /></GlassCard>;
      })}</View>
      <View style={styles.sectionTitle}><Heading compact>XP leaderboard</Heading><Ionicons name="shield-checkmark" color={colors.mint} size={22} /></View>
      <GlassCard style={styles.leaderboard}>{hub.leaderboard.map((leader) => <View key={`${leader.rank}-${leader.name}`} style={styles.leader}><Text style={styles.rank}>#{leader.rank}</Text><Text style={styles.leaderName}>{leader.name}</Text><Text style={styles.leaderXp}>{leader.xp} XP</Text></View>)}</GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm },
  player: { flexDirection: "row", alignItems: "center", gap: spacing.md }, avatar: { width: 72, height: 72, borderRadius: 25, backgroundColor: "rgba(38,217,243,0.14)", borderWidth: 1, borderColor: colors.cyan, alignItems: "center", justifyContent: "center" }, avatarFace: { fontSize: 38 }, avatarExtra: { position: "absolute", right: -3, top: -5, fontSize: 22 },
  playerCopy: { flex: 1 }, playerName: { color: colors.white, fontSize: 20, fontWeight: "900" }, playerLevel: { color: colors.muted, marginTop: 3 },
  missions: { gap: spacing.md }, liveMission: { gap: spacing.md, borderColor: "rgba(159,124,255,0.45)" }, gridMission: { gap: spacing.md, borderColor: "rgba(38,217,243,0.38)" }, buildMission: { gap: spacing.md, borderColor: "rgba(90,242,194,0.38)" }, missionIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: "rgba(38,217,243,0.12)", alignItems: "center", justifyContent: "center" },
  sectionTitle: { marginTop: spacing.sm, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  shop: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, item: { width: "48%", padding: 13, gap: 9 }, itemIcon: { height: 72, borderRadius: radii.medium, borderWidth: 1, alignItems: "center", justifyContent: "center" }, itemEmoji: { fontSize: 35 }, itemName: { color: colors.white, fontWeight: "900", fontSize: 15 }, itemDescription: { color: colors.muted, fontSize: 12, lineHeight: 17, minHeight: 34 },
  leaderboard: { gap: 4 }, leader: { flexDirection: "row", alignItems: "center", minHeight: 46, borderBottomWidth: 1, borderBottomColor: colors.border }, rank: { color: colors.cyan, width: 42, fontWeight: "900" }, leaderName: { color: colors.white, flex: 1, fontWeight: "800" }, leaderXp: { color: colors.gold, fontWeight: "900" },
});
