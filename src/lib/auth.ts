import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { User } from "@supabase/supabase-js";
import { ensureUser } from "@/lib/ensureUser";
import { prisma } from "@/lib/prisma";
import { isTrustedMutationRequest } from "@/lib/requestSecurity";
import { bearerTokenFromHeader } from "@/lib/mobileAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const LOCK_EXEMPT_API_PREFIXES = [
  "/api/community",
  "/api/privacy/",
  "/api/safety/",
  "/api/trust",
];

function isLockExemptRequest(req: NextApiRequest) {
  const path = (req.url ?? "").split("?")[0];
  return LOCK_EXEMPT_API_PREFIXES.some((prefix) =>
    prefix.endsWith("/") ? path.startsWith(prefix) : path === prefix
  );
}

export async function getApiUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<User | null> {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  const bearerToken = bearerTokenFromHeader(req.headers.authorization);
  const supabase = bearerToken
    ? supabaseAdmin
    : createPagesServerClient({ req, res });
  let result;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    result = await supabase.auth.getUser(bearerToken ?? undefined);
    if (!result.error || !isRetryableAuthError(result.error) || attempt === 3) {break;}
    await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
  }
  if (!result) {return null;}
  const { data: { user }, error } = result;

  if (error || !user) {return null;}
  return user;
}

function isRetryableAuthError(error: { name?: string; message?: string; status?: number }) {
  const detail = `${error.name ?? ""} ${error.message ?? ""}`.toLowerCase();
  return detail.includes("retryable") ||
    detail.includes("fetch failed") ||
    detail.includes("network") ||
    detail.includes("connection") ||
    (typeof error.status === "number" && error.status >= 500);
}

export async function requireApiUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<User | null> {
  const user = await getApiUser(req, res);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  if (!isTrustedMutationRequest(req)) {
    res.status(403).json({
      code: "CROSS_SITE_MUTATION_BLOCKED",
      error: "This request did not come from a trusted StudySmart origin.",
    });
    return null;
  }

  await ensureUser(
    user.id,
    user.email ?? undefined,
    user.user_metadata?.full_name ?? user.user_metadata?.name
  );

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { learningLockedUntil: true },
  });
  const now = new Date();
  if (account?.learningLockedUntil && account.learningLockedUntil <= now) {
    await prisma.user.update({
      where: { id: user.id },
      data: { learningLockedUntil: null, safetyStrikeCount: 0 },
    });
  } else if (
    account?.learningLockedUntil &&
    account.learningLockedUntil > now &&
    !isLockExemptRequest(req)
  ) {
    res.status(423).json({
      code: "LEARNING_LOCKED",
      error: "Learning tools are temporarily locked.",
      lockedUntil: account.learningLockedUntil.toISOString(),
    });
    return null;
  }

  return user;
}
