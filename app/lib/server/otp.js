// OTP helpers: generate a 6-digit code, hash it (sha256) for storage, and
// compare in constant time. Codes expire after 10 minutes; callers cap attempts.
import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(code) {
  return createHash("sha256").update(String(code)).digest("hex");
}

export function otpMatches(code, storedHash) {
  const a = Buffer.from(hashOtp(code));
  const b = Buffer.from(storedHash || "");
  return a.length === b.length && timingSafeEqual(a, b);
}
