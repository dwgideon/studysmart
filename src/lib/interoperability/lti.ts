import { createHash, randomBytes } from "crypto";
import { lookup } from "dns/promises";
import { isIP } from "net";

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
  if (value.length > 2_048) {throw new Error("LTI platform URL is too long.");}
  const url = new URL(value);
  if (url.protocol !== "https:") {throw new Error("LTI platform URLs must use HTTPS.");}
  if (url.username || url.password || (url.port && url.port !== "443")) {
    throw new Error("LTI platform URLs cannot contain credentials or nonstandard ports.");
  }
  const host = url.hostname.toLocaleLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || (isIP(host) && !isPublicIpAddress(host))) {
    throw new Error("Private-network LTI platform URLs are not allowed.");
  }
  return url;
}

function ipv4Number(address: string) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }
  return (((octets[0] * 256 + octets[1]) * 256 + octets[2]) * 256 + octets[3]) >>> 0;
}

function inIpv4Range(value: number, base: string, prefix: number) {
  const baseValue = ipv4Number(base);
  if (baseValue === null) {return false;}
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (value & mask) === (baseValue & mask);
}

function ipv6Number(address: string) {
  let input = address.toLowerCase().split("%")[0];
  if (input.includes(".")) {
    const lastColon = input.lastIndexOf(":");
    const v4 = ipv4Number(input.slice(lastColon + 1));
    if (v4 === null) {return null;}
    input = `${input.slice(0, lastColon)}:${(v4 >>> 16).toString(16)}:${(v4 & 0xffff).toString(16)}`;
  }
  const halves = input.split("::");
  if (halves.length > 2) {return null;}
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || missing < 0) {return null;}
  const groups = [...left, ...Array(missing).fill("0"), ...right];
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) {return null;}
  return groups.reduce((result, group) => (result << 16n) | BigInt(`0x${group}`), 0n);
}

function inIpv6Range(value: bigint, base: string, prefix: number) {
  const baseValue = ipv6Number(base);
  if (baseValue === null) {return false;}
  const shift = BigInt(128 - prefix);
  return (value >> shift) === (baseValue >> shift);
}

export function isPublicIpAddress(address: string) {
  if (isIP(address) === 4) {
    const value = ipv4Number(address);
    if (value === null) {return false;}
    return ![
      ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
      ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
      ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
      ["224.0.0.0", 4], ["240.0.0.0", 4],
    ].some(([base, prefix]) => inIpv4Range(value, String(base), Number(prefix)));
  }
  if (isIP(address) === 6) {
    const value = ipv6Number(address);
    if (value === null) {return false;}
    // IPv4-mapped IPv6 addresses inherit the IPv4 address classification.
    if ((value >> 32n) === 0xffffn) {
      const mapped = Number(value & 0xffffffffn);
      return isPublicIpAddress(`${mapped >>> 24}.${(mapped >>> 16) & 255}.${(mapped >>> 8) & 255}.${mapped & 255}`);
    }
    return ![
      ["::", 128], ["::1", 128], ["64:ff9b:1::", 48], ["100::", 64],
      ["2001:2::", 48], ["2001:10::", 28], ["2001:db8::", 32],
      ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
    ].some(([base, prefix]) => inIpv6Range(value, String(base), Number(prefix)));
  }
  return false;
}

/** Resolves hostnames immediately before use so public-looking DNS names cannot target private services. */
export async function resolvedExternalHttpsUrl(value: string) {
  const url = safeExternalHttpsUrl(value);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!isIP(host)) {
    const addresses = await lookup(host, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => !isPublicIpAddress(address))) {
      throw new Error("Private-network LTI platform URLs are not allowed.");
    }
  }
  return url;
}

export async function safeLtiFetch(input: string | URL | Request, init?: RequestInit) {
  const value = input instanceof Request ? input.url : input.toString();
  const url = await resolvedExternalHttpsUrl(value);
  // JWK endpoints must not redirect to a destination that escaped validation.
  return fetch(url, { ...init, redirect: "manual" });
}
