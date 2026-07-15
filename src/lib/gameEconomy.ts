export type GameMode = "GRID" | "BUILD";
export type AvatarSlot = "hair" | "top" | "extra";

export type AvatarItem = {
  id: string;
  name: string;
  slot: AvatarSlot;
  price: number;
  icon: string;
  color: string;
  description: string;
};

export const STARTER_ITEMS = ["hair_starter", "top_starter", "extra_none"];

export const AVATAR_CATALOG: AvatarItem[] = [
  { id: "hair_starter", name: "Classic Wave", slot: "hair", price: 0, icon: "✦", color: "#153d78", description: "A timeless first look." },
  { id: "hair_comet", name: "Comet Fade", slot: "hair", price: 90, icon: "☄", color: "#2dd4ff", description: "A streak of electric blue." },
  { id: "hair_orbit", name: "Orbit Curls", slot: "hair", price: 140, icon: "◌", color: "#8b7cff", description: "Bright curls with cosmic energy." },
  { id: "top_starter", name: "Academy Tee", slot: "top", price: 0, icon: "◆", color: "#2563eb", description: "StudySmart academy blue." },
  { id: "top_builder", name: "Builder Jacket", slot: "top", price: 120, icon: "▦", color: "#f59e0b", description: "Ready for the Build Lab." },
  { id: "top_nebula", name: "Nebula Hoodie", slot: "top", price: 175, icon: "✺", color: "#7c3aed", description: "A cozy galaxy gradient." },
  { id: "extra_none", name: "No Accessory", slot: "extra", price: 0, icon: "—", color: "#64748b", description: "Keep the look clean." },
  { id: "extra_glasses", name: "Focus Frames", slot: "extra", price: 75, icon: "◎", color: "#22d3ee", description: "Frames for serious thinkers." },
  { id: "extra_headphones", name: "Study Headset", slot: "extra", price: 160, icon: "♫", color: "#ec4899", description: "Tune in to deep focus." },
];

export const catalogItem = (id: string) => AVATAR_CATALOG.find((item) => item.id === id);

export const rewardForQuestion = (correct: boolean, difficulty: number, rewardsEnabled: boolean) => {
  if (!correct || !rewardsEnabled) {return { xp: 0, sparks: 0 };}
  const safeDifficulty = Math.max(1, Math.min(3, Math.round(difficulty)));
  return { xp: 4 + safeDifficulty * 2, sparks: 3 + safeDifficulty * 2 };
};

export const levelForXp = (xp: number) => Math.floor(Math.max(0, xp) / 100) + 1;
