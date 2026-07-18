import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { apiFetch, ApiError } from "@/lib/api";
import { useExperience } from "@/providers/ExperienceProvider";
import { Mascot } from "@/components/Mascot";
import { Body, Eyebrow, GlassCard, Heading, Pill, PrimaryButton, Screen, SecondaryButton } from "@/components/Ui";
import { colors, radii, spacing } from "@/theme";

type ChosenFile = { uri: string; name: string; type: string; size?: number };
const sampleLesson = "The water cycle moves water through evaporation, condensation, precipitation, and collection. Heat from the sun causes liquid water to evaporate into water vapor. As water vapor cools, it condenses into clouds. Water returns to Earth as rain, snow, sleet, or hail. This process repeats continuously.";

export default function UploadScreen() {
  const router = useRouter();
  const { hub, elementary } = useExperience();
  const [text, setText] = useState("");
  const [file, setFile] = useState<ChosenFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const chooseDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["text/*", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/*", "audio/*", "video/mp4", "video/webm"], copyToCacheDirectory: true, multiple: false });
    if (!result.canceled) {const asset = result.assets[0]; if (asset) {setFile({ uri: asset.uri, name: asset.name, type: asset.mimeType ?? "application/octet-stream", size: asset.size });}}
  };

  const choosePhoto = async (camera: boolean) => {
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {Alert.alert("Permission needed", `Allow ${camera ? "camera" : "photo library"} access only when you want to add study material.`); return;}
    const result = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9, allowsMultipleSelection: false });
    if (!result.canceled) {const asset = result.assets[0]; if (asset) {setFile({ uri: asset.uri, name: asset.fileName ?? `study-photo-${Date.now()}.jpg`, type: asset.mimeType ?? "image/jpeg", size: asset.fileSize });}}
  };

  const submit = async () => {
    if (!text.trim() && !file) {setError("Paste notes, take a photo, or choose a file first."); return;}
    if (file?.size && file.size > 20 * 1024 * 1024) {setError("Study files must be 20 MB or smaller."); return;}
    setBusy(true); setError("");
    try {
      const form = new FormData();
      if (text.trim()) {form.append("text", text.trim());}
      if (file) {form.append("file", { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);}
      await apiFetch<{ sessionId: string }>("/api/processMaterials", { method: "POST", body: form });
      Alert.alert("Study set ready", "Your material is grounded, cited, and ready to review.", [{ text: "Start studying", onPress: () => router.replace("/(tabs)/study") }]);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 423) {setError("Learning access is paused. A connected adult can review the safety notice in StudySmart.");}
      else {setError(cause instanceof Error ? cause.message : "StudySmart could not process that material.");}
    } finally {setBusy(false);}
  };

  return (
    <Screen>
      <View><Eyebrow>Grounded source studio</Eyebrow><Heading>Add study material</Heading></View>
      <Body muted>Turn notes, PDFs, slides, documents, images, handwriting, audio, or a short video into a connected study set with source locations preserved.</Body>
      {hub && elementary && <Mascot companion={hub.experience.companion} message="Take a picture of your lesson or ask a grown-up to help choose a file. I’ll keep the words on screen and read them with you." speechRate={hub.experience.speechRate} autoRead={hub.experience.readAloud} />}
      <GlassCard style={styles.inputCard}><Text style={styles.label}>Lesson notes</Text><TextInput accessibilityLabel="Study notes or lesson text" multiline maxLength={100000} value={text} onChangeText={setText} placeholder="Paste or type study notes here…" placeholderTextColor={colors.faint} style={styles.textarea} /><SecondaryButton label="Use a free water-cycle sample" onPress={() => {setText(sampleLesson); setFile(null); setError("");}} /></GlassCard>
      <GlassCard style={styles.sourceCard}><View style={styles.sourceHeader}><Ionicons name="scan" color={colors.cyan} size={27} /><View style={{ flex: 1 }}><Text style={styles.sourceTitle}>Choose a source</Text><Text style={styles.sourceHelp}>Nothing is accessed until you choose it.</Text></View></View><View style={styles.actions}><PrimaryButton label="Take a study photo" onPress={() => choosePhoto(true)} icon={<Ionicons name="camera" size={19} color={colors.white} />} /><SecondaryButton label="Choose a photo" onPress={() => choosePhoto(false)} /><SecondaryButton label="Choose a file" onPress={chooseDocument} /></View>{file && <View style={styles.file}><Ionicons name="document-attach" color={colors.mint} size={22} /><View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.fileName}>{file.name}</Text><Text style={styles.fileMeta}>{file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB · ` : ""}{file.type}</Text></View><Pill tone="mint">Ready</Pill></View>}</GlassCard>
      {error ? <View accessibilityRole="alert" style={styles.error}><Ionicons name="alert-circle" color={colors.danger} size={20} /><Text style={styles.errorText}>{error}</Text></View> : null}
      <PrimaryButton label={busy ? "Reading, grounding, and building…" : "Build grounded study set"} disabled={busy || (!text.trim() && !file)} onPress={submit} icon={<Ionicons name="sparkles" size={20} color={colors.white} />} />
      <Text style={styles.privacy}>StudySmart checks every source for K–12 safety before creating learning material. Uploaded content follows the retention and sharing choices in the Trust Center.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inputCard: { gap: 10 }, label: { color: colors.cyan, fontSize: 12, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" }, textarea: { minHeight: 190, color: colors.white, fontSize: 16, lineHeight: 23, textAlignVertical: "top", borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, padding: spacing.md, backgroundColor: "rgba(1,10,26,0.72)" },
  sourceCard: { gap: spacing.md, borderStyle: "dashed" }, sourceHeader: { flexDirection: "row", gap: 12, alignItems: "center" }, sourceTitle: { color: colors.white, fontWeight: "900", fontSize: 18 }, sourceHelp: { color: colors.muted, fontSize: 12, marginTop: 3 }, actions: { gap: 9 },
  file: { flexDirection: "row", gap: 10, alignItems: "center", padding: 12, borderRadius: radii.medium, backgroundColor: "rgba(90,242,194,0.08)", borderWidth: 1, borderColor: "rgba(90,242,194,0.3)" }, fileName: { color: colors.white, fontWeight: "800" }, fileMeta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  error: { flexDirection: "row", gap: 9, alignItems: "flex-start", padding: 13, borderRadius: radii.medium, borderWidth: 1, borderColor: "rgba(255,107,138,0.38)", backgroundColor: "rgba(255,107,138,0.08)" }, errorText: { color: colors.white, lineHeight: 20, flex: 1 }, privacy: { color: colors.faint, fontSize: 11, lineHeight: 17, textAlign: "center" },
});
