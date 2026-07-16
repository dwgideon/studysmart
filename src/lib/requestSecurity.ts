import type { NextApiRequest } from "next";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function originOf(value: string | undefined) {
  if (!value) {return null;}
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function trustedMutationOrigins(req: Pick<NextApiRequest, "headers">) {
  const origins = new Set<string>();
  for (const configured of [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ]) {
    const origin = originOf(configured);
    if (origin) {origins.add(origin);}
  }
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  const hostValue = Array.isArray(host) ? host[0] : host;
  if (hostValue) {
    const forwardedProto = req.headers["x-forwarded-proto"];
    const protoValue = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
    origins.add(`${protoValue || "https"}://${hostValue}`);
    if (process.env.NODE_ENV !== "production") {origins.add(`http://${hostValue}`);}
  }
  return origins;
}

/** Blocks browser cross-site mutations while preserving authenticated CLI/LMS clients. */
export function isTrustedMutationRequest(
  req: Pick<NextApiRequest, "method" | "headers">
) {
  if (SAFE_METHODS.has((req.method ?? "GET").toUpperCase())) {return true;}
  const fetchSite = req.headers["sec-fetch-site"];
  const fetchSiteValue = Array.isArray(fetchSite) ? fetchSite[0] : fetchSite;
  if (fetchSiteValue === "cross-site") {return false;}

  const supplied = req.headers.origin ?? req.headers.referer;
  const suppliedValue = Array.isArray(supplied) ? supplied[0] : supplied;
  if (!suppliedValue) {
    // Non-browser clients do not consistently send Origin. Authentication and
    // signed integration checks remain mandatory for those requests.
    return true;
  }
  const suppliedOrigin = originOf(suppliedValue);
  return Boolean(suppliedOrigin && trustedMutationOrigins(req).has(suppliedOrigin));
}
