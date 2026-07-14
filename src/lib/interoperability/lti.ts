import { createHash, randomBytes } from "crypto";

export const LTI_CLAIMS = {
  deploymentId: "https://purl.imsglobal.org/spec/lti/claim/deployment_id",
  messageType: "https://purl.imsglobal.org/spec/lti/claim/message_type",
  version: "https://purl.imsglobal.org/spec/lti/claim/version",
  roles: "https://purl.imsglobal.org/spec/lti/claim/roles",
  context: "https://purl.imsglobal.org/spec/lti/claim/context",
  resourceLink: "https://purl.imsglobal.org/spec/lti/claim/resource_link",
} as const;

export function hashLtiValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function randomLtiValue() {
  return randomBytes(32).toString("base64url");
}

export function safeExternalHttpsUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") {throw new Error("LTI platform URLs must use HTTPS.");}
  const host = url.hostname.toLocaleLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host)
  ) {
    throw new Error("Private-network LTI platform URLs are not allowed.");
  }
  return url;
}
