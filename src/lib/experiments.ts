import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  deterministicVariant,
  type VariantAllocation,
} from "@/lib/experimentAllocation";

export const EXPERIMENT_EVENT_NAMES = new Set([
  "ASSIGNMENT_COMPLETED",
  "DIAGNOSTIC_COMPLETED",
  "HINT_REQUESTED",
  "REVIEW_COMPLETED",
  "STUDY_SESSION_COMPLETED",
  "TUTOR_HELPFUL",
]);

function stringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function allocationRecord(value: Prisma.JsonValue): VariantAllocation {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] => typeof entry[1] === "number"
    )
  );
}

async function getExperimentAssignment(userId: string, key: string) {
  const now = new Date();
  const [privacy, experiment] = await Promise.all([
    prisma.privacySettings.findUnique({ where: { userId } }),
    prisma.experiment.findUnique({ where: { key } }),
  ]);
  if (
    privacy?.productAnalyticsEnabled !== true ||
    !experiment ||
    experiment.status !== "RUNNING" ||
    (experiment.startsAt && experiment.startsAt > now) ||
    (experiment.endsAt && experiment.endsAt <= now)
  ) {
    return null;
  }
  const variants = stringArray(experiment.variants);
  const allocation = allocationRecord(experiment.allocation);
  const variant = deterministicVariant({
    experimentKey: experiment.key,
    userId,
    variants,
    allocation,
  });
  return prisma.experimentAssignment.upsert({
    where: { experimentId_userId: { experimentId: experiment.id, userId } },
    create: { experimentId: experiment.id, userId, variant },
    update: {},
  });
}

export async function recordExperimentEvent(input: {
  userId: string;
  experimentKey: string;
  eventName: string;
  value?: number;
  metadata?: Prisma.InputJsonValue;
}) {
  if (!EXPERIMENT_EVENT_NAMES.has(input.eventName)) {
    throw new Error("Unsupported experiment event.");
  }
  const assignment = await getExperimentAssignment(
    input.userId,
    input.experimentKey
  );
  if (!assignment) {
    return null;
  }
  return prisma.experimentEvent.create({
    data: {
      experimentId: assignment.experimentId,
      assignmentId: assignment.id,
      userId: input.userId,
      eventName: input.eventName,
      value: input.value,
      metadata: input.metadata,
    },
  });
}
