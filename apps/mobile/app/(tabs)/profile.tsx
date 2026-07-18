import { useCallback, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";
import { mobileConfig } from "@/lib/config";
import { registerMobileDevice } from "@/lib/device";
import type { ProfileStats } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { useExperience } from "@/providers/ExperienceProvider";
import { Mascot } from "@/components/Mascot";
import { Eyebrow, GlassCard, Heading, LoadingState, Metric, Pill, PrimaryButton, Screen, SecondaryButton } from "@/components/Ui";
import { colors, radii, spacing } from "@/theme";

type Trust = {
  user: { accountRole: "STUDENT" | "GUARDIAN" | "TEACHER" | "ADMIN"; ageGroup: string; roleVerificationStatus: string };
  settings: { productAnalyticsEnabled: boolean; tutorHistoryEnabled: boolean; aiPersonalizationEnabled: boolean; textScale: string; reduceMotion: boolean; highContrast: boolean; readingFont: boolean };
  linkedStudents: Array<{ relationship: string; student: { id: string; name: string | null } }>;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { hub, elementary, refresh } = useExperience();
  const [trust, setTrust] = useState<Trust | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {const [nextTrust, nextStats] = await Promise.all([apiFetch<Trust>("/api/trust"), apiFetch<ProfileStats>("/api/profile/stats")]); setTrust(nextTrust); setStats(nextStats);}
    catch (cause) {setNotice(cause instanceof Error ? cause.message : "Profile details could not load.");}
    finally {setLoading(false);}
  }, []);
  useFocusEffect(useCallback(() => {void load();}, [load]));

  const web = (path: string) => Linking.openURL(`${mobileConfig.webUrl || mobileConfig.apiUrl}${path}`);
  const enablePush = async () => {
    setBusy(true); setNotice("");
    try {
      const result = await registerMobileDevice(true);
      const enabled = Boolean(result && "device" in result && result.device.pushEnabled);
      setNotice(enabled ? "Notifications are enabled for this device." : "This device is registered. Push delivery will activate in a signed production build.");
    } catch (cause) {setNotice(cause instanceof Error ? cause.message : "Notifications could not be enabled.");}
    finally {setBusy(false);}
  };

  const saveCompanion = async (companionId: string, readAloud = hub?.experience.readAloud ?? false, speechRate = hub?.experience.speechRate ?? 0.9) => {
    if (!hub) {return;}
    setBusy(true);
    try {await apiFetch("/api/games/companion", { method: "POST", body: { companionId, readAloud, speechRate } }); await refresh();}
    catch (cause) {Alert.alert("Could not save", cause instanceof Error ? cause.message : "Try again.");}
    finally {setBusy(false);}
  };

  if (loading && !trust) {return <Screen><LoadingState label="Loading your connected profile…" /></Screen>;}
  const adult = trust && ["GUARDIAN", "TEACHER"].includes(trust.user.accountRole);
  const availableCompanions = hub?.experience.companions.filter((item) => item.elementary === elementary) ?? [];

  return (
    <Screen>
      <View style={styles.header}><View><Eyebrow>Connected identity</Eyebrow><Heading compact>{hub?.player.name ?? "StudySmart profile"}</Heading><Text numberOfLines={1} style={styles.email}>{user?.email}</Text></View><Pill tone="mint">{trust?.user.accountRole ?? "ACCOUNT"}</Pill></View>
      {hub && <GlassCard style={styles.identity}><View style={styles.avatar}><Text style={styles.avatarEmoji}>🙂</Text></View><View style={{ flex: 1 }}><Text style={styles.identityName}>Level {hub.player.level} learner</Text><Text style={styles.identityMeta}>{hub.player.xp} XP · {hub.player.sparks} Sparks</Text></View></GlassCard>}
      {stats && <View style={styles.metrics}><Metric value={stats.sessions} label="Sessions" /><Metric value={`${stats.mastery}%`} label="Mastery" accent={colors.mint} /><Metric value={stats.streak.currentStreak} label="Streak" accent={colors.gold} /></View>}
      {hub && elementary && <><Mascot companion={hub.experience.companion} message="You can choose your learning buddy and decide whether I read new questions out loud." speechRate={hub.experience.speechRate} /><GlassCard style={styles.companions}><View style={styles.sectionHeader}><Heading compact>Learning buddy</Heading><Switch accessibilityLabel="Read new questions aloud" value={hub.experience.readAloud} onValueChange={(value) => saveCompanion(hub.experience.companion.id, value)} trackColor={{ false: colors.faint, true: colors.blue }} thumbColor={colors.white} /></View><Text style={styles.settingHelp}>Read new questions aloud</Text><View style={styles.companionList}>{availableCompanions.map((companion) => <Pressable key={companion.id} disabled={busy} onPress={() => saveCompanion(companion.id)} style={[styles.companion, companion.id === hub.experience.companion.id && styles.companionSelected]}><Text style={styles.companionEmoji}>{companion.emoji}</Text><Text style={styles.companionName}>{companion.name}</Text></Pressable>)}</View><View style={styles.speed}><Text style={styles.settingLabel}>Voice speed</Text>{[{ label: "Slow", value: 0.7 }, { label: "Just right", value: 0.9 }, { label: "Faster", value: 1.1 }].map((option) => <Pressable key={option.value} onPress={() => saveCompanion(hub.experience.companion.id, hub.experience.readAloud, option.value)} style={[styles.speedButton, hub.experience.speechRate === option.value && styles.speedSelected]}><Text style={styles.speedText}>{option.label}</Text></Pressable>)}</View></GlassCard></>}
      <GlassCard style={styles.controls}><View style={styles.controlTitle}><Ionicons name="notifications-outline" color={colors.cyan} size={25} /><View style={{ flex: 1 }}><Text style={styles.controlHeading}>Device notifications</Text><Text style={styles.controlHelp}>Review reminders and generic safety alerts. Sensitive details never appear on the lock screen.</Text></View></View><PrimaryButton label={busy ? "Updating…" : "Enable notifications"} disabled={busy} onPress={enablePush} /></GlassCard>
      {adult && <GlassCard style={styles.alerts}><View style={styles.controlTitle}><Ionicons name="shield-checkmark" color={colors.mint} size={26} /><View style={{ flex: 1 }}><Text style={styles.controlHeading}>Guardian & educator safety</Text><Text style={styles.controlHelp}>Review alerts, acknowledge a response, and securely reveal details after recent sign-in.</Text></View></View><PrimaryButton label="Review safety alerts" onPress={() => router.push("/safety-alerts")} /></GlassCard>}
      <GlassCard style={styles.links}><LinkRow icon="shield-outline" label="Trust Center & privacy" onPress={() => web("/trust")} /><LinkRow icon="people-outline" label="Parent, teacher & classroom tools" onPress={() => web("/community")} /><LinkRow icon="accessibility-outline" label="Accessibility settings" onPress={() => web("/trust")} /><LinkRow icon="document-text-outline" label="Privacy policy" onPress={() => web("/privacy")} /></GlassCard>
      {notice ? <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text> : null}
      <SecondaryButton label="Sign out and remove offline data" onPress={() => signOut().catch((cause) => Alert.alert("Could not sign out", cause.message))} />
      <Text style={styles.footer}>No ads · No behavioral tracking · No real-money student rewards</Text>
    </Screen>
  );
}

function LinkRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="link" onPress={onPress} style={styles.link}><Ionicons name={icon} color={colors.cyan} size={21} /><Text style={styles.linkText}>{label}</Text><Ionicons name="open-outline" color={colors.faint} size={18} /></Pressable>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm }, email: { color: colors.muted, marginTop: 3, maxWidth: 230 }, identity: { flexDirection: "row", alignItems: "center", gap: 14 }, avatar: { width: 68, height: 68, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(38,217,243,0.13)", borderColor: colors.cyan, borderWidth: 1 }, avatarEmoji: { fontSize: 37 }, identityName: { color: colors.white, fontWeight: "900", fontSize: 18 }, identityMeta: { color: colors.gold, marginTop: 4, fontWeight: "800" }, metrics: { flexDirection: "row", gap: 9 },
  companions: { gap: spacing.md }, sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, settingHelp: { color: colors.muted, marginTop: -10 }, companionList: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, companion: { width: "30%", alignItems: "center", gap: 6, padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium }, companionSelected: { borderColor: colors.cyan, backgroundColor: "rgba(38,217,243,0.11)" }, companionEmoji: { fontSize: 33 }, companionName: { color: colors.white, fontSize: 12, fontWeight: "900" }, speed: { gap: 7 }, settingLabel: { color: colors.white, fontWeight: "800" }, speedButton: { minHeight: 40, justifyContent: "center", paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: colors.border }, speedSelected: { borderColor: colors.cyan, backgroundColor: "rgba(38,217,243,0.1)" }, speedText: { color: colors.white, fontWeight: "700" },
  controls: { gap: spacing.md }, alerts: { gap: spacing.md, borderColor: "rgba(90,242,194,0.34)" }, controlTitle: { flexDirection: "row", gap: 12, alignItems: "flex-start" }, controlHeading: { color: colors.white, fontSize: 17, fontWeight: "900" }, controlHelp: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  links: { paddingVertical: 5 }, link: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 57, borderBottomWidth: 1, borderBottomColor: colors.border }, linkText: { color: colors.white, flex: 1, fontWeight: "800" }, notice: { color: colors.gold, textAlign: "center", lineHeight: 20 }, footer: { color: colors.faint, textAlign: "center", fontSize: 11 },
});
