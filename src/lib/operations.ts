import { timingSafeEqual } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.ts";

type OperationalLevel = "info" | "warn" | "error" | "critical";

const REDACTED_KEY = /authorization|cookie|content|prompt|response|secret|token|password|key|email|phone|name|address/i;
const JOB_STALE_AFTER_MS: Record<string, number> = {
  "safety-delivery": 26 * 60 * 60 * 1000,
  "ai-evaluation": 30 * 60 * 60 * 1000,
  "data-retention": 30 * 60 * 60 * 1000,
};

export function sanitizeOperationalMetadata(
  value: unknown,
  depth = 0
): Prisma.JsonValue {
  if (depth > 4) {return "[truncated]";}
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {return value.replace(/[\r\n\t]/g, " ").slice(0, 300);}
  if (Array.isArray(value)) {
    return value.slice(0, 30).map((item) => sanitizeOperationalMetadata(item, depth + 1));
  }
  if (typeof value === "object") {
    const output: Record<string, Prisma.JsonValue> = {};
    for (const [key, item] of Object.entries(value).slice(0, 40)) {
      output[key] = REDACTED_KEY.test(key)
        ? "[redacted]"
        : sanitizeOperationalMetadata(item, depth + 1);
    }
    return output;
  }
  return String(value).slice(0, 100);
}

function safeErrorDescriptor(error: unknown) {
  const candidate = error as { name?: string; code?: string | number; status?: number };
  return {
    name: candidate?.name?.slice(0, 80) || "Error",
    code: candidate?.code === undefined ? null : String(candidate.code).slice(0, 40),
    status: typeof candidate?.status === "number" ? candidate.status : null,
  };
}

export function emitOperationalEvent(
  level: OperationalLevel,
  event: string,
  metadata: Record<string, unknown> = {}
) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    schema: "studysmart.operations.v1",
    level,
    event: event.slice(0, 100),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    deployment: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null,
    metadata: sanitizeOperationalMetadata(metadata),
  });
  if (level === "critical" || level === "error") {console.error(entry);}
  else if (level === "warn") {console.warn(entry);}
  else {
    // Structured stdout is collected by the deployment runtime.
    // eslint-disable-next-line no-console
    console.info(entry);
  }
}

async function sendOperationalAlert(event: string, metadata: Record<string, unknown>) {
  const configured = process.env.OPS_ALERT_WEBHOOK_URL;
  if (!configured) {return false;}
  let webhook: URL;
  try {
    webhook = new URL(configured);
  } catch {
    emitOperationalEvent("error", "operations.alert.invalid_url");
    return false;
  }
  if (webhook.protocol !== "https:") {
    emitOperationalEvent("error", "operations.alert.insecure_url");
    return false;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3_000);
  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: `StudySmart operational alert: ${event}`,
        event,
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
        metadata: sanitizeOperationalMetadata(metadata),
      }),
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function reportOperationalFailure(
  event: string,
  error: unknown,
  metadata: Record<string, unknown> = {},
  level: OperationalLevel = "error"
) {
  const safe = { ...metadata, error: safeErrorDescriptor(error) };
  emitOperationalEvent(level, event, safe);
  await sendOperationalAlert(event, safe);
}

export function requestIdFromHeaders(headers: Record<string, string | string[] | undefined>) {
  const value = headers["x-request-id"];
  const requestId = Array.isArray(value) ? value[0] : value;
  return requestId && /^[A-Za-z0-9_-]{8,80}$/.test(requestId) ? requestId : null;
}

export function secureBearerMatches(header: string | undefined, expected: string | undefined) {
  if (!header?.startsWith("Bearer ") || !expected) {return false;}
  const supplied = Buffer.from(header.slice(7));
  const configured = Buffer.from(expected);
  return supplied.length === configured.length && timingSafeEqual(supplied, configured);
}

export async function runOperationalJob<T extends Record<string, unknown>>(
  job: string,
  requestId: string | null,
  operation: () => Promise<T>
) {
  const startedAt = Date.now();
  const run = await prisma.operationalRun.create({ data: { job, requestId } });
  try {
    const result = await operation();
    const durationMs = Date.now() - startedAt;
    const summary = sanitizeOperationalMetadata({ ...result, durationMs });
    await prisma.operationalRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        summary: summary as Prisma.InputJsonValue,
      },
    });
    emitOperationalEvent("info", "operations.job.completed", { job, requestId, durationMs });
    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const descriptor = safeErrorDescriptor(error);
    await prisma.operationalRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        summary: sanitizeOperationalMetadata({ durationMs, error: descriptor }) as Prisma.InputJsonValue,
      },
    }).catch(() => undefined);
    await reportOperationalFailure("operations.job.failed", error, { job, requestId, durationMs }, "critical");
    throw error;
  }
}

export async function collectOperationalStatus() {
  const now = Date.now();
  const [jobs, pendingSafety, exhaustedSafety, failedRetention, failedEvaluation] = await Promise.all([
    Promise.all(Object.keys(JOB_STALE_AFTER_MS).map(async (job) => {
      const latest = await prisma.operationalRun.findFirst({
        where: { job, status: "COMPLETED" },
        orderBy: { startedAt: "desc" },
        select: { startedAt: true, completedAt: true },
      });
      const ageMs = latest ? now - latest.startedAt.getTime() : null;
      return {
        job,
        status: !latest ? "never" : ageMs! > JOB_STALE_AFTER_MS[job] ? "stale" : "healthy",
        lastCompletedAt: latest?.completedAt?.toISOString() ?? null,
        ageMinutes: ageMs === null ? null : Math.round(ageMs / 60_000),
      };
    })),
    prisma.safetyDelivery.count({ where: { status: { in: ["PENDING", "FAILED"] } } }),
    prisma.safetyDelivery.count({ where: { status: "EXHAUSTED" } }),
    prisma.dataRetentionRun.count({ where: { status: "FAILED", startedAt: { gt: new Date(now - 7 * 86_400_000) } } }),
    prisma.aiEvalRun.count({ where: { status: "FAILED", startedAt: { gt: new Date(now - 7 * 86_400_000) } } }),
  ]);
  const configured = {
    database: Boolean(process.env.DATABASE_URL),
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    cronAuthentication: Boolean(process.env.CRON_SECRET),
    dedicatedSafetyEncryption: Boolean(process.env.SAFETY_ENCRYPTION_KEY),
    dedicatedTraceHashing: Boolean(process.env.AI_TRACE_HASH_KEY),
    detailedHealthAuthentication: Boolean(process.env.OPS_HEALTH_TOKEN),
    failureAlertWebhook: Boolean(process.env.OPS_ALERT_WEBHOOK_URL),
  };
  const unhealthyJobs = jobs.filter((job) => job.status !== "healthy");
  return {
    status: unhealthyJobs.length || exhaustedSafety || failedRetention || failedEvaluation
      ? "degraded"
      : "healthy",
    jobs,
    queues: { pendingSafety, exhaustedSafety },
    recentFailures: { retention: failedRetention, evaluation: failedEvaluation },
    configured,
  };
}
