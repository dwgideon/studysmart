import { createHash } from "crypto";

export type VariantAllocation = Record<string, number>;

export function validateAllocation(
  variants: string[],
  allocation: VariantAllocation
) {
  if (variants.length < 2 || new Set(variants).size !== variants.length) {
    throw new Error("An experiment needs at least two unique variants.");
  }
  const allocationKeys = Object.keys(allocation);
  if (
    allocationKeys.length !== variants.length ||
    allocationKeys.some((key) => !variants.includes(key))
  ) {
    throw new Error("Allocation must define every variant exactly once.");
  }
  const total = variants.reduce((sum, variant) => {
    const weight = allocation[variant];
    if (!Number.isFinite(weight) || weight <= 0 || weight > 1) {
      throw new Error("Every allocation weight must be between 0 and 1.");
    }
    return sum + weight;
  }, 0);
  if (Math.abs(total - 1) > 0.000001) {
    throw new Error("Experiment allocation must total 1.");
  }
}

export function deterministicVariant(input: {
  experimentKey: string;
  userId: string;
  variants: string[];
  allocation: VariantAllocation;
}) {
  validateAllocation(input.variants, input.allocation);
  const digest = createHash("sha256")
    .update(`${input.experimentKey}:${input.userId}:studysmart-v1`)
    .digest();
  const bucket = digest.readUInt32BE(0) / 0x1_0000_0000;
  let cumulative = 0;
  for (const variant of input.variants) {
    cumulative += input.allocation[variant];
    if (bucket < cumulative) {
      return variant;
    }
  }
  return input.variants[input.variants.length - 1];
}
