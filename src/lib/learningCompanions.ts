export type Companion = {
  id: string;
  name: string;
  animal: string;
  emoji: string;
  color: string;
  accent: string;
  trait: string;
  elementary: boolean;
};

export const LEARNING_COMPANIONS: Companion[] = [
  { id: "nova_fox", name: "Nova", animal: "Fox", emoji: "🦊", color: "#ff8a3d", accent: "#ffd166", trait: "Curious explorer", elementary: true },
  { id: "scout_owl", name: "Scout", animal: "Owl", emoji: "🦉", color: "#9b72ff", accent: "#d8c8ff", trait: "Story detective", elementary: true },
  { id: "atlas_turtle", name: "Atlas", animal: "Turtle", emoji: "🐢", color: "#28c995", accent: "#9cf3d6", trait: "Patient problem-solver", elementary: true },
  { id: "luna_otter", name: "Luna", animal: "Otter", emoji: "🦦", color: "#39a9ff", accent: "#a8ddff", trait: "Playful builder", elementary: true },
  { id: "orbit_wolf", name: "Orbit", animal: "Wolf", emoji: "🐺", color: "#536dfe", accent: "#80e7ff", trait: "Mission navigator", elementary: false },
  { id: "echo_raven", name: "Echo", animal: "Raven", emoji: "🐦‍⬛", color: "#7748d8", accent: "#bca7ff", trait: "Strategy guide", elementary: false },
];

export const companionById = (id: string) => LEARNING_COMPANIONS.find((companion) => companion.id === id);

export const companionGreeting = (companion: Companion, learnerName: string, earlyReader: boolean) =>
  earlyReader
    ? `Hi ${learnerName}! I’m ${companion.name}. Tap the speaker and I will read the words with you. Let’s learn and play!`
    : `Hi ${learnerName}! I’m ${companion.name}, your learning buddy. I can read questions and answers out loud while you follow the words on screen.`;
