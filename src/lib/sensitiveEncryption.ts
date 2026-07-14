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
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
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
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(value.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(value.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
