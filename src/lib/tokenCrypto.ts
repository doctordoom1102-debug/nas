import crypto from "crypto";

const TOKEN_KEY = "398a748baa05b5a5";

/**
 * Encrypt token for exe compatibility.
 * Matches C# Decryptsensor: AES-128-CBC, IV prepended, base64 output.
 */
export function encryptToken(plainText: string): string {
  const key = Buffer.from(TOKEN_KEY, "utf8");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, encrypted]).toString("base64");
}
