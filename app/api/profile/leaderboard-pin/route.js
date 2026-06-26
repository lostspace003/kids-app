// POST /api/profile/leaderboard-pin — PIN-protected leaderboard visibility.
// body.action:
//   "apply"        { lbOptOut, pin? , newPin? }  change visibility (PIN-gated;
//                    first time requires newPin to create the PIN)
//   "reset-start"  {}                              email a 6-digit OTP
//   "reset-verify" { otp, newPin, lbOptOut? }      reset the PIN via OTP
import { db } from "@/app/lib/server/db.js";
import { getCurrentUser } from "@/app/lib/server/session.js";
import { json, error } from "@/app/lib/server/http.js";
import { hashPassword, verifyPassword } from "@/app/lib/server/password.js";
import { generateOtp, hashOtp, otpMatches, OTP_TTL_MS, OTP_MAX_ATTEMPTS } from "@/app/lib/server/otp.js";
import { sendOtpEmail } from "@/app/lib/server/email.js";
import { publicProfile } from "@/app/api/auth/me/route.js";

const isPin = (s) => /^\d{4}$/.test(String(s || ""));

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return error("Not signed in.", 401);
  const profile = await db.getProfile(user.id);
  if (!profile) return error("No profile.", 404);

  let body;
  try { body = await req.json(); } catch { return error("Invalid request"); }
  const action = body.action || "apply";

  // --- forgot PIN: email an OTP ------------------------------------------
  if (action === "reset-start") {
    const code = generateOtp();
    await db.saveOtp(user.email, { codeHash: hashOtp(code), expiresAt: Date.now() + OTP_TTL_MS, attempts: 0, purpose: "lbpin" });
    await sendOtpEmail(user.email, code);
    return json({ ok: true, sent: true });
  }

  // --- reset PIN with the OTP -------------------------------------------
  if (action === "reset-verify") {
    if (!isPin(body.newPin)) return error("PIN must be 4 digits.");
    const rec = await db.getOtp(user.email);
    if (!rec || rec.purpose !== "lbpin") return error("Request a reset code first.");
    if (Date.now() > rec.expiresAt) { await db.deleteOtp(user.email); return error("Code expired — request a new one."); }
    if ((rec.attempts || 0) >= OTP_MAX_ATTEMPTS) { await db.deleteOtp(user.email); return error("Too many attempts — request a new code."); }
    if (!otpMatches(String(body.otp || ""), rec.codeHash)) { await db.bumpOtpAttempts(user.email); return error("Incorrect code."); }
    await db.deleteOtp(user.email);
    const patch = { lbPinHash: await hashPassword(body.newPin), updatedAt: new Date().toISOString() };
    if (body.lbOptOut != null) patch.lbOptOut = !!body.lbOptOut;
    const p = await db.upsertProfile(user.id, patch);
    return json({ ok: true, profile: publicProfile(p) });
  }

  // --- apply a visibility change (PIN-gated) ----------------------------
  const patch = { updatedAt: new Date().toISOString() };
  if (profile.lbPinHash) {
    if (!isPin(body.pin) || !(await verifyPassword(body.pin, profile.lbPinHash))) return error("Incorrect PIN.", 403);
    if (body.newPin != null) { // optional PIN rotation
      if (!isPin(body.newPin)) return error("New PIN must be 4 digits.");
      patch.lbPinHash = await hashPassword(body.newPin);
    }
  } else {
    // First time: create the protecting PIN now.
    if (!isPin(body.newPin)) return error("Set a 4-digit PIN to protect this.");
    patch.lbPinHash = await hashPassword(body.newPin);
  }
  if (body.lbOptOut != null) patch.lbOptOut = !!body.lbOptOut;
  const p = await db.upsertProfile(user.id, patch);
  return json({ ok: true, profile: publicProfile(p) });
}
