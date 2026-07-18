import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Body, Eyebrow, GlassCard, Heading, PrimaryButton, SecondaryButton } from "@/components/Ui";
import { mobileConfig, mobileConfigReady } from "@/lib/config";
import { useAuth } from "@/providers/AuthProvider";
import { colors, radii, spacing } from "@/theme";

export default function SignIn() {
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (session) {return <Redirect href="/(tabs)" />;}

  const submit = async () => {
    setBusy(true); setError("");
    try {await signIn(email, password);}
    catch (cause) {setError(cause instanceof Error ? cause.message : "Could not sign in.");}
    finally {setBusy(false);}
  };

  return (
    <LinearGradient colors={[colors.ink, "#062452", colors.deep]} style={styles.page}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <View style={styles.brand}>
          <View style={styles.logo}><Text style={styles.logoMark}>S</Text></View>
          <View><Eyebrow>K–12 learning intelligence</Eyebrow><Text style={styles.wordmark}>StudySmart</Text></View>
        </View>
        <GlassCard style={styles.card}>
          <View style={styles.signal}><View style={styles.signalDot} /><Text style={styles.signalText}>CONNECTED LEARNING · MOBILE</Text></View>
          <Heading>Your learning world, wherever you are.</Heading>
          <Body muted>Use the same account, mastery, review schedule, games, and safety protections as the StudySmart website.</Body>
          {!mobileConfigReady && <View style={styles.warning}><Text style={styles.warningTitle}>App configuration needed</Text><Text style={styles.warningText}>Add the public API and Supabase settings from `.env.example` before signing in.</Text></View>}
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.faint} style={styles.input} />
            <Text style={styles.label}>Password</Text>
            <TextInput accessibilityLabel="Password" autoCapitalize="none" autoComplete="current-password" secureTextEntry value={password} onChangeText={setPassword} placeholder="Your password" placeholderTextColor={colors.faint} style={styles.input} />
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <PrimaryButton label={busy ? "Connecting…" : "Enter StudySmart"} disabled={busy || !mobileConfigReady || !email || !password} onPress={submit} />
            <SecondaryButton label="Adult account setup on the website" onPress={() => Linking.openURL(`${mobileConfig.webUrl || mobileConfig.apiUrl}/login`)} />
          </View>
        </GlassCard>
        <Text style={styles.privacy}>No advertising. No real-money game currency. Child safety and privacy settings follow your account everywhere.</Text>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  keyboard: { flex: 1, justifyContent: "center", padding: spacing.lg, gap: spacing.lg },
  brand: { flexDirection: "row", alignItems: "center", gap: 13 },
  logo: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.cyan },
  logoMark: { color: colors.white, fontSize: 28, fontWeight: "900" },
  wordmark: { color: colors.white, fontSize: 25, fontWeight: "900", letterSpacing: -0.8 },
  card: { gap: spacing.md },
  signal: { flexDirection: "row", alignItems: "center", gap: 8 },
  signalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.cyan },
  signalText: { color: colors.cyan, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  form: { gap: 10, marginTop: 6 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  input: { minHeight: 54, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(1,10,26,0.75)", color: colors.white, fontSize: 16, paddingHorizontal: 16 },
  error: { color: colors.danger, lineHeight: 20 },
  warning: { backgroundColor: "rgba(255,214,107,0.12)", borderWidth: 1, borderColor: "rgba(255,214,107,0.4)", padding: 13, borderRadius: radii.medium },
  warningTitle: { color: colors.gold, fontWeight: "900" },
  warningText: { color: colors.white, marginTop: 3, lineHeight: 19 },
  privacy: { color: colors.muted, textAlign: "center", fontSize: 12, lineHeight: 18, paddingHorizontal: 12 },
});
