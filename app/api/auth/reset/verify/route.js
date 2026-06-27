// Complete a password reset: verify the OTP (purpose "reset") and set a new
// password. On success we bump tokenVersion to sign out any other devices, then
// start a fresh session so the parent is logged in immediately.
import { db } from "@/app/lib/server/db.js";
import { hashPassword } from "@/app/lib/server/password.js";
import { otpMatches, OTP_MAX_ATTEMPTS } from "@/app/lib/server/otp.js";
import { createSession } from "@/app/lib/server/session.js";
import { json, error, normalizeEmail, publicUser } from "@/app/lib/server/http.js";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return error("Invalid request");
  }
  const email = normalizeEmail(body.email);
  const code = String(body.code || "").trim();
  const newPassword = String(body.newPassword || "");

  if (newPassword.length < 8)
    return error("New password must be at least 8 characters.");

  const otp = await db.getOtp(email);
  if (!otp || otp.purpose !== "reset")
    return error("No pending reset. Please start again.", 410);
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
  if (user.flagged) return error("This account has been blocked.", 403);

  const passwordHash = await hashPassword(newPassword);
  const tokenVersion = (user.tokenVersion || 0) + 1;
  await db.updateUser(user.id, { passwordHash, tokenVersion });
  await db.deleteOtp(email);

  const updated = { ...user, passwordHash, tokenVersion };
  await createSession(updated);

  const profile = await db.getProfile(user.id);
  return json({ ok: true, user: publicUser(updated), hasProfile: !!profile });
}
