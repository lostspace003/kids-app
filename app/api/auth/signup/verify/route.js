// Verify the signup OTP. On success: mark the email verified, clear the OTP,
// and start a session. The client then proceeds to profile creation.
import { db } from "@/app/lib/server/db.js";
import {
  otpMatches,
  OTP_MAX_ATTEMPTS,
} from "@/app/lib/server/otp.js";
import { createSession } from "@/app/lib/server/session.js";
import {
  json,
  error,
  normalizeEmail,
  publicUser,
} from "@/app/lib/server/http.js";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return error("Invalid request");
  }
  const email = normalizeEmail(body.email);
  const code = String(body.code || "").trim();

  const otp = await db.getOtp(email);
  if (!otp) return error("No pending verification. Please start again.", 410);
  if (Date.now() > otp.expiresAt) {
    await db.deleteOtp(email);
    return error("That code has expired. Please request a new one.", 410);
  }
  if ((otp.attempts || 0) >= OTP_MAX_ATTEMPTS) {
    await db.deleteOtp(email);
    return error("Too many attempts. Please request a new code.", 429);
  }
  if (!otpMatches(code, otp.codeHash)) {
    await db.bumpOtpAttempts(email);
    return error("That code isn't right. Please try again.");
  }

  const user = await db.getUserByEmail(email);
  if (!user) return error("Account not found. Please start again.", 410);

  await db.updateUser(user.id, { emailVerified: true });
  await db.deleteOtp(email);
  const verified = { ...user, emailVerified: true };
  await createSession(verified);

  const profile = await db.getProfile(user.id);
  return json({ ok: true, user: publicUser(verified), hasProfile: !!profile });
}
