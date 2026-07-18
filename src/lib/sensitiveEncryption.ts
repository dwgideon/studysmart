import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

export type EncryptedValue = {
  ciphertext: string;
  iv: string;
  authTag: string;
};

const GCM_IV_BYTES = 12;
const GCM_AUTH_TAG_BYTES = 16;
const MAX_SENSITIVE_CIPHERTEXT_BYTES = 256 * 1024;

function decodeStoredBase64(value: unknown, label: string, maximumBytes: number) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid encrypted ${label}.`);
  }
  const decoded = Buffer.from(value, "base64");
  // Buffer.from is deliberately forgiving. Sensitive records use canonical
  // standard Base64 so malformed or partially decoded values must be rejected.
  if (decoded.toString("base64") !== value || decoded.length > maximumBytes) {
    throw new Error(`Invalid encrypted ${label}.`);
  }
  return decoded;
}

function encryptionKey() {
  const secret =
    process.env.SAFETY_ENCRYPTION_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.DATABASE_URL;
  if (!secret) {
    throw new Error("SAFETY_ENCRYPTION_KEY is required for sensitive data.");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptSensitiveValue(content: string): EncryptedValue {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv, {
    authTagLength: GCM_AUTH_TAG_BYTES,
  });
  const ciphertext = Buffer.concat([
    cipher.update(content, "utf8"),
    cipher.final(),
  ]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptSensitiveValue(value: EncryptedValue) {
  const iv = decodeStoredBase64(value.iv, "IV", GCM_IV_BYTES);
  const authTag = decodeStoredBase64(value.authTag, "authentication tag", GCM_AUTH_TAG_BYTES);
  const ciphertext = decodeStoredBase64(
    value.ciphertext,
    "ciphertext",
    MAX_SENSITIVE_CIPHERTEXT_BYTES
  );
  if (iv.length !== GCM_IV_BYTES || authTag.length !== GCM_AUTH_TAG_BYTES) {
    throw new Error("Invalid encrypted safety record.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    iv,
    { authTagLength: GCM_AUTH_TAG_BYTES }
  );
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
