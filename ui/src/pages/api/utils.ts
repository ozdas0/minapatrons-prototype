import crypto from "crypto";

export function generateUniqueId(): string {
  // Generate 8 random bytes, convert to hex for a 16-char hex string
  const randomHex = crypto.randomBytes(8).toString("hex");
  // Take the first 11 characters of this hex string to fit CHAR(11)
  return randomHex.substring(0, 11);
}
