import { randomBytes, createCipheriv, createDecipheriv, timingSafeEqual } from "node:crypto";

// App-level envelope encryption for crown-jewel PII (SSN, bank/account numbers).
// A fresh random data key (DEK) encrypts each value; the master key (KEK) wraps
// the DEK. In production the KEK lives in a KMS / Supabase Vault; in dev it comes
// from DATA_ENCRYPTION_KEY (32 bytes, base64). AES-256-GCM gives confidentiality
// + tamper detection (decrypt throws on any modification).

const ALG = "aes-256-gcm";
const PREFIX = "enc:v1:";

function kek(): Buffer {
  const b64 = process.env.DATA_ENCRYPTION_KEY;
  if (!b64) throw new Error("DATA_ENCRYPTION_KEY is not set");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("DATA_ENCRYPTION_KEY must be 32 bytes (base64)");
  return key;
}

function gcmEncrypt(key: Buffer, plaintext: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { iv, ct, tag: cipher.getAuthTag() };
}

function gcmDecrypt(key: Buffer, iv: Buffer, ct: Buffer, tag: Buffer) {
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]);
}

const b64 = (b: Buffer) => b.toString("base64");
const fromB64 = (s: string) => Buffer.from(s, "base64");

export function encryptPII(plaintext: string, key: Buffer = kek()): string {
  const dek = randomBytes(32);
  const data = gcmEncrypt(dek, Buffer.from(plaintext, "utf8"));
  const wrapped = gcmEncrypt(key, dek); // KEK wraps the DEK
  const blob = {
    wk: b64(wrapped.iv), wd: b64(wrapped.ct), wt: b64(wrapped.tag),
    iv: b64(data.iv), ct: b64(data.ct), tag: b64(data.tag),
  };
  return PREFIX + Buffer.from(JSON.stringify(blob)).toString("base64");
}

export function decryptPII(token: string, key: Buffer = kek()): string {
  if (!token.startsWith(PREFIX)) throw new Error("not an envelope token");
  const blob = JSON.parse(fromB64(token.slice(PREFIX.length)).toString("utf8"));
  const dek = gcmDecrypt(key, fromB64(blob.wk), fromB64(blob.wd), fromB64(blob.wt));
  return gcmDecrypt(dek, fromB64(blob.iv), fromB64(blob.ct), fromB64(blob.tag)).toString("utf8");
}

export function isEncrypted(s: string | null | undefined): boolean {
  return typeof s === "string" && s.startsWith(PREFIX);
}

// Constant-time compare for any equality checks on decrypted secrets.
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
