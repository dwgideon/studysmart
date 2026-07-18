export const PAID_PLAN_KEYS = ["starter", "pro", "unlimited"] as const;

export type PaidPlanKey = (typeof PAID_PLAN_KEYS)[number];
export type PlanKey = "free" | PaidPlanKey;

type PlanDefinition = {
  key: PlanKey;
  name: string;
  monthlyPriceCents: number;
  monthlyAiCredits: number;
  description: string;
};

export const PLAN_CATALOG: Record<PlanKey, PlanDefinition> = {
  free: {
    key: "free",
    name: "Free",
    monthlyPriceCents: 0,
    monthlyAiCredits: 25,
    description: "Core studying with a monthly AI allowance.",
  },
  starter: {
    key: "starter",
    name: "Starter",
    monthlyPriceCents: 999,
    monthlyAiCredits: 200,
    description: "Consistent test preparation for one learner.",
  },
  pro: {
    key: "pro",
    name: "Pro",
    monthlyPriceCents: 1999,
    monthlyAiCredits: 500,
    description: "Frequent studying, larger study sets, and more tutoring.",
  },
  unlimited: {
    key: "unlimited",
    name: "Max",
    monthlyPriceCents: 2999,
    monthlyAiCredits: 2_000,
    description: "High-volume exam preparation with a fair-use allowance.",
  },
};

export const BILLABLE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;

export const AI_CREDIT_COSTS = {
  tutorReply: 1,
  quiz: 2,
  diagnostic: 2,
  textSourceProcessing: 1,
  visualOrDocumentProcessing: 10,
  audioOrVideoProcessing: 20,
  flashcardGeneration: 2,
} as const;

export function isPaidPlanKey(value: unknown): value is PaidPlanKey {
  return typeof value === "string" && PAID_PLAN_KEYS.includes(value as PaidPlanKey);
}

export function planForKey(value: unknown) {
  return PLAN_CATALOG[isPaidPlanKey(value) ? value : "free"];
}

export function stripePriceMap() {
  return {
    starter: process.env.STRIPE_PRICE_ID_STARTER ?? process.env.PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_ID_PRO ?? process.env.PRICE_PRO,
    unlimited: process.env.STRIPE_PRICE_ID_UNLIMITED ?? process.env.PRICE_UNLIMITED,
  } satisfies Record<PaidPlanKey, string | undefined>;
}

export function planKeyForPriceId(priceId: string | null | undefined): PaidPlanKey | null {
  if (!priceId) {return null;}
  const match = Object.entries(stripePriceMap()).find(([, configured]) => configured === priceId);
  return match?.[0] as PaidPlanKey | undefined ?? null;
}
