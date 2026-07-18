import { useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { apiFetch, ApiError } from "@/lib/api";
import type { TutorMessage, TutorReply } from "@/lib/types";
import { mobileConfig } from "@/lib/config";
import { useExperience } from "@/providers/ExperienceProvider";
import { Mascot } from "@/components/Mascot";
import { Body, Eyebrow, GlassCard, Heading, Pill, PrimaryButton, Screen } from "@/components/Ui";
import { colors, radii, spacing } from "@/theme";

export default function TutorScreen() {
  const { hub, elementary } = useExperience();
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [replyMeta, setReplyMeta] = useState<TutorReply["attribution"] | null>(null);
  const [conversationId, setConversationId] = useState<string>();
  const [sourceMode, setSourceMode] = useState<"materials" | "general">("materials");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lockedUntil, setLockedUntil] = useState<string>();
  const inputRef = useRef<TextInput>(null);
  const latestAssistant = useMemo(() => [...messages].reverse().find((item) => item.role === "assistant")?.content, [messages]);

  const ask = async () => {
    const question = input.trim();
    if (!question || busy || lockedUntil) {return;}
    const userMessage: TutorMessage = { id: Crypto.randomUUID(), role: "user", content: question };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages); setInput(""); setBusy(true); setError(""); setReplyMeta(null);
    try {
      const result = await apiFetch<TutorReply>("/api/tutor", {
        method: "POST",
        body: { messages: nextMessages.map(({ role, content }) => ({ role, content })), conversationId, sourceMode },
      });
      setMessages((current) => [...current, { id: Crypto.randomUUID(), role: "assistant", content: result.reply }]);
      setReplyMeta(result.attribution ?? null);
      if (result.conversationId) {setConversationId(result.conversationId);}
      if (result.lockedUntil) {setLockedUntil(result.lockedUntil);}
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 423) {setLockedUntil("active");}
      setError(cause instanceof Error ? cause.message : "The tutor could not respond.");
    } finally {setBusy(false);}
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={84}>
      <Screen>
        <View style={styles.header}><View><Eyebrow>Grounded guide</Eyebrow><Heading compact>Learning tutor</Heading></View><Pill tone={sourceMode === "materials" ? "mint" : "violet"}>{sourceMode === "materials" ? "Your sources" : "General knowledge"}</Pill></View>
        <View style={styles.switcher} accessibilityRole="tablist">
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: sourceMode === "materials" }} onPress={() => setSourceMode("materials")} style={[styles.switch, sourceMode === "materials" && styles.switchActive]}><Ionicons name="document-text-outline" size={17} color={sourceMode === "materials" ? colors.cyan : colors.muted} /><Text style={sourceMode === "materials" ? styles.switchTextActive : styles.switchText}>My material</Text></Pressable>
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: sourceMode === "general" }} onPress={() => setSourceMode("general")} style={[styles.switch, sourceMode === "general" && styles.switchActive]}><Ionicons name="globe-outline" size={17} color={sourceMode === "general" ? colors.cyan : colors.muted} /><Text style={sourceMode === "general" ? styles.switchTextActive : styles.switchText}>General</Text></Pressable>
        </View>
        {hub && elementary && <Mascot companion={hub.experience.companion} message={latestAssistant ?? "Ask me anything about what you are learning. I can read my answer out loud, too!"} speechRate={hub.experience.speechRate} autoRead={Boolean(latestAssistant && hub.experience.readAloud)} />}
        {messages.length === 0 && <GlassCard style={styles.welcome}><Ionicons name="sparkles" size={34} color={colors.cyan} /><Heading compact>Ask. Think. Connect.</Heading><Body muted>{sourceMode === "materials" ? "I’ll answer from your uploaded lessons and show exactly which source supported the answer." : "I’ll label this conversation as general knowledge so you always know where an answer came from."}</Body><View style={styles.prompts}>{["Help me understand the main idea", "Quiz me with one question", "Give me a hint, not the answer"].map((prompt) => <Pressable key={prompt} onPress={() => {setInput(prompt); inputRef.current?.focus();}} style={styles.prompt}><Text style={styles.promptText}>{prompt}</Text><Ionicons name="arrow-forward" color={colors.cyan} size={16} /></Pressable>)}</View></GlassCard>}
        {messages.map((message) => <View key={message.id} style={[styles.message, message.role === "user" ? styles.userMessage : styles.assistantMessage]}><Text style={styles.messageRole}>{message.role === "user" ? "You" : hub?.experience.companion.name ?? "StudySmart"}</Text><Text style={styles.messageText}>{message.content}</Text></View>)}
        {replyMeta && <GlassCard style={styles.sourceCard}><View style={styles.sourceTitle}><Ionicons name={replyMeta.mode === "UPLOADED_MATERIAL" ? "shield-checkmark" : "globe"} color={replyMeta.mode === "UPLOADED_MATERIAL" ? colors.mint : colors.violet} size={20} /><Text style={styles.sourceLabel}>{replyMeta.label}</Text></View>{replyMeta.citations.length ? replyMeta.citations.map((citation) => <View key={`${citation.label}-${citation.title}`} style={styles.citation}><Text style={styles.citationTitle}>[{citation.label}] {citation.title}</Text><Text style={styles.citationExcerpt}>{citation.excerpt}</Text></View>) : <Text style={styles.citationExcerpt}>No uploaded source was used for this answer.</Text>}</GlassCard>}
        {lockedUntil && <GlassCard style={styles.lockCard}><Text style={styles.lockTitle}>Learning access is paused</Text><Body>Your guardian can review the safety notice and next steps. If this is about immediate danger or self-harm, tell a trusted adult now or call emergency services.</Body><PrimaryButton label="Open Trust Center" onPress={() => Linking.openURL(`${mobileConfig.webUrl || mobileConfig.apiUrl}/trust`)} /></GlassCard>}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {!lockedUntil && <GlassCard style={styles.composer}><TextInput ref={inputRef} accessibilityLabel="Message the StudySmart tutor" multiline value={input} onChangeText={setInput} maxLength={2000} placeholder="Ask about your lesson…" placeholderTextColor={colors.faint} style={styles.input} /><PrimaryButton label={busy ? "Thinking safely…" : "Ask tutor"} disabled={busy || !input.trim()} onPress={ask} icon={<Ionicons name="arrow-up" color={colors.white} size={18} />} /><Text style={styles.disclaimer}>Tutor responses are filtered for K–12 safety. Ask a trusted adult when something feels unsafe or urgent.</Text></GlassCard>}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  switcher: { flexDirection: "row", backgroundColor: "rgba(2,12,30,0.7)", borderRadius: radii.medium, padding: 5, borderWidth: 1, borderColor: colors.border },
  switch: { flex: 1, minHeight: 44, borderRadius: 14, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center" },
  switchActive: { backgroundColor: "rgba(38,217,243,0.13)", borderWidth: 1, borderColor: "rgba(38,217,243,0.36)" },
  switchText: { color: colors.muted, fontWeight: "800" }, switchTextActive: { color: colors.cyan, fontWeight: "900" },
  welcome: { gap: spacing.md }, prompts: { gap: 8 },
  prompt: { minHeight: 47, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  promptText: { color: colors.white, fontWeight: "700", flex: 1 },
  message: { maxWidth: "90%", padding: spacing.md, borderRadius: radii.medium, gap: 5 },
  userMessage: { alignSelf: "flex-end", backgroundColor: "rgba(40,124,255,0.33)", borderBottomRightRadius: 5 },
  assistantMessage: { alignSelf: "flex-start", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 5 },
  messageRole: { color: colors.cyan, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  messageText: { color: colors.white, fontSize: 16, lineHeight: 24 },
  sourceCard: { gap: 10, borderColor: "rgba(90,242,194,0.3)" }, sourceTitle: { flexDirection: "row", gap: 8, alignItems: "center" }, sourceLabel: { color: colors.mint, fontWeight: "900" },
  citation: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 4 }, citationTitle: { color: colors.white, fontWeight: "800" }, citationExcerpt: { color: colors.muted, lineHeight: 20 },
  composer: { gap: spacing.sm }, input: { minHeight: 100, color: colors.white, fontSize: 16, lineHeight: 23, textAlignVertical: "top", padding: spacing.md, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(1,10,26,0.72)" },
  disclaimer: { color: colors.faint, textAlign: "center", fontSize: 11, lineHeight: 16 }, error: { color: colors.danger, lineHeight: 20 },
  lockCard: { gap: spacing.md, borderColor: "rgba(255,107,138,0.4)" }, lockTitle: { color: colors.danger, fontWeight: "900", fontSize: 20 },
});
